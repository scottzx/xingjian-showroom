import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.bin'],
  resolve: { alias: { '@assets': resolve(__dirname, './src/assets') } },
  server: { fs: { allow: ['..'] } },
  build: { rollupOptions: { output: { manualChunks: { 'three-vendor': ['three'] } } } },
});
