import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // Allow external connections (needed for Docker)
    port: 3000,
    watch: {
      usePolling: true, // Enable polling for file changes in Docker
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://backend:8000',
        changeOrigin: true,
      },
      '/static': {
        target: process.env.VITE_API_URL || 'http://backend:8000',
        changeOrigin: true,
      },
    },
  },
})
