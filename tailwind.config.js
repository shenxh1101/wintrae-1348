/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        navy: {
          50: "#f0f4f8",
          100: "#d9e2ec",
          200: "#bcccdc",
          300: "#9fb3c8",
          400: "#829ab1",
          500: "#627d98",
          600: "#486581",
          700: "#334e68",
          800: "#1E3A5F",
          900: "#102a43",
        },
        gold: {
          50: "#fbf8f1",
          100: "#f3ead3",
          200: "#e8d9a9",
          300: "#dbc27d",
          400: "#C9A962",
          500: "#b08f44",
          600: "#8e7231",
          700: "#6e5825",
          800: "#50401c",
          900: "#332a13",
        },
        cream: "#FAF8F5",
        stone2: "#E8E4DE",
        success: "#3A7D44",
        warning: "#D4923C",
        danger: "#C2464A",
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(30, 58, 95, 0.08), 0 1px 2px rgba(30, 58, 95, 0.06)',
        cardHover: '0 4px 12px rgba(30, 58, 95, 0.12), 0 2px 4px rgba(30, 58, 95, 0.08)',
      },
    },
  },
  plugins: [],
};
