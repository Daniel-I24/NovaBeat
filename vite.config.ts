import { defineConfig } from 'vite';

export default defineConfig({
  // index.html está en la raíz, Vite lo detecta automáticamente
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
