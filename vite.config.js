import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000, //will always run the server on this port
    proxy: {
      '/api': 'http://localhost:5050'
    }
  }
})
