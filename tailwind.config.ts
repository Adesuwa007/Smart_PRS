import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C47FF',
          light: '#EEE9FF',
        },
        accent: '#00C9A7',
        danger: '#FF4D6D',
        warning: '#FFB347',
        background: '#F8F7FF',
        surface: '#FFFFFF',
        'text-primary': '#1A1035',
        'text-muted': '#7B7A8E',
        border: '#EBEBF5',
        // Legacy brand tokens (used by DashboardLayout + sub-pages)
        'brand-dark': '#050508',
        'brand-cyan': '#06B6D4',
        'brand-purple': '#8B5CF6',
        'brand-surface': '#0d0d14',
        'brand-border': 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '20px',
        'btn': '12px',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(108, 71, 255, 0.08)',
        'card-hover': '0 8px 40px rgba(108, 71, 255, 0.16)',
      },
      maxWidth: {
        'content': '1200px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'float-delayed': 'float 3s ease-in-out 1s infinite',
        'float-delayed-2': 'float 3s ease-in-out 2s infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'confetti': 'confetti 3s ease-out forwards',
        'score-ring': 'scoreRing 1.2s ease-out forwards',
        'bar-fill': 'barFill 0.8s ease-out forwards',
        'count-up': 'countUp 1s ease-out',
        'gradient-shift': 'gradientShift 8s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(100px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        confetti: {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        scoreRing: {
          '0%': { strokeDashoffset: '339.292' },
        },
        barFill: {
          '0%': { width: '0%' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
