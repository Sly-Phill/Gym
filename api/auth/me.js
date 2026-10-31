import { getSql } from '../_lib/db.js'
import { endSession, publicUser } from '../_lib/auth.js'
import { HttpError } from '../_lib/errors.js'
import { handler } from '../_lib/handler.js'

export default handler({ methods: ['GET'], auth: true }, async (req, res) => {
  const sql = getSql()
  const [user] = await sql`
    SELECT id, email, full_name, weekly_goal_workouts, weekly_goal_minutes, created_at
    FROM users WHERE id = ${req.userId}`
  if (!user) {
    endSession(res)
    throw new HttpError(401, 'Your session has expired. Please log in again.')
  }
  res.status(200).json({ user: publicUser(user) })
})
