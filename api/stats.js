import { getSql } from './_lib/db.js'
import { handler } from './_lib/handler.js'

// Public, aggregate-only numbers for the landing page.
export default handler({ methods: ['GET'] }, async (req, res) => {
  const sql = getSql()
  const [row] = await sql`
    SELECT
      (SELECT count(*) FROM users)::int AS members,
      (SELECT count(*) FROM workouts WHERE status = 'completed')::int AS "workoutsCompleted",
      (SELECT count(*) FROM classes
        WHERE start_time >= date_trunc('week', now())
          AND start_time <  date_trunc('week', now()) + interval '7 days')::int AS "classesThisWeek"`
  res.setHeader('Cache-Control', 'public, max-age=30')
  res.status(200).json(row)
})
