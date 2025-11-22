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
          light: '#F6F6F6',
        },
        text: {
          dark: '#1F2937',
          medium: '#6B7280',
          light: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'var(--font-noto-sans)'],
        heading: ['var(--font-poppins)'],
      },
      fontSize: {
        h1: ['3.5rem', { lineHeight: '1.2' }],
        h2: ['2.5rem', { lineHeight: '1.3' }],
        h3: ['1.875rem', { lineHeight: '1.4' }],
        h4: ['1.5rem', { lineHeight: '1.5' }],
        h5: ['1.25rem', { lineHeight: '1.6' }],
      },
    },
  },
  plugins: [],
}
export default config
