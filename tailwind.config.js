/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    fontFamily: {
      'sans': ['Istok Web', 'system-ui', 'sans-serif'],
      'istok-web': ['Istok Web', 'system-ui', 'sans-serif'],
      'vt323': ['VT323', 'monospace'],
      'radioland': ['Radioland', 'monospace'],
    },
    extend: {
      colors: {
        'admin': {
          'light-gray': '#F2F2F3',
          'mid-gray': '#C8CDD0',
          'dark-gray': '#415058',
          'black': '#1F292E',
        }
      },
    },
  },
  plugins: [],
} 