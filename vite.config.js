import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    host: true, // Allows external access
    port: 5173, // Make sure this matches your ngrok command
    strictPort: true,
    hmr: {
      clientPort: 443, // Ensures Hot Module Reloading works with Ngrok
    },
    allowedHosts: ['.ngrok-free.app'], // Allow Ngrok URLs
  },
})
