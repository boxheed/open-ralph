/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        ralph: {
          yellow: '#F4D03F',
          dark: '#212121',
        },
        gemini: '#1A73E8',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
