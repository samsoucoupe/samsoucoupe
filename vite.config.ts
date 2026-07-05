import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// samsoucoupe universe — config Vite
// - index.html     = experience 3D (Babylon)
// - simple.html    = version mobile statique
// - assets/ css/   = ressources statiques
export default defineConfig({
  // On garde les deux pages comme entrypoints HTML
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        simple: fileURLToPath(new URL('./simple.html', import.meta.url)),
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
