export function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/**
 * Current and best run of consecutive days with a completed workout.
 * If today's workout isn't done yet, the current streak is still alive from yesterday.
 */
export function streaks(completedDates, today) {
  const done = new Set(completedDates.filter((d) => d <= today))
  let cursor = done.has(today) ? today : addDays(today, -1)
  let current = 0
  while (done.has(cursor)) {
    current++
    cursor = addDays(cursor, -1)
  }
  let best = 0
  let run = 0
  let prev = null
  for (const d of [...done].sort()) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return { current, best: Math.max(best, current) }
}
