/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontSize: {
      xs: ['11px', { lineHeight: '1.45' }],
      sm: ['12px', { lineHeight: '1.5' }],
      base: ['13px', { lineHeight: '1.5' }],
      lg: ['14px', { lineHeight: '1.5' }],
      xl: ['16px', { lineHeight: '1.4' }],
      '2xl': ['20px', { lineHeight: '1.3' }],
      '3xl': ['24px', { lineHeight: '1.2' }],
    },
    borderRadius: {
      none: '0',
      sm: '6px',
      DEFAULT: '6px',
      md: '8px',
      lg: '12px',
      full: '9999px',
    },
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        raised: 'var(--bg-raised)',
        overlay: 'var(--bg-overlay)',
        hovr: 'var(--bg-hover)',
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          muted: 'var(--accent-muted)',
        },
        border: {
          DEFAULT: 'var(--border-default)',
          subtle: 'var(--border-subtle)',
          focus: 'var(--border-focus)',
        },
        txt: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        success: 'var(--status-success)',
        warning: 'var(--status-warning)',
        error: 'var(--status-error)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['SF Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
