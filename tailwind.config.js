/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a237e',
          light: '#534bae',
          dark: '#000051',
        },
        secondary: {
          DEFAULT: '#00796b',
          light: '#48a999',
          dark: '#004c40',
        },
        accent: {
          DEFAULT: '#ff6d00',
          light: '#ff9e40',
          dark: '#c43c00',
        },
        success: {
          DEFAULT: '#388e3c',
          light: '#6abf69',
          dark: '#00600f',
        },
        warning: {
          DEFAULT: '#f57c00',
          light: '#ffad42',
          dark: '#bb4d00',
        },
        danger: {
          DEFAULT: '#d32f2f',
          light: '#ff6659',
          dark: '#9a0007',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 6px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 10px 15px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};