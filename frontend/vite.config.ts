/// <reference types="vitest/config" />
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
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    css: false,
    // JUnit XML is written even when tests fail so Jenkins can always publish results.
    reporters: ['default', 'junit'],
    outputFile: { junit: 'reports/junit.xml' },
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text-summary', 'html', 'lcov', 'cobertura'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts'],
      // Initial gate: 80% of the critical banking business logic (money maths, API client, auth/bank state).
      thresholds: {
        'src/lib/format.ts': { lines: 80, functions: 80, statements: 80, branches: 80 },
        'src/lib/api.ts': { lines: 80, statements: 80 },
        'src/context/BankContext.tsx': { lines: 80, statements: 80 },
        'src/context/AuthContext.tsx': { lines: 80, statements: 80 },
      },
    },
  },
});
