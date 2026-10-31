import bcrypt from 'bcryptjs'
import { getSql } from '../_lib/db.js'
import { publicUser, startSession } from '../_lib/auth.js'
import { HttpError } from '../_lib/errors.js'
import { body, handler } from '../_lib/handler.js'

// Compared against when the email doesn't exist, so response time doesn't reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('pulsefit-timing-guard', 10)

export default handler({ methods: ['POST'] }, async (req, res) => {
  const b = body(req)
  const email = String(b.email ?? '').trim().toLowerCase()
  const password = String(b.password ?? '')
  if (!email || !password) throw new HttpError(400, 'Please enter your email and password.')

  const sql = getSql()
  const [user] = await sql`
    SELECT id, email, password_hash, full_name, weekly_goal_workouts, weekly_goal_minutes, created_at
    FROM users WHERE email = ${email}`

  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH)
  if (!user || !ok) throw new HttpError(401, 'That email and password don’t match. Please try again.', 'invalid_credentials')

  await startSession(res, user.id)
  res.status(200).json({ user: publicUser(user) })
})
