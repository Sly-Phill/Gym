// Loads one user's workout for a date, with its exercises and sets nested.
export async function loadWorkout(sql, userId, date) {
  const rows = await sql`
    SELECT
      w.id,
      w.name,
      w.status,
      to_char(w.workout_date, 'YYYY-MM-DD') AS "workoutDate",
      w.duration_minutes AS "durationMinutes",
      w.started_at AS "startedAt",
      w.completed_at AS "completedAt",
      COALESCE((
        SELECT json_agg(json_build_object(
          'workoutExerciseId', we.id,
          'exerciseId', e.id,
          'name', e.name,
          'muscleGroup', e.muscle_group,
          'reps', e.reps,
          'difficulty', e.difficulty,
          'restSeconds', e.rest_seconds,
          'description', e.description,
          'sets', COALESCE((
            SELECT json_agg(json_build_object('id', s.id, 'setNumber', s.set_number, 'completed', s.completed)
                            ORDER BY s.set_number)
            FROM workout_sets s
            WHERE s.workout_exercise_id = we.id
          ), '[]'::json)
        ) ORDER BY we.order_index, we.id)
        FROM workout_exercises we
        JOIN exercises e ON e.id = we.exercise_id
        WHERE we.workout_id = w.id
      ), '[]'::json) AS exercises
    FROM workouts w
    WHERE w.user_id = ${userId} AND w.workout_date = ${date}::date`
  return rows[0] ?? null
}

// Names the workout after its muscle groups, e.g. "Chest & Arms Day".
export async function renameWorkout(sql, workoutId) {
  await sql`
    UPDATE workouts w SET name = COALESCE((
      SELECT CASE
        WHEN COUNT(DISTINCT e.muscle_group) = 0 THEN NULL
        WHEN COUNT(DISTINCT e.muscle_group) <= 2
          THEN string_agg(DISTINCT e.muscle_group, ' & ' ORDER BY e.muscle_group) || ' Day'
        ELSE 'Full Body Mix'
      END
      FROM workout_exercises we
      JOIN exercises e ON e.id = we.exercise_id
      WHERE we.workout_id = w.id
    ), 'Today''s Workout')
    WHERE w.id = ${workoutId}`
}
