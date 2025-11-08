import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Esto es para que Vite escuche en todas las interfaces DENTRO del contenedor
    host: '0.0.0.0', 
    port: 5173,
    proxy: {
      '/api': {
        // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
        // 'backend' es el nombre del servicio en tu docker-compose.yml
        target: 'http://backend:3000', 
        
        changeOrigin: true, 
        rewrite: (path) => path.replace(/^\/api/, ''), 
      },
    },
  },
})