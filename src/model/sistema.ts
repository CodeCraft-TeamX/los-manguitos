/** Fachada del sistema: coordina los seis gestores, como `Sistema` en el CLI. */

import * as datos from './datos';
import { horaActual } from './reloj';
import { TransicionInvalida, ValidacionError } from './errores';
import { GestorProductos } from './productos';
import { GestorUbicaciones } from './ubicaciones';
import { GestorVentas } from './ventas';
import { GestorPedidos } from './pedidos';
import { RedLogistica } from './logistica';
import { RegistroOperaciones } from './seguimiento';
import {
  EstadoPedido,
  type Pedido,
  type Ruta,
  type Transferencia,
  type Venta,
} from './tipos';

const SIGUIENTE_ESTADO: Partial<Record<EstadoPedido, EstadoPedido>> = {
  [EstadoPedido.Nuevo]: EstadoPedido.Confirmado,
  [EstadoPedido.Confirmado]: EstadoPedido.Preparando,
  [EstadoPedido.Preparando]: EstadoPedido.Listo,
  [EstadoPedido.Listo]: EstadoPedido.Despachado,
};

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

  /** Registra una venta, descuenta el stock de cada producto y emite su evento. */
  registrarVenta(clienteId: string, items: Array<{ sku: string; cantidad: number }>): Venta {
    const cliente = this.ventas.consultarCliente(clienteId);
    if (items.length === 0) throw new ValidacionError('La venta necesita al menos un producto');

    let total = 0;
    let articulos = 0;
    const detalles: string[] = [];
    for (const item of items) {
      const producto = this.productos.consultarProducto(item.sku);
      total += producto.precio * item.cantidad;
      articulos += item.cantidad;
      this.ubicaciones.ajustarStock(producto.ubicacion, item.sku, -item.cantidad);
      detalles.push(`${item.cantidad} ${producto.unidad} de ${producto.nombre}`);
    }

    const venta: Venta = {
      id: `V-2026-${String(838 + this.ventas.todasLasVentas().length).padStart(4, '0')}`,
      clienteId,
      cliente: cliente.nombre,
      tipoCliente: cliente.tipo === 'frecuente' ? 'Cliente frecuente' : 'Cliente minorista',
      sucursal: 'Centro',
      articulos,
      total: Number(total.toFixed(2)),
      hora: horaActual(),
      cancelada: false,
    };
    this.ventas.registrarVenta(venta);
    this.emitir('venta', 'sale', `Venta a ${cliente.nombre} · $${venta.total.toFixed(2)} (${detalles.join(', ')})`, venta.sucursal, 'Mostrador', venta.id.replace('V-2026-', 'V-'));
    return venta;
  }

  /** Da de alta un pedido nuevo en la cola de atención. */
  crearPedido(cliente?: string, destino?: string, total?: number): Pedido {
    const pedido: Pedido = {
      id: `P-2026-${String(307 + this.pedidos.todosLosPedidos().length).padStart(3, '0')}`,
      cliente: cliente ?? this.ventas.listarClientes()[0].nombre,
      destino: destino ?? 'SUC-CENTRO',
      recibido: horaActual(),
      entrega: 'Hoy · 4:00 p. m.',
      total: total ?? 250,
      estado: EstadoPedido.Nuevo,
    };
    this.pedidos.registrarPedido(pedido);
    this.emitir('pedido', 'order', `Nuevo pedido recibido · $${pedido.total.toFixed(2)}`, this.nombreUbicacion(pedido.destino), 'Sistema', pedido.id.replace('P-2026-', 'P-0'));
    return pedido;
  }

  /** Avanza un pedido al siguiente estado del ciclo y deja constancia en la bitácora. */
  avanzarPedido(id: string): Pedido {
    const pedido = this.pedidos.consultarPedido(id);
    const siguiente = SIGUIENTE_ESTADO[pedido.estado];
    if (!siguiente) throw new TransicionInvalida(`El pedido '${id}' ya está finalizado`);
    this.pedidos.cambiarEstado(id, siguiente);
    this.emitir('pedido', 'order', `Pedido ${id} pasó a ${siguiente}`, this.nombreUbicacion(pedido.destino), 'Equipo de bodega', pedido.id.replace('P-2026-', 'P-0'));
    return pedido;
  }

  /** Valida el stock y encola una transferencia (FIFO) con su evento. */
  solicitarTransferencia(datosTransferencia: {
    origen: string;
    destino: string;
    sku: string;
    cantidad: number;
  }): Transferencia {
    const transferencia: Transferencia = {
      id: `TR-2026-${String(17 + this.ubicaciones.transferenciasPendientes().length).padStart(3, '0')}`,
      ...datosTransferencia,
      estado: 'Preparada',
    };
    const registrada = this.ubicaciones.solicitarTransferencia(transferencia);
    const producto = this.productos.consultarProducto(registrada.sku);
    this.emitir(
      'transferencia',
      'transfer',
      `Solicitud de ${registrada.cantidad} ${producto.unidad} de ${producto.nombre}`,
      `${this.nombreUbicacion(registrada.origen)} → ${this.nombreUbicacion(registrada.destino)}`,
      'Equipo de bodega',
      registrada.id.replace('TR-2026-', 'TR-'),
    );
    return registrada;
  }

  /** Usa Dijkstra para planificar una ruta hacia una ubicación de la red. */
  planificarRuta(destino: string): Ruta {
    const camino = this.logistica.rutaMasCorta('CENTRAL', destino);
    const ruta: Ruta = {
      id: `R-${String(this.logistica.listarRutas().length + 2).padStart(2, '0')}`,
      destino,
      recorrido: `Bodega central → ${this.nombreUbicacion(destino)}`,
      paradas: 2,
      conductor: 'Ana Cruz',
      salida: horaActual(),
      estado: 'Preparada',
    };
    this.logistica.registrarRuta(ruta);
    this.emitir(
      'despacho',
      'delivery',
      `Ruta ${ruta.id} planificada · ${camino.map((nodo) => this.nombreUbicacion(nodo)).join(' → ')}`,
      this.nombreUbicacion(destino),
      'Logística',
      ruta.id.replace('R-', 'R-0'),
    );
    return ruta;
  }

  nombreUbicacion(id: string): string {
    return this.ubicaciones.consultarUbicacion(id).nombre;
  }

  private emitir(
    tipo: string,
    icono: string,
    detalle: string,
    ubicacion: string,
    responsable: string,
    referencia: string,
  ): void {
    this.seguimiento.registrarEvento({
      hora: horaActual(),
      tipo,
      icono,
      detalle,
      ubicacion,
      responsable,
      referencia,
    });
  }
}
