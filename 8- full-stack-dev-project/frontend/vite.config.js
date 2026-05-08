import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * – Proxy /api/* per il backend (localhost:5000) durante lo sviluppo
 * quindi il frontend non deve mai preoccuparsi di CORS in modalità dev
 */
export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  test: {
    // Utilizza jsdom in modo che i componenti React possano essere renderizzati in un browser simulato
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.js'],
  },
});
