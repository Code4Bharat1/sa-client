import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef1fa',
          100: '#d5dcf2',
          200: '#aab8e5',
          300: '#7f95d8',
          400: '#5471cb',
          500: '#2a4ebe',
          600: '#1a3a9e',
          700: '#152f82',
          800: '#112467',
          900: '#0d1a4b',
        },
        gold: {
          50:  '#fdf8e7',
          100: '#fbefc4',
          200: '#f7df89',
          300: '#f3cf4e',
          400: '#efbf13',
          500: '#c99f0f',
          600: '#a37f0b',
          700: '#7d5f08',
          800: '#574005',
          900: '#312002',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(13,26,75,0.08), 0 1px 2px rgba(13,26,75,0.06)',
        'card-hover': '0 4px 12px rgba(13,26,75,0.12), 0 2px 4px rgba(13,26,75,0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
