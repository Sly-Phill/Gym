import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

function readStoredTheme() {
  try {
    return localStorage.getItem('pulsefit-theme') || 'dark'
  } catch {
    return 'dark'
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#07090d' : '#f4f6f0')
    try {
      localStorage.setItem('pulsefit-theme', theme)
    } catch {
      /* storage unavailable */
    }
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)

/**
 * Neon accent colors are bright enough for text on the dark theme, but too faint on the light one.
 * Returns a function that darkens a hex color for text in light mode (WCAG AA contrast).
 */
export function useInk() {
  const { theme } = useTheme()
  return (hex) => {
    if (theme === 'dark' || !/^#[0-9a-f]{6}$/i.test(hex)) return hex
    const n = parseInt(hex.slice(1), 16)
    const dim = (v) => Math.round(v * 0.45).toString(16).padStart(2, '0')
    return `#${dim(n >> 16)}${dim((n >> 8) & 255)}${dim(n & 255)}`
  }
}

// SVG presentation attributes can't resolve CSS variables, so charts get concrete colors.
export function useChartColors() {
  const { theme } = useTheme()
  return theme === 'dark'
    ? { muted: '#8c96a2', grid: 'rgba(255,255,255,0.07)', bar: 'rgba(255,255,255,0.12)', dot: '#07090d' }
    : { muted: '#5c6673', grid: 'rgba(14,18,24,0.08)', bar: 'rgba(14,18,24,0.12)', dot: '#ffffff' }
}
