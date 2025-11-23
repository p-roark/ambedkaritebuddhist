import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          saffron: '#E8B20E',
          blue: '#2D4D9B',
        },
        accent: {
          orange: '#FF6B35',
          teal: '#00D9C0',
          purple: '#7F56D9',
        },
        background: {
          light: '#F8F9FE',
          gray: '#E5E7EB',
        },
        text: {
          dark: '#1F2937',
          medium: '#6B7280',
          light: '#9CA3AF',
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        'noto-sans': ['Noto Sans', 'sans-serif'],
      },
      fontSize: {
        h1: ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.2', fontWeight: '800', letterSpacing: '-0.02em' }],
        h2: ['clamp(2rem, 4vw, 3rem)', { lineHeight: '1.3', fontWeight: '700' }],
        h3: ['clamp(1.5rem, 3vw, 2rem)', { lineHeight: '1.4', fontWeight: '600' }],
        h4: ['1.25rem', { lineHeight: '1.5', fontWeight: '600' }],
      },
      spacing: {
        xs: '0.5rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem',
        xxl: '5rem',
      },
      borderRadius: {
        sm: '8px',
        md: '16px',
        lg: '24px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 2px 8px rgba(0, 0, 0, 0.1)',
        md: '0 4px 16px rgba(0, 0, 0, 0.15)',
        lg: '0 8px 32px rgba(0, 0, 0, 0.2)',
        glow: '0 0 40px rgba(232, 178, 14, 0.3)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #E8B20E 0%, #FFC947 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #2D4D9B 0%, #4A6FC8 100%)',
        'gradient-hero': 'linear-gradient(135deg, #2D4D9B 0%, #7F56D9 50%, #FF6B35 100%)',
        'gradient-accent': 'linear-gradient(135deg, #00D9C0 0%, #00B89F 100%)',
      },
    },
  },
  plugins: [],
}
export default config
