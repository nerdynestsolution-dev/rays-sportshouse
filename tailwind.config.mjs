/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        mizzou: {
          gold: '#F1B82D',
          athletic: '#FDB813',
          goldDark: '#C89211',
          goldLight: '#FFE082',
          black: '#000000',
          slate900: '#111827',
          slate800: '#1F2937',
          slate700: '#374151',
          card: '#161E2E',
        },
      },
      fontFamily: {
        display: ['"Oswald"', '"Impact"', '"Arial Narrow"', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px -5px rgba(241, 184, 45, 0.45)',
        'gold-glow-lg': '0 0 40px -5px rgba(253, 184, 19, 0.6)',
      },
      backgroundImage: {
        'tiger-stripe': 'repeating-linear-gradient(-45deg, rgba(241, 184, 45, 0.05), rgba(241, 184, 45, 0.05) 12px, transparent 12px, transparent 24px)',
      },
    },
  },
  plugins: [],
};
