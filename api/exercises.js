import { getSql } from './_lib/db.js'
import { HttpError } from './_lib/errors.js'
import { handler } from './_lib/handler.js'

const GROUPS = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']

// The exercise catalog is shared by everyone, so no login is needed to read it.
export default handler({ methods: ['GET'] }, async (req, res) => {
  const group = req.query?.muscleGroup
  if (group && !GROUPS.includes(group)) {
    throw new HttpError(400, `muscleGroup must be one of: ${GROUPS.join(', ')}.`)
  }
  const sql = getSql()
  const exercises = await sql`
    SELECT id, name, muscle_group AS "muscleGroup", sets, reps, difficulty,
           rest_seconds AS "restSeconds", description
    FROM exercises
    WHERE ${group ?? null}::text IS NULL OR muscle_group = ${group ?? null}
    ORDER BY array_position(${GROUPS}::text[], muscle_group),
             array_position(ARRAY['Beginner','Intermediate','Advanced'], difficulty), name`
  res.status(200).json({ exercises })
})
