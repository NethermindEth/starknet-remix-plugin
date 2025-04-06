import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--bgPrimary)',
        secondary: 'var(--secondary)',
        accent: 'var(--accentColor)',
        text: 'var(--text)',
        light: 'var(--light)',
        error: 'var(--error)',
        green: 'var(--green)',
        info: 'var(--info)',
        warning: 'var(--warning)',
        orange: 'var(--orange)',
        indigo: 'var(--indigo)',
        teal: 'var(--teal)',
        yellow: 'var(--yellow)',
      },
    },
  },
  plugins: [],
};

export default config;