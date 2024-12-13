import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  base: '/natural-queries/',

  // Build optimizations
  build: {
    target: 'esnext',
    modulePreload: true,
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        manualChunks: {
          'mantine': ['@mantine/core', '@mantine/notifications'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },

  // Development server optimizations
  server: {
    hmr: {
      overlay: false,
    },
    watch: {
      usePolling: false,
    },
  },

  // Dependencies optimization
  optimizeDeps: {
    exclude: ['@mantine/core', '@mantine/notifications'],
  },

  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
});