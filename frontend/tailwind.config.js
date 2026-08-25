/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glacial: {
          950: '#020611', // Deep abyssal ocean
          900: '#061224', // Deep Antarctic night
          850: '#0b1d38', // Sub-surface marine blue
          800: '#102a4e', // Ice shelf twilight
          700: '#1b3f70', // Polar dusk
          600: '#255799', 
          500: '#3878c7',
          400: '#60a5fa', // Polar sky
          300: '#93c5fd', // Glacial highlight
          200: '#bfdbfe', // Ice reflection
          100: '#dbeafe', // Frosted snow
          50: '#f0f9ff',  // Pure iceberg summit
        },
        ice: {
          cyan: '#00f0ff',
          neon: '#38bdf8',
          frost: '#e0f2fe',
          glow: 'rgba(56, 189, 248, 0.25)',
          teal: '#14b8a6',
        },
        danger: {
          ice: '#f43f5e',
          warning: '#fbbf24',
          safe: '#10b981',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'ice-card': '0 8px 32px 0 rgba(2, 14, 34, 0.4), inset 0 1px 0 0 rgba(224, 242, 254, 0.1)',
        'ice-glow': '0 0 25px -5px rgba(56, 189, 248, 0.35)',
        'ice-glow-sm': '0 0 12px rgba(56, 189, 248, 0.25)',
        'ice-danger': '0 0 25px -5px rgba(244, 63, 94, 0.4)',
      },
    },
  },
  plugins: [],
}
