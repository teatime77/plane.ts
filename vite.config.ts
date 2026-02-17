import { defineConfig, mergeConfig } from 'vite';
import { baseConfig } from '../vite.config.base';
import { resolve } from 'path';

export default defineConfig(
  mergeConfig(baseConfig, {
    build: {
      minify: false,
      lib: {
        entry: resolve(__dirname, 'ts/index.ts'),
        fileName: 'index',
        formats: ['es']
      },
      outDir: './plane.ts/public/lib/plane'
    }
  })
);