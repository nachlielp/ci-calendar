/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      maxWidth: {
        "screen-md": "900px",
      },
      colors: {
        "homepage-bg": "#fcf9e6", // You can name this key whatever you prefer
      },
    },
  },
  plugins: [],
};
