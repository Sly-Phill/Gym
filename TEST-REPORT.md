# PulseFit Test Report

**Date:** 24 October 2026
**Command:** `npm run test:all` (backend tests, then browser tests)
**Result:** all tests pass ✅ (one test is skipped on purpose)

> **Important:** `.env` still has no `DATABASE_URL`, so every test ran on a throwaway **in-memory Postgres** (PGlite). PGlite is the real PostgreSQL engine compiled to WebAssembly, running the same `db/schema.sql` and `db/seed.sql`. The suite has **not yet run against your Neon database.** It switches to Neon automatically once `DATABASE_URL` is set (see "Check by hand").

---

## Update, 31 October 2026: screen-by-screen check

I added `e2e/screens.spec.js` (12 checks). It covers Progress, Class Booking and Profile, layouts at 375 / 768 / 1440 px, tap-target sizes, the theme toggle on every screen, the logo gradient and favicon, empty states, every link's destination, and buttons with no action.

**Latest `npm run test:all`:** backend 85/85 passed, browser 35 passed, 0 failed, 13 skipped on purpose. The 12 screen checks set their own screen sizes, so they run once on desktop; the keyboard test is desktop-only.

New bugs found and fixed:

| # | Bug | Fix |
|---|---|---|
| 14 | Profile couldn't be reached on phone or tablet: the bottom bar has no Profile item, and the name chip wasn't a link. | The name chip in the phone/tablet top bar now links to Profile, with a screen-reader label that matches its visible text. |
| 15 | Bottom-nav items were 43px tall, under the 44px tap size. | Each item is now at least 44px tall; it looks the same. |
| 16 | Landing navbar links (Workouts / Classes / Progress) had only a 20px tap area. | Added vertical padding to make the tap area 40px; the look is unchanged. |

---

## 1. Totals

| Suite | Tests | Passed | Failed | Skipped |
|---|---:|---:|---:|---:|
| Backend / API (Vitest + Supertest) | 85 | 85 | 0 | 0 |
| Browser, desktop Chrome (Playwright) | 12 | 12 | 0 | 0 |
| Browser, iPhone 13 screen (Playwright) | 12 | 11 | 0 | 1* |
| **Total** | **109** | **108** | **0** | **1** |

\* The keyboard-only test is skipped on the phone project: phones have no Tab key.

**First run, before any fixes:** backend 82/85 passed (3 failed); browser 12/24 passed (11 failed, 1 skipped).

### What's covered

**Backend** (`test/*.test.js`, 85 tests)
- **Sign up:** works and sets an httpOnly cookie. Emails are case-insensitive. Duplicate emails are blocked (also in different casing). Empty, short, whitespace-only, letters-only and numbers-only passwords are blocked. Missing name, bad email, out-of-range goals and invalid JSON are rejected.
- **Login, logout, `/me`:**
  - Login works, and a wrong password fails.
  - An unknown email gets the same error as a wrong password, so attackers can't use it to discover which emails have accounts.
  - Logout clears both cookies.
  - `/me` returns the user when logged in and 401 when logged out. Forged (`alg: none`), garbage, wrong-secret and expired tokens are all rejected.
- **`/api/stats`:** all three values are whole numbers.
- **`/api/exercises`:** returns all 30 with the right fields. Each muscle group filter returns exactly its 5 exercises. Unknown groups are rejected.
- **`/api/workouts` + `/api/sets`:**
  - Adding an exercise creates today's workout with one set row per prescribed set.
  - Exercises keep their order, adding a duplicate does nothing, and removing works.
  - Bad ids and unknown actions are rejected.
  - Start, then tick and untick sets (saved to the database).
  - Finish saves the duration and completion time; finishing twice is harmless.
  - A completed workout is locked.
- **Security:**
  - User B can't see, tick, start, finish or edit user A's workout, and A's data stays unchanged after each attempt.
  - B's dashboard never shows A's workout.
  - No response ever contains a password hash.
  - Every protected route returns 401 without login.
- **Streaks and dashboard** (fake dates around "today" = Wed 2031-03-12):
  - Streak scenarios: no workouts → 0; 3 days in a row → 3; a missed day resets; today plus yesterday → 2; still alive from yesterday; unfinished workouts ignored. Edge cases: duplicate dates, month and year boundaries, leap year.
  - The weekly chart always has exactly 7 days, ending today.
  - Ring numbers count only the current Monday-to-Sunday week, and "goals hit" uses the per-session target.
  - Rings never exceed 100% and never show NaN, even with missing, zero, negative or text values.

**Browser** (`e2e/*.spec.js`, each run on desktop Chrome and an iPhone 13 screen)
- **Landing page:** "PulseFit" appears in the tab title, navbar, hero and footer, and the favicon is set. The counters start at 0, count up, and land on the real `/api/stats` values. "Start Your Workout" goes to sign-up when logged out and to the dashboard when logged in.
- **Full journey:**
  1. Sign up and land on the Dashboard.
  2. Each Library filter shows exactly the right 5 cards.
  3. Add 2 exercises; the Dashboard shows the workout.
  4. Start, watch the rest timer count down, tick all 6 sets.
  5. "Workout complete!" and the confetti appear.
  6. The Dashboard shows streak 1, active minutes on the chart, and the ring at 1/4 (25%).
  7. Refresh: everything is still there.
  8. Log out: Dashboard, Library and Live Workout all redirect to login.
- **Quality**, at 375px wide, dark and light themes, logged out and logged in:
  - no console errors or warnings
  - no horizontal scrolling
  - no automated accessibility problems (axe-core, WCAG 2.1 AA: contrast, labels, names, landmarks)
- **Labels:** every visible button and link has a readable name, and every image has alt text.
- **Keyboard (desktop):** you can Tab to "Start Your Workout", see a focus outline, press Enter, and fill and submit the sign-up form with the keyboard alone.

---

## 2. Bugs found and how each was fixed

| # | Bug | How it showed up | Fix |
|---|---|---|---|
| 1 | **Weak passwords accepted.** 8 spaces, letters only or numbers only all created accounts. | Backend tests | Sign-up now needs 8–72 characters with at least one letter and one number ([api/auth/signup.js](api/auth/signup.js)). The form placeholder explains the rule. |
| 2 | **Blank page after using a filter.** After tapping a muscle-group filter in the Library (or a day in Classes), navigating away showed an empty page until reload. | Browser journey test | A framer-motion `layoutId` highlight stopped the page's exit animation from finishing. I replaced it with a new [SlidingPill](src/components/SlidingPill.jsx) that measures the active button and glides to it; it looks the same. |
| 3 | **Landing counters stuck at "0" on phones.** The stats row sits near the bottom of an iPhone screen, inside the counter's 40px "not yet visible" margin, so it never started. Screen readers also read "0". | iPhone browser test | Counters now start once 30% of them is visible ([AnimatedCounter.jsx](src/components/AnimatedCounter.jsx)). |
| 4 | **React Router warnings** in the console on every page. | Console check | Set both v7 future flags in [App.jsx](src/App.jsx). `v7_startTransition` is explicitly `false`, because turning it on stalls page transitions. |
| 5 | **"401 Unauthorized" console errors** on every logged-out page load (twice in dev), from the login check. | Console check | Login and sign-up now also set a readable, non-secret `pf_signed_in=1` cookie next to the secure httpOnly session cookie. Logged-out visitors skip the check entirely. The marker clears on logout and when a session has expired. |
| 6 | **Light theme contrast failures:** green accent text, neon chips, Progress gains, PR tier labels, class-type chips, Library difficulty and muscle labels, and the "LV" badge. | Accessibility check (axe), light theme | Light mode only: a darker accent green, darker versions of the cyan, orange, yellow, pink and rose text colours, and a `useInk()` helper for colours set inline. Solid lime badges keep the fixed neon lime. **Dark mode is unchanged.** |
| 7 | **Uneven chart axis.** The weekly chart's y-axis showed 0, 8, 16, 30. | Dashboard screenshot | Evenly spaced ticks (0, ⅓, ⅔, top), with the top rounded to 15 minutes ([WeeklyChart.jsx](src/components/WeeklyChart.jsx)). |
| 8 | **Landing page structure:** no `<main>` landmark, and heading levels jumped from 1 to 3. | Lighthouse accessibility | Added `<main>`; the feature card titles are now `h2`, styled exactly as before. |
| 9 | **`/robots.txt` returned the app's HTML page**, which counted as 22 errors. | Lighthouse SEO | Added [public/robots.txt](public/robots.txt). |
| 10 | **Generic "Start" link text.** | Lighthouse SEO | Added hidden text so screen readers and search engines read "Start workout"; the visible label is unchanged. |
| 11 | **Library search had no label** (placeholder only), and filter buttons didn't announce which one was selected. | Accessibility review | Added `aria-label="Search exercises"`. Filter and day buttons now report pressed or not pressed to screen readers. |
| 12 | **Slow first load.** Every page downloaded the whole app, including the 384 kB chart library, and the Google Fonts stylesheet blocked the first paint. | Lighthouse performance | Each screen now loads only when opened, and the weekly chart loads just after the rest of the dashboard. Fonts load without blocking. |
| 13 | **Main thread too busy on the dashboard** (431 ms total blocking time). | Lighthouse performance | Counters write their numbers directly instead of re-rendering React every frame. Rings render once at the right size instead of twice. The streak flame wobble is now a CSS animation. React renders the first screen and incoming data in small slices. |

Test-only fixes (no app change), for the record: a filter check that also counted the cards' "Sets/Reps/Rest" labels, two text matches that also matched toast messages, and checks that read counters before they had scrolled into view.

---

## 3. Lighthouse scores

Mobile emulation with Lighthouse's default slow-4G and 4× CPU throttling, run against the **production build** (`npm run build`) served locally. Run it with `npm run build && node scripts/lighthouse.js`.

| Page | | Performance | Accessibility | Best Practices | SEO |
|---|---|---:|---:|---:|---:|
| Landing | before | 81 | 96 | 100 | 91 |
| | **after** | **93–94** | **100** | **100** | **100** |
| Login | before | 86 | 100 | 100 | 91 |
| | **after** | **97–98** | **100** | **100** | **100** |
| Dashboard (logged in) | first valid run | 84 | 100 | 100 | 91 |
| | **after** | **90–92** | **100** | **100** | **100** |

"After" shows the range across three back-to-back runs, because Performance varies by a few points between runs.

**Note on the Dashboard "before":** in the first measurement the audit wasn't actually logged in and silently landed on the login page, so that number was invalid. The first valid Dashboard run (84) was taken partway through the fixes, after code-splitting and `robots.txt`. A true before score would likely have been lower.

---

## 4. Production build

`npm run build` completes with **zero errors and zero warnings**. The large-chunk warning from before is gone because screens now load on demand.

---

## 5. Please check by hand

1. **Run everything against Neon (most important).**
   - Put your connection string in `.env` as `DATABASE_URL=…`.
   - Run `npm run db:setup`, then `npm run test:all`.
   - The tests then use Neon automatically. They create users named `pf-test-…@pulsefit.test` and `…@e2e.pulsefit.test` and delete them afterwards, so your real data isn't touched.
   - The workout and set counts on the landing page will briefly include the test runs; they drop back once the test users are cleaned up.
2. **A real iPhone in Safari.** The phone tests used Chrome's engine at iPhone size, not Safari. Check the glass blur effects, the notch and home-bar spacing, the bottom nav, and the rest-timer vibration (which iPhones ignore).
3. **Light mode look.** In light mode the accent green and some neon text are now darker so they're readable. Make sure you're happy with the shade (dark mode is unchanged).
4. **Font flash.** Fonts now load without blocking, so on a first visit text can show in the system font for a split second before Space Grotesk/Inter arrive.
5. **Time zones.** "Today" uses the phone's own date, and the seeded classes use the time zone of the computer that ran `db:setup`.
6. **Screen reader spot check** with VoiceOver (iPhone) or NVDA (Windows) on the Library and Live Workout screens.
7. **After deploying,** run Lighthouse once on the live Vercel URL. Real network and database latency will differ from these local numbers.
8. **Still mock data by design:** Progress charts, PRs, class bookings, and Profile stats and badges.
