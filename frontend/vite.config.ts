/// <reference types="vite/client" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['wow-enchants.murumb.dev', '10.0.0.2', 'localhost']
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(import.meta.env.VITE_API_URL)
  }
})
