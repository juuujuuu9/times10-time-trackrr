/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Istok Web', 'system-ui', 'sans-serif'],
        'istok-web': ['Istok Web', 'system-ui', 'sans-serif'],
        'vt323': ['VT323', 'monospace'],
        'radioland': ['Radioland', 'monospace'],
        'work-sans': ['Work Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        'admin': {
          'light-gray': '#F2F2F3',
          'mid-gray': '#C8CDD0',
          'dark-gray': '#415058',
          'black': '#1F292E',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      height: {
        18: '4.5rem',
      },
    },
  },
  plugins: [],
}
