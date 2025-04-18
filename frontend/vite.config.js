import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDevelopment = mode === 'development';

  return {
    plugins: [
      react({
        // Enable Fast Refresh
        fastRefresh: true,
        // Run time JSX transforms for error boundaries
        jsxRuntime: 'automatic',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3001,
      strictPort: true,
      hmr: {
        overlay: true,
        clientPort: 3001,
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        },
        '/socket.io': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          ws: true
        }
      },
      watch: {
        usePolling: true,
      },
    },
    build: {
      sourcemap: isDevelopment,
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      minify: isDevelopment ? false : 'terser',
      terserOptions: {
        compress: {
          drop_console: !isDevelopment,
          drop_debugger: !isDevelopment,
          pure_funcs: isDevelopment ? [] : ['console.log', 'console.info', 'console.debug', 'console.trace']
        }
      },
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
            'socket-vendor': ['socket.io-client'],
          }
        }
      }
    },
    base: './',
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@mui/material', '@mui/icons-material', 'socket.io-client'],
      exclude: [],
    },
  };
}); 