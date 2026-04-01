import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      // Raise the warning limit — we'll properly split chunks below
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Core React
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'react';
            }
            // Routing
            if (id.includes('node_modules/wouter')) {
              return 'router';
            }
            // Animation
            if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) {
              return 'motion';
            }
            // Supabase SDK
            if (id.includes('node_modules/@supabase')) {
              return 'supabase';
            }
            // TanStack Query
            if (id.includes('node_modules/@tanstack')) {
              return 'query';
            }
            // Icons
            if (id.includes('node_modules/lucide-react')) {
              return 'icons';
            }
            // Toast
            if (id.includes('node_modules/react-hot-toast')) {
              return 'toast';
            }
            // Let Vite handle the rest automatically to prevent circular dependencies
          },
        },
      },
    },
  };
});
