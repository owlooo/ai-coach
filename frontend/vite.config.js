import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    open: true
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: (id) => {
        return id.startsWith('https://www.gstatic.com/firebasejs/')
      }
    }
  }
})
