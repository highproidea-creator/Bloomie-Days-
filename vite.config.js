import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Bloomie-Days-/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/three/examples/jsm/')) return 'three-addons';
          if (id.includes('/node_modules/three/')) return 'three';
        },
      },
    },
  },
});
