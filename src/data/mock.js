// Realistic mock data for PulseFit. Swap these out for API calls later.

export const user = {
  name: 'Alex Rivera',
  handle: '@alexlifts',
  initials: 'AR',
  membership: 'Elite',
  memberSince: 'March 2024',
  level: 27,
  xp: 7420,
  xpNext: 9000,
  streak: 12,
  bestStreak: 31,
  weight: '78 kg',
  height: '182 cm',
  goal: 'Build lean muscle',
  homeGym: 'PulseFit Downtown',
}

export const heroStats = [
  { label: 'Active members', value: 48210, suffix: '+' },
  { label: 'Workouts completed', value: 1.26, suffix: 'M', decimals: 2 },
  { label: 'Classes this week', value: 342, suffix: '' },
]

export const weeklyActivity = [
  { day: 'Mon', minutes: 52, calories: 480 },
  { day: 'Tue', minutes: 38, calories: 360 },
  { day: 'Wed', minutes: 64, calories: 610 },
  { day: 'Thu', minutes: 0, calories: 0 },
  { day: 'Fri', minutes: 71, calories: 690 },
  { day: 'Sat', minutes: 45, calories: 420 },
  { day: 'Sun', minutes: 28, calories: 240 },
]

export const weeklyRings = [
  { label: 'Workouts', value: 5, goal: 6, unit: '', color: '#c6ff00' },
  { label: 'Active min', value: 298, goal: 360, unit: 'min', color: '#00e5ff' },
  { label: 'Goals hit', value: 7, goal: 10, unit: '', color: '#ff4fd8' },
]

export const muscleGroups = ['All', 'Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']

export const exercises = [
  { id: 'bench', name: 'Barbell Bench Press', group: 'Chest', sets: 4, reps: '6-8', rest: 90, difficulty: 'Advanced', equipment: 'Barbell', kcal: 120 },
  { id: 'incline-db', name: 'Incline Dumbbell Press', group: 'Chest', sets: 3, reps: '8-10', rest: 75, difficulty: 'Intermediate', equipment: 'Dumbbells', kcal: 95 },
  { id: 'pushup', name: 'Tempo Push-Ups', group: 'Chest', sets: 3, reps: '15', rest: 45, difficulty: 'Beginner', equipment: 'Bodyweight', kcal: 60 },
  { id: 'deadlift', name: 'Conventional Deadlift', group: 'Back', sets: 5, reps: '5', rest: 120, difficulty: 'Advanced', equipment: 'Barbell', kcal: 160 },
  { id: 'pullup', name: 'Weighted Pull-Ups', group: 'Back', sets: 4, reps: '6-8', rest: 90, difficulty: 'Advanced', equipment: 'Pull-up bar', kcal: 90 },
  { id: 'row', name: 'Seated Cable Row', group: 'Back', sets: 3, reps: '10-12', rest: 60, difficulty: 'Beginner', equipment: 'Cable', kcal: 70 },
  { id: 'squat', name: 'Back Squat', group: 'Legs', sets: 5, reps: '5', rest: 120, difficulty: 'Advanced', equipment: 'Barbell', kcal: 170 },
  { id: 'rdl', name: 'Romanian Deadlift', group: 'Legs', sets: 3, reps: '8-10', rest: 90, difficulty: 'Intermediate', equipment: 'Barbell', kcal: 110 },
  { id: 'lunge', name: 'Walking Lunges', group: 'Legs', sets: 3, reps: '12 / leg', rest: 60, difficulty: 'Beginner', equipment: 'Dumbbells', kcal: 95 },
  { id: 'curl', name: 'Incline Dumbbell Curl', group: 'Arms', sets: 3, reps: '10-12', rest: 60, difficulty: 'Beginner', equipment: 'Dumbbells', kcal: 45 },
  { id: 'dips', name: 'Parallel Bar Dips', group: 'Arms', sets: 3, reps: '8-12', rest: 75, difficulty: 'Intermediate', equipment: 'Dip bars', kcal: 70 },
  { id: 'skull', name: 'EZ-Bar Skull Crushers', group: 'Arms', sets: 3, reps: '10', rest: 60, difficulty: 'Intermediate', equipment: 'EZ bar', kcal: 50 },
  { id: 'plank', name: 'Weighted Plank', group: 'Core', sets: 3, reps: '45 s', rest: 45, difficulty: 'Beginner', equipment: 'Plate', kcal: 35 },
  { id: 'hlr', name: 'Hanging Leg Raises', group: 'Core', sets: 3, reps: '12', rest: 60, difficulty: 'Intermediate', equipment: 'Pull-up bar', kcal: 45 },
  { id: 'abwheel', name: 'Ab Wheel Rollouts', group: 'Core', sets: 3, reps: '10', rest: 60, difficulty: 'Advanced', equipment: 'Ab wheel', kcal: 50 },
  { id: 'rower', name: 'Rower Intervals', group: 'Cardio', sets: 6, reps: '250 m', rest: 60, difficulty: 'Intermediate', equipment: 'Rower', kcal: 140 },
  { id: 'bike', name: 'Assault Bike Sprints', group: 'Cardio', sets: 8, reps: '20 s', rest: 40, difficulty: 'Advanced', equipment: 'Air bike', kcal: 150 },
  { id: 'jumprope', name: 'Jump Rope Flow', group: 'Cardio', sets: 5, reps: '2 min', rest: 45, difficulty: 'Beginner', equipment: 'Rope', kcal: 110 },
]

const byId = (id) => exercises.find((e) => e.id === id)

export const todaysWorkout = {
  title: 'Push Power',
  subtitle: 'Upper body · Strength focus',
  duration: 48,
  kcal: 420,
  exercises: [
    { ...byId('bench'), weight: '80 kg' },
    { ...byId('incline-db'), weight: '28 kg' },
    { ...byId('dips'), weight: '+10 kg' },
    { ...byId('skull'), weight: '30 kg' },
  ],
}

export const strengthHistory = [
  { month: 'May', bench: 65, squat: 90, deadlift: 110 },
  { month: 'Jun', bench: 67.5, squat: 95, deadlift: 117.5 },
  { month: 'Jul', bench: 70, squat: 100, deadlift: 125 },
  { month: 'Aug', bench: 72.5, squat: 105, deadlift: 130 },
  { month: 'Sep', bench: 75, squat: 112.5, deadlift: 140 },
  { month: 'Oct', bench: 80, squat: 120, deadlift: 150 },
]

export const lifts = [
  { key: 'deadlift', label: 'Deadlift', color: '#c6ff00' },
  { key: 'squat', label: 'Squat', color: '#00e5ff' },
  { key: 'bench', label: 'Bench', color: '#ff4fd8' },
]

export const personalRecords = [
  { lift: 'Deadlift', value: '150', unit: 'kg', date: 'Oct 12', delta: '+10 kg', tier: 'gold' },
  { lift: 'Back Squat', value: '120', unit: 'kg', date: 'Oct 08', delta: '+7.5 kg', tier: 'gold' },
  { lift: 'Bench Press', value: '80', unit: 'kg', date: 'Oct 03', delta: '+5 kg', tier: 'silver' },
  { lift: 'Pull-Ups', value: '18', unit: 'reps', date: 'Sep 27', delta: '+3 reps', tier: 'silver' },
  { lift: '5K Run', value: '22:41', unit: '', date: 'Sep 19', delta: '-48 s', tier: 'bronze' },
  { lift: 'Plank', value: '3:30', unit: '', date: 'Sep 02', delta: '+40 s', tier: 'bronze' },
]

export const classTypes = {
  Yoga: { color: '#a78bfa', image: '/images/class-yoga.svg' },
  HIIT: { color: '#c6ff00', image: '/images/class-hiit.svg' },
  Spin: { color: '#00e5ff', image: '/images/class-spin.svg' },
  Boxing: { color: '#ff5d73', image: '/images/class-boxing.svg' },
}

export const schedule = [
  { day: 'Mon', date: 20, classes: [
    { id: 'c1', type: 'HIIT', name: 'Metcon Blast', time: '06:30', duration: 45, coach: 'Jordan K.', spots: 4, capacity: 20, room: 'Studio A' },
    { id: 'c2', type: 'Yoga', name: 'Vinyasa Flow', time: '12:15', duration: 60, coach: 'Maya L.', spots: 9, capacity: 18, room: 'Zen Room' },
    { id: 'c3', type: 'Boxing', name: 'Fight Fit', time: '18:30', duration: 50, coach: 'Dre M.', spots: 0, capacity: 16, room: 'The Ring' },
  ]},
  { day: 'Tue', date: 21, classes: [
    { id: 'c4', type: 'Spin', name: 'Rhythm Ride', time: '07:00', duration: 45, coach: 'Sam T.', spots: 2, capacity: 24, room: 'Cycle Lab' },
    { id: 'c5', type: 'HIIT', name: 'Tabata Burn', time: '17:45', duration: 30, coach: 'Jordan K.', spots: 11, capacity: 20, room: 'Studio A' },
  ]},
  { day: 'Wed', date: 22, classes: [
    { id: 'c6', type: 'Yoga', name: 'Power Yoga', time: '06:45', duration: 50, coach: 'Maya L.', spots: 6, capacity: 18, room: 'Zen Room' },
    { id: 'c7', type: 'Boxing', name: 'Bag Work & Core', time: '12:00', duration: 45, coach: 'Dre M.', spots: 7, capacity: 16, room: 'The Ring' },
    { id: 'c8', type: 'Spin', name: 'Climb Club', time: '19:00', duration: 50, coach: 'Sam T.', spots: 13, capacity: 24, room: 'Cycle Lab' },
  ]},
  { day: 'Thu', date: 23, classes: [
    { id: 'c9', type: 'HIIT', name: 'Engine Builder', time: '06:30', duration: 45, coach: 'Priya S.', spots: 1, capacity: 20, room: 'Studio A' },
    { id: 'c10', type: 'Yoga', name: 'Yin & Recover', time: '20:00', duration: 60, coach: 'Maya L.', spots: 12, capacity: 18, room: 'Zen Room' },
  ]},
  { day: 'Fri', date: 24, classes: [
    { id: 'c11', type: 'Boxing', name: 'Southpaw Session', time: '07:15', duration: 50, coach: 'Dre M.', spots: 5, capacity: 16, room: 'The Ring' },
    { id: 'c12', type: 'Spin', name: 'Friday Night Lights', time: '18:00', duration: 45, coach: 'Sam T.', spots: 3, capacity: 24, room: 'Cycle Lab' },
    { id: 'c13', type: 'HIIT', name: 'Sweat Social', time: '19:00', duration: 40, coach: 'Priya S.', spots: 8, capacity: 20, room: 'Studio A' },
  ]},
  { day: 'Sat', date: 25, classes: [
    { id: 'c14', type: 'Yoga', name: 'Sunrise Flow', time: '08:00', duration: 60, coach: 'Maya L.', spots: 10, capacity: 18, room: 'Rooftop' },
    { id: 'c15', type: 'HIIT', name: 'Partner WOD', time: '10:00', duration: 60, coach: 'Jordan K.', spots: 6, capacity: 20, room: 'Studio A' },
  ]},
  { day: 'Sun', date: 26, classes: [] },
]

export const achievements = [
  { id: 'a1', name: 'Iron Streak', desc: '10-day workout streak', icon: 'Flame', unlocked: true, color: '#ff7a1a' },
  { id: 'a2', name: 'Century Club', desc: '100 workouts logged', icon: 'Dumbbell', unlocked: true, color: '#c6ff00' },
  { id: 'a3', name: 'Early Bird', desc: '20 sessions before 7am', icon: 'Sunrise', unlocked: true, color: '#ffd23f' },
  { id: 'a4', name: 'PR Machine', desc: 'Set 5 PRs in a month', icon: 'Trophy', unlocked: true, color: '#00e5ff' },
  { id: 'a5', name: 'Class Act', desc: 'Attend 25 classes', icon: 'Calendar', unlocked: false, progress: 0.72, color: '#a78bfa' },
  { id: 'a6', name: 'Marathoner', desc: 'Log 42 km of cardio', icon: 'Timer', unlocked: false, progress: 0.4, color: '#ff4fd8' },
]

export const profileStats = [
  { label: 'Workouts', value: 186 },
  { label: 'Hours trained', value: 142 },
  { label: 'PRs set', value: 23 },
  { label: 'Classes', value: 18 },
]

export const quotes = [
  { text: 'The only bad workout is the one that didn’t happen.', author: 'Unknown' },
  { text: 'Strength does not come from the body. It comes from the will.', author: 'Arnold Schwarzenegger' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'Don’t count the days, make the days count.', author: 'Muhammad Ali' },
  { text: 'Success isn’t always about greatness. It’s about consistency.', author: 'Dwayne Johnson' },
  { text: 'You don’t have to be extreme, just consistent.', author: 'Unknown' },
  { text: 'Sweat is just fat crying.', author: 'Gym folklore' },
]

export function quoteOfTheDay() {
  const d = new Date()
  const dayIndex = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000)
  return quotes[dayIndex % quotes.length]
}
