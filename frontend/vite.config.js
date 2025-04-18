import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDevelopment = mode === 'development';
  const serverHost = process.env.VITE_SERVER_HOST || 'localhost';
  const serverPort = process.env.VITE_SERVER_PORT || '3000';
  const devPort = process.env.VITE_DEV_PORT || '3000';

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
      port: parseInt(devPort),
      strictPort: true,
      hmr: {
        overlay: true,
        clientPort: parseInt(devPort),
        host: serverHost,
        protocol: 'ws',
      },
      proxy: {
        '/api': {
          target: `http://${serverHost}:${serverPort}`,
          changeOrigin: true,
          secure: false
        },
        '/socket.io': {
          target: `http://${serverHost}:${serverPort}`,
          changeOrigin: true,
          secure: false,
          ws: true
        }
      },
      watch: {
        usePolling: true,
      },
      cors: true,
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
    base: '/',
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@mui/material', '@mui/icons-material', 'socket.io-client'],
      exclude: [],
    },
  };
}); 