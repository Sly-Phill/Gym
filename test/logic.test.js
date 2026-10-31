import { describe, expect, it } from 'vitest'
import { addDays, streaks } from '../api/_lib/streaks.js'
import { buildRings } from '../src/lib/rings.js'

const TODAY = '2031-03-12'
const ago = (n) => addDays(TODAY, -n)

describe('streaks() with fake dates', () => {
  it('no workouts → 0', () => {
    expect(streaks([], TODAY)).toEqual({ current: 0, best: 0 })
  })

  it('3 days in a row ending today → 3', () => {
    expect(streaks([ago(2), ago(1), TODAY], TODAY)).toEqual({ current: 3, best: 3 })
  })

  it('a missed day resets the streak', () => {
    expect(streaks([ago(5), ago(4), ago(3), ago(1)], TODAY)).toEqual({ current: 1, best: 3 })
  })

  it('today plus yesterday → 2', () => {
    expect(streaks([ago(1), TODAY], TODAY)).toEqual({ current: 2, best: 2 })
  })

  it("is still alive from yesterday when today isn't done yet", () => {
    expect(streaks([ago(3), ago(2), ago(1)], TODAY).current).toBe(3)
  })

  it('is 0 when the last workout was 2+ days ago', () => {
    expect(streaks([ago(2)], TODAY)).toEqual({ current: 0, best: 1 })
  })

  it('handles duplicates, unsorted input and month/year boundaries', () => {
    expect(streaks(['2031-01-01', '2030-12-31', '2030-12-31', '2030-12-30'], '2031-01-01')).toEqual({ current: 3, best: 3 })
    expect(streaks(['2032-03-01', '2032-02-29', '2032-02-28'], '2032-03-01').current).toBe(3) // leap year
  })

  it('ignores dates after "today"', () => {
    expect(streaks([TODAY, addDays(TODAY, 1)], TODAY)).toEqual({ current: 1, best: 1 })
  })
})

describe('buildRings()', () => {
  const user = { weeklyGoalWorkouts: 4, weeklyGoalMinutes: 120 }

  it('computes progress and percentages', () => {
    const rings = buildRings(user, { workouts: 2, minutes: 30, goalsHit: 1, sessionTarget: 30 })
    expect(rings.map((r) => r.percent)).toEqual([50, 25, 25])
    expect(rings[2].unit).toBe('≥ 30 min')
  })

  it('never goes above 100%', () => {
    const rings = buildRings(user, { workouts: 9, minutes: 999, goalsHit: 8, sessionTarget: 30 })
    for (const r of rings) {
      expect(r.progress).toBe(1)
      expect(r.percent).toBe(100)
    }
  })

  it.each([
    ['missing week data', user, undefined],
    ['missing user', undefined, { workouts: 2, minutes: 30, goalsHit: 1 }],
    ['zero goals', { weeklyGoalWorkouts: 0, weeklyGoalMinutes: 0 }, { workouts: 2, minutes: 30, goalsHit: 1 }],
    ['null and string values', { weeklyGoalWorkouts: '4', weeklyGoalMinutes: null }, { workouts: null, minutes: 'abc', goalsHit: NaN }],
    ['negative values', user, { workouts: -3, minutes: -10, goalsHit: -1 }],
  ])('never shows NaN with %s', (_, u, w) => {
    for (const r of buildRings(u, w)) {
      expect(Number.isFinite(r.progress)).toBe(true)
      expect(Number.isFinite(r.percent)).toBe(true)
      expect(Number.isFinite(r.value)).toBe(true)
      expect(Number.isFinite(r.goal)).toBe(true)
      expect(r.percent).toBeGreaterThanOrEqual(0)
      expect(r.percent).toBeLessThanOrEqual(100)
    }
  })
})
