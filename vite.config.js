import { defineConfig } from 'vite';

export default defineConfig({
  base: '/foundry-langgraph-presentation/',
  server: {
    port: 5174,
    open: false,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
