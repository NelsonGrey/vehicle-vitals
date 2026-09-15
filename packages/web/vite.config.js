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
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        format: 'es', // Use ES modules for better tree shaking
        // Only group node_modules into stable vendor chunks here (rarely
        // changes, so it stays cached across app deploys). Deliberately do
        // NOT force-group src/pages or src/components: 24 of 25 pages in
        // App.tsx are already React.lazy()-imported specifically for
        // per-route code splitting, but grouping every file under pages/
        // or components/ into one shared chunk regardless of import style
        // silently merged all of them back into two ~800-970KB chunks,
        // so a first-time visitor to the marketing homepage downloaded
        // essentially the whole app (Records, EditVehicle, Admin,
        // Subscription, etc.) before seeing anything. Leaving pages/
        // components unlisted lets Rollup's own automatic chunking do
        // what it's designed for: a separate chunk per lazy-loaded route,
        // with genuinely shared modules split into their own common chunks.
        manualChunks: id => {
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
