import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Talpix is a pure-JavaScript (CRA) codebase that puts JSX inside `.js` files.
// esbuild treats `.js` as plain JS by default, so we set the jsx loader for our
// source `.js` files (build + dep pre-bundling) and let the React plugin handle
// Fast Refresh for them.
export default defineConfig({
  plugins: [react({ include: /\.(js|jsx)$/ })],
  esbuild: { loader: 'jsx', include: /src\/.*\.js$/, exclude: [] },
  optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
