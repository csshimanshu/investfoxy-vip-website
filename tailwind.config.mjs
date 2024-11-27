/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'primary': '#2D0058',
        'primary-light': '#3D0078',
        'primary-dark': '#1D0038',
        'accent': '#8B5CF6',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(to bottom, #2D0058, #1D0038)',
      },
    },
  },
  plugins: [],
}
