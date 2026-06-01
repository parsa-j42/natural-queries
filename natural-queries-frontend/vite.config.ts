import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  base: '/',

  // Vitest: component and logic tests in jsdom. The real-browser flows
  // (DuckDB-WASM) live in Playwright under e2e/, which Vitest must ignore.
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test-utils/setup.ts',
    css: false,
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },

  build: {
    target: 'esnext',
    sourcemap: false,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        // Split the big vendors out of the app chunk for better caching.
        manualChunks: {
          mantine: ['@mantine/core', '@mantine/notifications'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },

  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },

  // DuckDB-WASM ships its own workers and wasm; pre-bundling it breaks the
  // worker resolution, so let Vite serve it as-is.
  optimizeDeps: {
    exclude: ['@duckdb/duckdb-wasm'],
  },
});
