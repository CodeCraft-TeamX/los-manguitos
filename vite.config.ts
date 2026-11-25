import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    // Una sola entrada: todos los módulos TS se empaquetan en un único HTML.
    rollupOptions: {
      input: 'index.html',
    },
  },
});
