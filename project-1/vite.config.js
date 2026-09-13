import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Listen on 0.0.0.0 for localhost and hosted/network IP
    port: 5173,
    watch: {
      ignored: [
        '**/backend/**',
        '**/backend/docs/**',
        '**/docs/**',
        '**/*.txt',
        '**/*.pdf',
        '**/.env*',
      ],
    },
  },
})
