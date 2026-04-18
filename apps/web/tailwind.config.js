/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './store/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        sans:    ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        /* Backgrounds — used as bg-vf-bg-base etc. */
        'vf-bg-base':     '#0A0F1C',
        'vf-bg-surface':  '#0F1629',
        'vf-bg-elevated': '#161D35',
        /* Accents */
        'vf-accent-primary': '#6366F1',
        'vf-accent-success': '#22C55E',
        'vf-accent-warning': '#F59E0B',
        'vf-accent-danger':  '#EF4444',
        'vf-accent-info':    '#38BDF8',
        /* Text — used as text-vf-text-primary etc. */
        'vf-text-primary':   '#F1F5F9',
        'vf-text-secondary': '#94A3B8',
        'vf-text-muted':     '#475569',
        /* Border */
        'vf-border': 'rgba(255,255,255,0.08)',
      },
      borderRadius: {
        'vf-sm': '12px',
        'vf-md': '16px',
        'vf-lg': '20px',
        'vf-xl': '24px',
      },
      boxShadow: {
        'vf-card':         '0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.06) inset',
        'vf-glow-purple':  '0 0 30px rgba(99,102,241,0.35)',
        'vf-glow-green':   '0 0 30px rgba(34,197,94,0.3)',
        'vf-glow-red':     '0 0 30px rgba(239,68,68,0.3)',
      },
    },
  },
  plugins: [],
};
