import { getSql } from './_lib/db.js'
import { HttpError } from './_lib/errors.js'
import { handler, requestDate } from './_lib/handler.js'
import { loadWorkout } from './_lib/workouts.js'
import { streaks } from './_lib/streaks.js'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const dayName = (iso) => DAY_NAMES[new Date(`${iso}T00:00:00Z`).getUTCDay()]

export default handler({ methods: ['GET'], auth: true }, async (req, res) => {
  const sql = getSql()
  const userId = req.userId
  const date = requestDate(req.query?.date)

  const [[user], today, activity, completedDates, [week], [nextClass]] = await Promise.all([
    sql`SELECT full_name, weekly_goal_workouts, weekly_goal_minutes FROM users WHERE id = ${userId}`,
    loadWorkout(sql, userId, date),
    // Active minutes per day for the last 14 days (7 shown + 7 for the week-over-week comparison)
    sql`
      SELECT to_char(d::date, 'YYYY-MM-DD') AS date, COALESCE(SUM(w.duration_minutes), 0)::int AS minutes
      FROM generate_series(${date}::date - 13, ${date}::date, interval '1 day') AS d
      LEFT JOIN workouts w
        ON w.workout_date = d::date AND w.user_id = ${userId} AND w.status = 'completed'
      GROUP BY d ORDER BY d`,
    sql`
      SELECT to_char(workout_date, 'YYYY-MM-DD') AS date
      FROM workouts WHERE user_id = ${userId} AND status = 'completed' AND workout_date <= ${date}::date`,
    // This calendar week (Monday to Sunday) of the user's date
    sql`
      WITH bounds AS (SELECT date_trunc('week', ${date}::date)::date AS start),
           goals AS (
             SELECT weekly_goal_workouts AS gw,
                    CEIL(weekly_goal_minutes::numeric / weekly_goal_workouts)::int AS session_target
             FROM users WHERE id = ${userId})
      SELECT count(w.id)::int AS workouts,
             COALESCE(SUM(w.duration_minutes), 0)::int AS minutes,
             count(w.id) FILTER (WHERE w.duration_minutes >= goals.session_target)::int AS "goalsHit",
             goals.session_target AS "sessionTarget"
      FROM bounds CROSS JOIN goals
      LEFT JOIN workouts w
        ON w.user_id = ${userId} AND w.status = 'completed'
       AND w.workout_date >= bounds.start AND w.workout_date < bounds.start + 7
      GROUP BY goals.session_target`,
    sql`
      SELECT id, title, coach_name AS "coachName", start_time AS "startTime",
             duration_minutes AS "durationMinutes", capacity, intensity
      FROM classes WHERE start_time > now() ORDER BY start_time LIMIT 1`,
  ])

  if (!user) throw new HttpError(401, 'Your session has expired. Please log in again.')

  const last7 = activity.slice(7).map((d) => ({ ...d, day: dayName(d.date) }))
  const totalMinutes = last7.reduce((s, d) => s + d.minutes, 0)
  const prevMinutes = activity.slice(0, 7).reduce((s, d) => s + d.minutes, 0)

  res.status(200).json({
    user: {
      fullName: user.full_name,
      weeklyGoalWorkouts: user.weekly_goal_workouts,
      weeklyGoalMinutes: user.weekly_goal_minutes,
    },
    today,
    weeklyActivity: last7,
    totalMinutes,
    prevMinutes,
    streak: streaks(completedDates.map((r) => r.date), date),
    week,
    nextClass: nextClass ?? null,
  })
})
