import process from 'node:process';

import { defineConfig } from '@vben/vite-config';

import { loadEnv } from 'vite';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

export default defineConfig(
  async (config): Promise<{ application: any; vite: any }> => {
    const { mode = 'development' } = config || {};
    const root = process.cwd();
    const env = loadEnv(mode, root);

    const baseUrl = env.VITE_BASE_URL || 'http://127.0.0.1:48080';
    const cdnUrl = env.VITE_CDN_URL;

    return {
      application: {
        // 启用压缩
        compress: env.VITE_COMPRESS !== 'none',
        compressTypes: ['gzip', 'brotli'],
      },
      vite: {
        // 生产环境使用CDN作为静态资源基础路径
        base: mode === 'production' && cdnUrl ? cdnUrl : env.VITE_BASE || '/web/',
        
        plugins: [
          // 自定义插件：复制 version.json 到输出目录
          {
            name: 'copy-version-json',
            writeBundle() {
              const sourcePath = join(process.cwd(), '../../version.json');
              const destDir = join(process.cwd(), 'dist');
              const destPath = join(destDir, 'version.json');
              
              if (existsSync(sourcePath)) {
                if (!existsSync(destDir)) {
                  mkdirSync(destDir, { recursive: true });
                }
                copyFileSync(sourcePath, destPath);
                console.log('✓ version.json copied to dist directory');
              }
            },
          },
        ],
        
        build: {
          rollupOptions: {
            output: {
              // 优化代码分割策略
              manualChunks: (id: string) => {
                // node_modules 中的依赖包
                if (id.includes('node_modules')) {
                  // 工具库
                  if (id.includes('@vueuse')) {
                    return 'utils';
                  }
                  // 其他第三方库（排除CDN外部化的库）
                  if (!id.includes('@vben')) {
                    return 'vendor';
                  }
                }
                // vben 框架代码
                if (id.includes('@vben')) {
                  return 'vben';
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
          // 资源内联阈值
          assetsInlineLimit: 4096,
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
