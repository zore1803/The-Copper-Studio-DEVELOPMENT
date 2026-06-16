/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Syne", "DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        primary: { DEFAULT: "#884c2d", dark: "#6f381a", light: "#fff1ec" },
        studio: {
          background: "#f0ede4",
          surface: "#fff8f6",
          card: "#e3d6c5",
          border: "#d8c2b9",
          muted: "#6c6355",
          copper: "#884c2d",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        elevated: "0 4px 16px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
