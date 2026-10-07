import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Redirige les appels /api vers le backend Node en développement
      '/api': process.env.API_URL ?? 'http://localhost:4000',
    },
  },
})
