import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FAFAF7',
        ink: '#111111',
        accent: '#166534',
        'band-good': '#16A34A',
        'band-fair': '#D97706',
        'band-attention': '#E11D48',
        field: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        earth: {
          50: '#fbf7ee',
          100: '#f4ebd4',
          200: '#ebd6ab',
          300: '#dfbc7b',
          400: '#d3a14e',
          500: '#c4862f',
          600: '#ab6c24',
          700: '#8a4f20',
          800: '#71401f',
          900: '#5e351d',
        },
        ats: {
          good: '#16A34A',
          fair: '#D97706',
          attention: '#E11D48',
        },
      },
      borderRadius: {
        ats: '8px',
      },
      boxShadow: {
        hard: '4px 4px 0px #111111',
        'hard-sm': '2px 2px 0px #111111',
        'hard-lg': '6px 6px 0px #111111',
      },
      borderWidth: {
        '1.5': '1.5px',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['var(--font-space-grotesk)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
