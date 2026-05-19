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
      },
    },
  },
  plugins: [],
};

export default config;
