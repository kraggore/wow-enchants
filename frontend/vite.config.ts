/// <reference types="vite/client" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['wow-enchants.murumb.dev', '10.0.0.2', 'localhost']
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['wow-enchants.murumb.dev', '10.0.0.2', 'localhost']
  }
})
