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
      colors: {
        'dark-base':    '#0A0E1A',
        'dark-surface': '#111827',
        'dark-raised':  '#1F2937',
        'dark-border':  '#374151',
        'accent':       '#6366F1',
        'accent-green': '#22C55E',
        'accent-amber': '#EAB308',
        'accent-red':   '#EF4444',
        'accent-blue':  '#3B82F6',
        'text-dim':     '#9CA3AF',
        'text-dimmer':  '#6B7280',
      },
    },
  },
  plugins: [],
};
