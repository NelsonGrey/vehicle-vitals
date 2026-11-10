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
    // es2015 pulled a ~600KB core-js polyfill chunk into every page, which
    // current Chrome and Safari never execute. es2022 matches the browsers
    // this app already ships to (including iOS WKWebView).
    target: 'es2022',
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
          if (!id.includes('node_modules')) {
            return undefined;
          }
          const normalized = id.replace(/\\/g, '/');
          // Only group modules the marketing shell always needs. A catch-all
          // vendor chunk was pulling jspdf's core-js (and the rest of the
          // app's node_modules) into the homepage preload.
          if (
            normalized.includes('/firebase/auth/') ||
            normalized.includes('@firebase/auth') ||
            normalized.includes('/firebase/app/') ||
            normalized.includes('@firebase/app')
          ) {
            return 'firebase-auth';
          }
          if (
            normalized.includes('/react-dom/') ||
            normalized.includes('/node_modules/react/') ||
            normalized.includes('react-router') ||
            normalized.includes('/scheduler/')
          ) {
            return 'react-vendor';
          }
          return undefined;
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
