/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        lime: { DEFAULT: '#c6ff00', 400: '#d4ff3d', 500: '#c6ff00', 600: '#a3d600' },
        cyan: { DEFAULT: '#00e5ff', 400: '#33ebff', 500: '#00e5ff' },
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        base: 'rgb(var(--base) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(198,255,0,0.55)',
        'glow-cyan': '0 0 40px -8px rgba(0,229,255,0.55)',
        card: '0 10px 40px -12px rgba(0,0,0,0.45)',
      },
      keyframes: {
        pulseline: { '0%': { strokeDashoffset: 120 }, '100%': { strokeDashoffset: 0 } },
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        shimmer: { '0%': { backgroundPosition: '0% 50%' }, '100%': { backgroundPosition: '200% 50%' } },
        flicker: {
          '0%,100%': { transform: 'scale(1) rotate(0deg)' },
          '33%': { transform: 'scale(1.08) rotate(-4deg)' },
          '50%': { transform: 'scale(1.12) rotate(0deg)' },
          '66%': { transform: 'scale(1.08) rotate(4deg)' },
        },
        wave: { '0%,60%,100%': { transform: 'rotate(0)' }, '10%,30%': { transform: 'rotate(14deg)' }, '20%,40%': { transform: 'rotate(-8deg)' } },
      },
      animation: {
        pulseline: 'pulseline 2.4s ease-in-out infinite alternate',
        floaty: 'floaty 6s ease-in-out infinite',
        shimmer: 'shimmer 6s linear infinite',
        wave: 'wave 2.2s ease-in-out 0.4s 1',
        flicker: 'flicker 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
