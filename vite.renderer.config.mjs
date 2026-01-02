import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  root: path.resolve(path.dirname(new URL(import.meta.url).pathname), 'src/renderer'),
  base: './',
  plugins: [react()],
  build: {
    outDir: path.resolve(path.dirname(new URL(import.meta.url).pathname), 'renderer-dist'),
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@renderer': path.resolve(path.dirname(new URL(import.meta.url).pathname), 'src/renderer'),
      '@shared': path.resolve(path.dirname(new URL(import.meta.url).pathname), 'src/shared')
    }
  },
  server: {
    port: 5173
  }
});

