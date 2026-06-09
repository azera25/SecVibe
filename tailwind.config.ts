import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'hacker-bg': '#0a0a0a',
        'hacker-surface': '#111111',
        'hacker-border': '#1a1a2e',
        'hacker-accent': '#22c55e',
        'hacker-accent-dim': 'rgba(34, 197, 94, 0.15)',
        'hacker-accent-glow': 'rgba(34, 197, 94, 0.4)',
        'hacker-secondary': '#f59e0b',
        'hacker-secondary-dim': 'rgba(245, 158, 11, 0.15)',
      },
      fontFamily: {
        mono: [
          '"JetBrains Mono"',
          '"Fira Code"',
          '"Cascadia Code"',
          '"Consolas"',
          '"Courier New"',
          'monospace',
        ],
      },
      boxShadow: {
        'glow-green': '0 0 12px rgba(34, 197, 94, 0.35)',
        'glow-green-sm': '0 0 6px rgba(34, 197, 94, 0.25)',
        'glow-amber': '0 0 12px rgba(245, 158, 11, 0.3)',
        'glow-red': '0 0 14px rgba(239, 68, 68, 0.45)',
      },
      keyframes: {
        'data-breached': {
          '0%, 100%': { transform: 'translateX(0)', borderColor: 'rgba(239, 68, 68, 1)' },
          '10%': { transform: 'translateX(-4px) rotate(-1deg)' },
          '20%': { transform: 'translateX(4px) rotate(1deg)' },
          '30%': { transform: 'translateX(-3px)' },
          '40%': { transform: 'translateX(3px)' },
          '50%': { transform: 'translateX(-2px)' },
          '60%': { transform: 'translateX(2px)' },
          '70%': { transform: 'translateX(-1px)' },
          '80%': { transform: 'translateX(1px)' },
          '50%, 100%': { boxShadow: '0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 30px rgba(239, 68, 68, 0.1)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(34, 197, 94, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)' },
        },
      },
      animation: {
        'data-breached': 'data-breached 1.2s ease-in-out 3',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
