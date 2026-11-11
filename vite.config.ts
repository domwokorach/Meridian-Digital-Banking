import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // The browser only ever talks to the Vite origin, so drop Origin to keep the backend's CORS allow-list from rejecting 127.0.0.1 or other ports.
        configure: (proxy) => proxy.on('proxyReq', (req) => req.removeHeader('origin'))
      }
    }
  }
});
