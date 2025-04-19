import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command, mode }) => {
    // Load env file based on `mode` in the current working directory
    const env = loadEnv(mode, process.cwd(), '');
    
    // Configuration
    const isDevelopment = command === 'serve';
    const isProduction = command === 'build';
    const basePath = env.VITE_BASE_PATH || '/';
    const apiUrl = env.VITE_API_URL || 'http://localhost:3000';
    const devPort = parseInt(env.VITE_DEV_PORT || '3001', 10);
    
    return {
        base: basePath,
        server: {
            port: devPort,
            strictPort: true,
            proxy: {
                '/api': {
                    target: apiUrl,
                    changeOrigin: true,
                    secure: false,
                },
                '/socket.io': {
                    target: apiUrl,
                    ws: true,
                    changeOrigin: true,
                },
            },
        },
        plugins: [
            react({
                fastRefresh: true,
                jsxRuntime: 'automatic',
                babel: {
                    plugins: [
                        ['@babel/plugin-proposal-decorators', { legacy: true }],
                        ['@babel/plugin-proposal-class-properties', { loose: true }],
                    ],
                },
            }),
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                '@components': path.resolve(__dirname, './src/components'),
                '@pages': path.resolve(__dirname, './src/pages'),
                '@contexts': path.resolve(__dirname, './src/contexts'),
                '@services': path.resolve(__dirname, './src/services'),
                '@utils': path.resolve(__dirname, './src/utils'),
            },
        },
        build: {
            outDir: 'dist',
            assetsDir: 'assets',
            emptyOutDir: true,
            sourcemap: isDevelopment,
            minify: isProduction ? 'terser' : false,
            terserOptions: {
                compress: {
                    drop_console: isProduction,
                    drop_debugger: isProduction,
                    pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : [],
                },
                format: {
                    comments: false,
                },
            },
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['react', 'react-dom', 'react-router-dom'],
                        mui: ['@mui/material', '@mui/icons-material'],
                    },
                },
            },
        },
        optimizeDeps: {
            include: ['react', 'react-dom', 'react-router-dom', '@mui/material', '@mui/icons-material'],
        },
        define: {
            'process.env.NODE_ENV': JSON.stringify(mode),
            'process.env.VITE_APP_VERSION': JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
        },
    };
}); 