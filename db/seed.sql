-- PulseFit sample data. Safe to run repeatedly: exercises upsert by name,
-- classes are unique per (title, start_time) so re-running adds nothing new.

INSERT INTO exercises (name, muscle_group, sets, reps, difficulty, rest_seconds, description) VALUES
  -- Chest
  ('Barbell Bench Press',      'Chest',  4, '6-8',      'Advanced',     120, 'Flat bench, feet planted. Lower the bar to mid-chest and press up explosively.'),
  ('Incline Dumbbell Press',   'Chest',  3, '8-10',     'Intermediate',  90, 'Bench at 30 degrees. Press the dumbbells up and slightly together.'),
  ('Tempo Push-Ups',           'Chest',  3, '12-15',    'Beginner',      60, 'Three seconds down, one second up. Keep a straight line from head to heels.'),
  ('Cable Chest Fly',          'Chest',  3, '12-15',    'Intermediate',  60, 'Soft elbows, hug a big tree and squeeze your chest at the middle.'),
  ('Weighted Chest Dips',      'Chest',  3, '8-10',     'Advanced',      90, 'Lean forward slightly to bias the chest. Lower until shoulders are below elbows.'),
  -- Back
  ('Conventional Deadlift',    'Back',   5, '5',        'Advanced',     150, 'Bar over mid-foot, flat back, push the floor away and lock out with your glutes.'),
  ('Pull-Ups',                 'Back',   4, '6-10',     'Intermediate',  90, 'Full hang to chin over bar. Drive your elbows down to your ribs.'),
  ('Seated Cable Row',         'Back',   3, '10-12',    'Beginner',      60, 'Tall chest, pull the handle to your belly button and squeeze your shoulder blades.'),
  ('Single-Arm Dumbbell Row',  'Back',   3, '10 / arm', 'Beginner',      60, 'Hand and knee on the bench. Row the dumbbell toward your hip.'),
  ('Lat Pulldown',             'Back',   3, '10-12',    'Beginner',      60, 'Slight lean back, pull the bar to your upper chest under control.'),
  -- Legs
  ('Back Squat',               'Legs',   5, '5',        'Advanced',     150, 'Brace hard, sit between your hips and drive up through the whole foot.'),
  ('Romanian Deadlift',        'Legs',   3, '8-10',     'Intermediate',  90, 'Soft knees, push your hips back until you feel a deep hamstring stretch.'),
  ('Walking Lunges',           'Legs',   3, '12 / leg', 'Beginner',      60, 'Long steps, back knee kisses the floor, stay tall through the torso.'),
  ('Bulgarian Split Squat',    'Legs',   3, '10 / leg', 'Intermediate',  75, 'Rear foot on a bench. Drop straight down and keep the front heel planted.'),
  ('Leg Press',                'Legs',   4, '10-12',    'Beginner',      90, 'Feet shoulder-width. Lower until knees reach 90 degrees, never lock out hard.'),
  -- Arms
  ('Incline Dumbbell Curl',    'Arms',   3, '10-12',    'Beginner',      60, 'Arms hang behind your body for a long stretch. Curl without swinging.'),
  ('EZ-Bar Skull Crushers',    'Arms',   3, '10',       'Intermediate',  60, 'Lower the bar to your forehead with elbows pointing up, then extend.'),
  ('Hammer Curls',             'Arms',   3, '12',       'Beginner',      45, 'Neutral grip, thumbs up. Great for forearms and the brachialis.'),
  ('Close-Grip Bench Press',   'Arms',   4, '6-8',      'Advanced',      90, 'Hands shoulder-width, elbows tucked. Triceps do the heavy lifting.'),
  ('Cable Triceps Pushdown',   'Arms',   3, '12-15',    'Beginner',      45, 'Pin your elbows to your sides and push the rope apart at the bottom.'),
  -- Core
  ('Weighted Plank',           'Core',   3, '45 s',     'Beginner',      45, 'Plate on your back, squeeze glutes and keep ribs tucked.'),
  ('Hanging Leg Raises',       'Core',   3, '10-12',    'Intermediate',  60, 'Dead hang, curl your pelvis up rather than just lifting your legs.'),
  ('Ab Wheel Rollouts',        'Core',   3, '8-10',     'Advanced',      60, 'Roll out as far as you can without your lower back sagging.'),
  ('Pallof Press',             'Core',   3, '12 / side','Beginner',      45, 'Resist the cable pulling you sideways as you press straight out.'),
  ('Dead Bug',                 'Core',   3, '10 / side','Beginner',      45, 'Lower back glued to the floor while you extend the opposite arm and leg.'),
  -- Cardio
  ('Rower Intervals',          'Cardio', 6, '250 m',    'Intermediate',  60, 'Legs, body, arms. Hold a hard but repeatable pace for every interval.'),
  ('Assault Bike Sprints',     'Cardio', 8, '20 s',     'Advanced',      40, 'All-out effort. Push and pull the handles as hard as you pedal.'),
  ('Jump Rope Flow',           'Cardio', 5, '2 min',    'Beginner',      45, 'Light bounces on the balls of your feet. Mix in high knees when ready.'),
  ('Incline Treadmill Walk',   'Cardio', 3, '8 min',    'Beginner',      60, '12 percent incline at a brisk pace. No holding the rails.'),
  ('Burpee Ladder',            'Cardio', 5, '10',       'Intermediate',  60, 'Chest to floor, jump and clap overhead. Smooth, steady rhythm.')
ON CONFLICT (name) DO UPDATE SET
  muscle_group = EXCLUDED.muscle_group,
  sets         = EXCLUDED.sets,
  reps         = EXCLUDED.reps,
  difficulty   = EXCLUDED.difficulty,
  rest_seconds = EXCLUDED.rest_seconds,
  description  = EXCLUDED.description;

-- 10 classes in the current week (Monday start). Times are in the session time
-- zone, which scripts/db-setup.js sets to your computer's time zone.
WITH week AS (SELECT date_trunc('week', now()) AS start)
INSERT INTO classes (title, coach_name, start_time, duration_minutes, capacity, intensity)
SELECT c.title, c.coach_name, week.start + c.offset_from_monday, c.duration_minutes, c.capacity, c.intensity
FROM week, (VALUES
  ('HIIT Metcon Blast',        'Jordan Kim',     interval '0 days 06:30', 45, 20, 'High'),
  ('Vinyasa Yoga Flow',        'Maya Lopez',     interval '0 days 12:15', 60, 18, 'Low'),
  ('Rhythm Ride Spin',         'Sam Taylor',     interval '1 days 07:00', 45, 24, 'High'),
  ('Fight Fit Boxing',         'Dre Mensah',     interval '1 days 18:30', 50, 16, 'High'),
  ('Strength Foundations',     'Priya Shah',     interval '2 days 17:30', 60, 14, 'Moderate'),
  ('Core & Mobility',          'Leo Moreau',     interval '3 days 07:15', 30, 20, 'Low'),
  ('Tabata Burn',              'Jordan Kim',     interval '3 days 18:00', 30, 20, 'High'),
  ('Power Pilates',            'Maya Lopez',     interval '4 days 09:00', 50, 16, 'Moderate'),
  ('Saturday Sweat Social',    'Priya Shah',     interval '5 days 10:00', 60, 24, 'Moderate'),
  ('Sunday Yin & Recover',     'Leo Moreau',     interval '6 days 18:00', 60, 18, 'Low')
) AS c (title, coach_name, offset_from_monday, duration_minutes, capacity, intensity)
ON CONFLICT (title, start_time) DO NOTHING;
