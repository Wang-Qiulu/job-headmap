/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#ffffff',
          soft: '#fafafa',
          mute: '#f3f4f6',
        },
        border: {
          DEFAULT: '#e5e7eb',
          soft: '#f3f4f6',
        },
        ink: {
          1: '#111827',
          2: '#6b7280',
          3: '#9ca3af',
        },
        success: {
          DEFAULT: '#10b981',
          soft: '#ecfdf5',
        },
        heatmap: {
          0: '#ebedf0',
          1: '#9be9a8',
          2: '#40c463',
          3: '#30a14e',
          4: '#216e39',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['14px', { lineHeight: '20px' }],
        md: ['15px', { lineHeight: '22px' }],
        lg: ['18px', { lineHeight: '26px' }],
        xl: ['24px', { lineHeight: '32px' }],
        '2xl': ['32px', { lineHeight: '38px' }],
        '3xl': ['48px', { lineHeight: '56px' }],
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        lg: '0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 2px 6px -2px rgba(0, 0, 0, 0.04)',
        drawer: '-8px 0 24px -4px rgba(0, 0, 0, 0.06)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-out-right': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(100%)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'slide-in-right': 'slide-in-right 200ms ease-out',
        'slide-out-right': 'slide-out-right 150ms ease-in',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
