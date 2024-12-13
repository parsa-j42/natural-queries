import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],

  // Development server optimizations
  server: {
    hmr: {
      overlay: false, // Disable the error overlay as it can be resource-intensive
    },
    watch: {
      usePolling: false, // Ensure polling is disabled for better performance
    },
    // Optimize dependency optimization
    optimizeDeps: {
      exclude: ['@mantine/core', '@mantine/notifications'], // Exclude Mantine from optimization if causing issues
    },
  },

  // Build optimizations that can help during development
  build: {
    target: 'esnext', // Optimize for modern browsers
    modulePreload: true,
    cssCodeSplit: true,
    sourcemap: false, // Disable source maps in development if not needed
    rollupOptions: {
      output: {
        manualChunks: {
          'mantine': ['@mantine/core', '@mantine/notifications'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },

  // Optimize TypeScript checking
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.mjs',
  },
});