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
      application: {
        // 启用压缩
        compress: true,
        compressTypes: ['gzip', 'brotli'],
      },
      vite: {
        build: {
          rollupOptions: {
            output: {
              // 优化代码分割策略，更细粒度的分包
              manualChunks: (id: string) => {
                // node_modules 中的依赖包
                if (id.includes('node_modules')) {
                  // Vue 核心库
                  if (id.includes('vue')) {
                    return 'vue';
                  }
                  // Ant Design Vue
                  if (id.includes('ant-design-vue')) {
                    return 'antd';
                  }
                  // 工具库
                  if (id.includes('@vueuse') || id.includes('dayjs')) {
                    return 'utils';
                  }
                }
              },
            },
          },
          // 提高性能：使用 esbuild 进行压缩
          minify: 'esbuild',
          // 减小包体积
          reportCompressedSize: false,
          // 关闭源码映射以减小体积
          sourcemap: false,
          // 提高 chunk 大小警告限制
          chunkSizeWarningLimit: 1500,
        },
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
