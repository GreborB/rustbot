import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [react()],
        build: {
            outDir: 'dist',
            sourcemap: true,
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['react', 'react-dom', 'react-router-dom'],
                    },
                },
            },
        },
        server: {
            port: parseInt(env.VITE_DEV_PORT || '3000'),
            host: true,
            proxy: {
                '/api': {
                    target: env.VITE_API_URL || 'http://localhost:3001',
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
        optimizeDeps: {
            include: ['react', 'react-dom', 'react-router-dom'],
        },
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
        define: {
            'process.env.NODE_ENV': JSON.stringify(mode),
            'process.env.VITE_APP_VERSION': JSON.stringify('1.0.0'),
        },
    };
}); 