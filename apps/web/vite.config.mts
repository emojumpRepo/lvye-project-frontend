import process from 'node:process';

import { defineConfig } from '@vben/vite-config';

import { loadEnv } from 'vite';

export default defineConfig(
  async (config): Promise<{ application: any; vite: any }> => {
    const { mode = 'development' } = config || {};
    const root = process.cwd();
    const env = loadEnv(mode, root);

    const baseUrl = env.VITE_BASE_URL || 'http://127.0.0.1:48080';

    return {
      application: {},
      vite: {
        server: {
          proxy: {
            '/admin-api': {
              changeOrigin: true,
              rewrite: (path: string) => path.replace(/^\/admin-api/, ''),
              target: `${baseUrl}/admin-api`,
              ws: true,
            },
            '/app-api': {
              changeOrigin: true,
              rewrite: (path: string) => path.replace(/^\/app-api/, ''),
              target: `${baseUrl}/app-api`,
              ws: true,
            },
          },
        },
      },
    };
  },
) as any;
