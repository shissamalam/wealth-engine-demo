import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F0EDE8',
          100: '#E0DCD6',
          200: '#C0B8AE',
          300: '#8A8784',
          400: '#6A6764',
          500: '#4A4846',
          600: '#3A3836',
          700: '#242424',
          800: '#1A1A1A',
          900: '#0F0F0F',
          950: '#0A0A0A',
        },
        forest: {
          50: '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#D9A05A',
          400: '#D9A05A',
          500: '#C8843A',
          600: '#B0742F',
          700: '#8B5C25',
          800: '#6B461B',
          900: '#4B3112',
          950: '#2B1B0A',
        },
      },
    },
  },
  plugins: [],
}

export default config
