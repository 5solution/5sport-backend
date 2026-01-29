import swc from 'unplugin-swc';
import { configDefaults, defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    include: ['**/*.spec.ts'],
    exclude: [...configDefaults.exclude, '**/*.e2e-spec.ts'],
    globals: true,
    root: './',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.spec.ts',
        '**/*.e2e-spec.ts',
        '**/main.ts',
        '**/cli.ts',
        '**/migrations/**',
        '**/test/**',
        '**/*.config.ts',
        '**/*.config.mts',
        '**/index.ts',
        '**/*.module.ts',
        '**/*.dto.ts',
        '**/*.entity.ts',
        '**/typeorm.config.ts',
        '**/utils/base/**',
        '**/guards/google-auth.guard.ts',
        '**/guards/local-auth.guard.ts',
        '**/guards/jwt-auth.guard.ts',
        '**/strategies/google.strategy.ts',
        '**/strategies/local.strategy.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
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
