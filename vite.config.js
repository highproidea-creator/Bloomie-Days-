import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Bloomie-Days-/',
  build: {
    rollupOptions: {
      output: { manualChunks: { three: ['three'] } },
    },
  },
});
