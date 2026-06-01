import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  base: '/',

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
