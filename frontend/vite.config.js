import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    hmr: {
      host: '129.151.212.105',
      port: 3000,
      protocol: 'ws',
      overlay: false
    },
    proxy: {
      '/api': {
        target: 'http://129.151.212.105:3001',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://129.151.212.105:3001',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  build: {
    sourcemap: false,
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.jsx'),
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'socket-vendor': ['socket.io-client']
        }
      }
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@mui/material', '@mui/icons-material', 'socket.io-client']
  },
  base: '/'
}); 