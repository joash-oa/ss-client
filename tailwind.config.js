// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg:           '#0f0f1a',
        'bg-card':    '#1a1a2e',
        primary:      '#4361EE',
        'primary-lt': '#6d87f5',
        accent:       '#4CC9F0',
        purple:       '#7209B7',
        star:         '#FFD166',
        success:      '#06D6A0',
        error:        '#EF233C',
        't-primary':  '#FFFFFF',
        't-secondary':'#a0a0c8',
        't-muted':    '#5a5a8a',
        border:       '#2d2d44',
      },
      fontFamily: {
        sans:      ['Nunito_400Regular'],
        semibold:  ['Nunito_600SemiBold'],
        bold:      ['Nunito_700Bold'],
        extrabold: ['Nunito_800ExtraBold'],
        black:     ['Nunito_900Black'],
      },
    },
  },
  plugins: [],
};
