import swc from 'unplugin-swc';
import { configDefaults, defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    exclude: configDefaults.exclude,
    globals: true,
    root: './',
    setupFiles: ['./test/setup-e2e.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
      '@src': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './test'),
    },
  },
  plugins: [swc.vite()],
});
