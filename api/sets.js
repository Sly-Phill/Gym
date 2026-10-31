import { getSql } from './_lib/db.js'
import { HttpError } from './_lib/errors.js'
import { body, handler, positiveInt } from './_lib/handler.js'

// PATCH /api/sets { setId, completed } -> ticks or unticks one set of the user's own workout.
export default handler({ methods: ['PATCH'], auth: true }, async (req, res) => {
  const b = body(req)
  const setId = positiveInt(b.setId, 'setId')
  if (typeof b.completed !== 'boolean') throw new HttpError(400, 'completed must be true or false.')
  const completed = b.completed

  const sql = getSql()
  const [row] = await sql`
    WITH target AS (
      SELECT s.id, w.id AS workout_id, w.status
      FROM workout_sets s
      JOIN workout_exercises we ON we.id = s.workout_exercise_id
      JOIN workouts w ON w.id = we.workout_id
      WHERE s.id = ${setId} AND w.user_id = ${req.userId}
    ), updated AS (
      UPDATE workout_sets
      SET completed = ${completed}::boolean,
          completed_at = CASE WHEN ${completed}::boolean THEN now() ELSE NULL END
      WHERE id = (SELECT id FROM target) AND (SELECT status FROM target) <> 'completed'
      RETURNING id, completed
    ), started AS (
      -- Ticking the first set starts the workout clock.
      UPDATE workouts
      SET status = 'in_progress', started_at = COALESCE(started_at, now())
      WHERE id = (SELECT workout_id FROM target) AND status = 'planned' AND ${completed}::boolean
      RETURNING started_at
    )
    SELECT (SELECT status FROM target) AS workout_status,
           (SELECT id FROM updated) AS id,
           (SELECT completed FROM updated) AS completed,
           (SELECT started_at FROM started) AS started_at`

  if (!row.workout_status) throw new HttpError(404, "We couldn't find that set.")
  if (row.workout_status === 'completed') {
    throw new HttpError(409, 'This workout is already finished, so its sets are locked.', 'workout_completed')
  }
  res.status(200).json({ set: { id: row.id, completed: row.completed }, startedAt: row.started_at })
})
