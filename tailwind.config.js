/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Public page colors
        'home-blue': '#2563EB',
        'home-purple': '#7C3AED',

        // Employee dark theme
        'emp-bg': '#0F0A1A',
        'emp-card': '#1A1433',
        'emp-card-hover': '#231B45',
        'emp-border': '#2D2454',
        'emp-text': '#F5F3FF',
        'emp-muted': '#A89BCC',
        'emp-accent': '#A855F7',
        'emp-accent-hover': '#9333EA',

        // Worker dark theme
        'wrk-bg': '#0A0F1A',
        'wrk-card': '#111827',
        'wrk-card-hover': '#1A2332',
        'wrk-border': '#1E293B',
        'wrk-text': '#F0F4F8',
        'wrk-muted': '#94A3B8',
        'wrk-accent': '#3B82F6',
        'wrk-accent-hover': '#2563EB',

        // Admin dark theme
        'adm-bg': '#0A120A',
        'adm-card': '#111A11',
        'adm-card-hover': '#1A261A',
        'adm-border': '#1E331E',
        'adm-text': '#F0FFF0',
        'adm-muted': '#88AA88',
        'adm-accent': '#22C55E',
        'adm-accent-hover': '#16A34A',

        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
