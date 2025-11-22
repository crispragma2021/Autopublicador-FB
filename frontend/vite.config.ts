import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // ESTA LÍNEA ARREGLA LAS RUTAS ABSOLUTAS DEL CSS/JS EN ENTORNOS LOCALES
  base: './', 
  plugins: [react()],
})
