import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // allow imports like 'shared/...'
      shared: path.resolve(__dirname, '../shared/src'),
      // resolve workspace package imports
      '@vehicle-vitals/shared': path.resolve(__dirname, '../shared/src'),
      // ensure firebase imports resolve to web package node_modules
      firebase: path.resolve(__dirname, 'node_modules/firebase'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        format: 'es', // Use ES modules for better tree shaking
        manualChunks: id => {
          // Vendor chunks for better caching
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            if (id.includes('jspdf') || id.includes('papaparse')) {
              return 'utils-vendor';
            }
            return 'vendor';
          }
          // Feature-based chunks
          if (id.includes('pages/')) {
            return 'pages';
          }
          if (id.includes('components/')) {
            return 'components';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/functions',
    ],
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
  esbuild: {
    loader: 'tsx',
    include: /src\/.*\.[tj]sx?$/,
    exclude: [],
  },
});
