import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
      '@vehicle-vitals/shared': path.resolve(
        __dirname,
        '../shared/src/index.js'
      ),
      shared: path.resolve(__dirname, '../shared/src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    exclude: ['**/node_modules/**', '**/uat.spec.*', '**/*.playwright.*'],
  },
});
