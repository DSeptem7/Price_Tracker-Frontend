import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Esto separa las librerías de 'node_modules' en un archivo aparte
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})