import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // bind to 0.0.0.0 so Docker can expose it
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://server:3001',
        changeOrigin: true,
      },
    },
  },
})
