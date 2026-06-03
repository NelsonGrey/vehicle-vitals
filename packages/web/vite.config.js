import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@vehicle-vitals\/shared$/, replacement: path.resolve(__dirname, '../shared/src/index.js') },
      { find: /^@vehicle-vitals\/shared\/types$/, replacement: path.resolve(__dirname, '../shared/src/types.js') },
      // allow imports like 'shared/...'
      { find: 'shared', replacement: path.resolve(__dirname, '../shared/src') },
      // ensure firebase imports from shared files resolve to root node_modules
      { find: 'firebase', replacement: path.resolve(__dirname, '../../node_modules/firebase') },
    ],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        format: 'es', // Use ES modules for better tree shaking
        manualChunks: undefined,
      },
    },
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions'],
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
})
