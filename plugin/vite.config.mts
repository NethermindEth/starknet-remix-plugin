import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import checker from 'vite-plugin-checker';

export default defineConfig(() => {
  return {
    define: {
      'process.env': {}
    },
    server: {
      port: 3000,
      hmr: true
    },
    build: {
      outDir: 'build'
    },
    plugins: [
      react(), 
      svgr({ svgrOptions: { icon: true } }), 
      checker({
        typescript: true,
        eslint: {
          lintCommand: 'eslint "./src/**/*.{ts,tsx}"', // for example, lint .ts & .tsx
        },
      })
    ]
  }
})
