/** Fachada del sistema: coordina los seis gestores, como `Sistema` en el CLI. */

import * as datos from './datos';
import { GestorProductos } from './productos';
import { GestorUbicaciones } from './ubicaciones';
import { GestorVentas } from './ventas';
import { GestorPedidos } from './pedidos';
import { RedLogistica } from './logistica';
import { RegistroOperaciones } from './seguimiento';

export class Sistema {
  readonly productos = new GestorProductos();
  readonly ubicaciones = new GestorUbicaciones();
  readonly ventas = new GestorVentas();
  readonly pedidos = new GestorPedidos();
  readonly logistica = new RedLogistica();
  readonly seguimiento = new RegistroOperaciones();

  /** Carga el dataset de la versión "bonita" en los seis gestores. */
  cargarDemo(): void {
    this.productos.registrarCategoria('Frutas frescas');
    this.productos.registrarCategoria('Procesados');
    for (const producto of datos.productos) this.productos.registrarProducto(producto);
    for (const movimiento of datos.movimientos) {
      this.productos.registrarMovimiento(
        movimiento.sku,
        movimiento.tipo,
        movimiento.cantidad,
        movimiento.descripcion,
        movimiento.hora,
      );
    }

    for (const ubicacion of datos.ubicaciones) this.ubicaciones.registrarUbicacion(ubicacion);
    for (const producto of datos.productos) {
      this.ubicaciones.ajustarStock(producto.ubicacion, producto.sku, producto.existencias);
    }
    for (const transferencia of datos.transferencias) {
      this.ubicaciones.registrarTransferencia(transferencia);
    }

    for (const cliente of datos.clientes) this.ventas.registrarCliente(cliente);
    for (const venta of datos.ventas) this.ventas.registrarVenta(venta);
    for (const pedido of datos.pedidos) this.pedidos.registrarPedido(pedido);

    for (const ubicacion of datos.ubicaciones) this.logistica.agregarNodo(ubicacion.id);
    for (const [origen, destino, distancia] of datos.conexiones) {
      this.logistica.agregarConexion(origen, destino, distancia);
    }
    for (const ruta of datos.rutas) this.logistica.registrarRuta(ruta);

    for (const evento of datos.eventos) this.seguimiento.registrarEvento(evento);
  }

  indicadores(): typeof datos.cifras {
    return datos.cifras;
  }
}
