import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/documents': 'http://127.0.0.1:8000',
      '/query': 'http://127.0.0.1:8000',
      '/analytics': 'http://127.0.0.1:8000',
      '/comparison': 'http://127.0.0.1:8000',
      '/reports': 'http://127.0.0.1:8000',
      '/topics': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000',
    },
  },
})

