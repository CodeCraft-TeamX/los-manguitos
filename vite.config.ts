import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    rollupOptions: {
      input: {
        dashboard: 'index.html',
        productos: 'src/view/productos.html',
        ubicaciones: 'src/view/ubicaciones.html',
        ventas: 'src/view/ventas.html',
        pedidos: 'src/view/pedidos.html',
        distribucion: 'src/view/distribucion.html',
        seguimiento: 'src/view/seguimiento.html',
      },
    },
  },
});
