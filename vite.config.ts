import { defineConfig } from 'vite'
import react from '@vitejs/vite-plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Autopublicador-FB/',
})
