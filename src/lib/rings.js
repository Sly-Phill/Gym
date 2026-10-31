const ratio = (value, goal) => {
  const v = Number(value)
  const g = Number(goal)
  if (!Number.isFinite(v) || !Number.isFinite(g) || g <= 0 || v <= 0) return 0
  return Math.min(1, v / g)
}

/** Progress-ring data for the dashboard. `progress` is always 0..1 and `percent` 0..100, never NaN. */
export function buildRings(user, week) {
  const rings = [
    { label: 'Workouts', value: week?.workouts, goal: user?.weeklyGoalWorkouts, unit: '', color: '#c6ff00' },
    { label: 'Active min', value: week?.minutes, goal: user?.weeklyGoalMinutes, unit: 'min', color: '#00e5ff' },
    {
      label: 'Goals hit',
      value: week?.goalsHit,
      goal: user?.weeklyGoalWorkouts,
      unit: week?.sessionTarget ? `≥ ${week.sessionTarget} min` : '',
      color: '#ff4fd8',
    },
  ]
  return rings.map((r) => {
    const value = Number.isFinite(Number(r.value)) ? Number(r.value) : 0
    const goal = Number.isFinite(Number(r.goal)) ? Number(r.goal) : 0
    const progress = ratio(value, goal)
    return { ...r, value, goal, progress, percent: Math.round(progress * 100) }
  })
}
