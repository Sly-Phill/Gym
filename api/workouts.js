import { getSql } from './_lib/db.js'
import { HttpError } from './_lib/errors.js'
import { body, handler, positiveInt, requestDate } from './_lib/handler.js'
import { loadWorkout, renameWorkout } from './_lib/workouts.js'

/*
  GET    /api/workouts?date=YYYY-MM-DD           -> today's workout (or null)
  POST   /api/workouts { action: 'add', exerciseId, date }
         /api/workouts { action: 'start' | 'finish', workoutId, date }
  DELETE /api/workouts?workoutExerciseId=123&date=YYYY-MM-DD
  Every query is scoped to req.userId, so users only ever see their own workouts.
*/
export default handler({ methods: ['GET', 'POST', 'DELETE'], auth: true }, async (req, res) => {
  const sql = getSql()
  const userId = req.userId

  if (req.method === 'GET') {
    const date = requestDate(req.query?.date)
    return res.status(200).json({ workout: await loadWorkout(sql, userId, date) })
  }

  if (req.method === 'DELETE') {
    const date = requestDate(req.query?.date)
    const workoutExerciseId = positiveInt(req.query?.workoutExerciseId, 'workoutExerciseId')
    const [removed] = await sql`
      DELETE FROM workout_exercises we
      USING workouts w
      WHERE we.id = ${workoutExerciseId}
        AND we.workout_id = w.id
        AND w.user_id = ${userId}
        AND w.status <> 'completed'
      RETURNING w.id AS workout_id`
    if (!removed) throw new HttpError(404, "That exercise isn't in an editable workout.")
    await renameWorkout(sql, removed.workout_id)
    return res.status(200).json({ workout: await loadWorkout(sql, userId, date) })
  }

  const b = body(req)
  const date = requestDate(b.date)

  if (b.action === 'add') {
    const exerciseId = positiveInt(b.exerciseId, 'exerciseId')
    const [exercise] = await sql`SELECT id, name FROM exercises WHERE id = ${exerciseId}`
    if (!exercise) throw new HttpError(404, "We couldn't find that exercise.")

    // Create today's workout if needed, attach the exercise and create its sets, all in one statement.
    const [result] = await sql`
      WITH w AS (
        INSERT INTO workouts (user_id, name, workout_date)
        VALUES (${userId}, 'Today''s Workout', ${date}::date)
        ON CONFLICT (user_id, workout_date) DO UPDATE SET name = workouts.name
        RETURNING id, status
      ), we AS (
        INSERT INTO workout_exercises (workout_id, exercise_id, order_index)
        SELECT w.id, ${exerciseId},
               COALESCE((SELECT MAX(order_index) + 1 FROM workout_exercises x WHERE x.workout_id = w.id), 0)
        FROM w
        WHERE w.status <> 'completed'
        ON CONFLICT (workout_id, exercise_id) DO NOTHING
        RETURNING id
      ), s AS (
        INSERT INTO workout_sets (workout_exercise_id, set_number)
        SELECT we.id, gs
        FROM we
        CROSS JOIN exercises e
        CROSS JOIN LATERAL generate_series(1, e.sets) AS gs
        WHERE e.id = ${exerciseId}
        RETURNING 1
      )
      SELECT (SELECT id FROM w) AS workout_id,
             (SELECT status FROM w) AS status,
             (SELECT id FROM we) AS workout_exercise_id`

    if (result.status === 'completed') {
      throw new HttpError(409, "You've already finished today's workout. Great job! Add more tomorrow.", 'workout_completed')
    }
    if (result.workout_exercise_id) await renameWorkout(sql, result.workout_id)
    return res.status(result.workout_exercise_id ? 201 : 200).json({
      added: Boolean(result.workout_exercise_id),
      workout: await loadWorkout(sql, userId, date),
    })
  }

  if (b.action === 'start' || b.action === 'finish') {
    const workoutId = positiveInt(b.workoutId, 'workoutId')
    const rows =
      b.action === 'start'
        ? await sql`
            UPDATE workouts
            SET status = 'in_progress', started_at = COALESCE(started_at, now())
            WHERE id = ${workoutId} AND user_id = ${userId} AND status = 'planned'
            RETURNING id`
        : await sql`
            UPDATE workouts
            SET status = 'completed',
                completed_at = now(),
                started_at = COALESCE(started_at, now()),
                duration_minutes = GREATEST(1, CEIL(EXTRACT(EPOCH FROM (now() - COALESCE(started_at, now()))) / 60))::int
            WHERE id = ${workoutId} AND user_id = ${userId} AND status <> 'completed'
            RETURNING id`

    if (!rows.length) {
      // Either it's not this user's workout, or it was already started/finished (treated as success).
      const [own] = await sql`SELECT id FROM workouts WHERE id = ${workoutId} AND user_id = ${userId}`
      if (!own) throw new HttpError(404, "We couldn't find that workout.")
    }
    return res.status(200).json({ workout: await loadWorkout(sql, userId, date) })
  }

  throw new HttpError(400, "Unknown action. Use 'add', 'start' or 'finish'.")
})
