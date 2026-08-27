import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.vercel.run', '.vercel.app', '.v0.dev'],
    host: true
  }
})
