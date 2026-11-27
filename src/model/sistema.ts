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
  type Cliente,
  type Movimiento,
  type Pedido,
  type Producto,
  type Proveedor,
  type Ruta,
  type Transferencia,
  type Venta,
  type VentaItem,
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
    for (const proveedor of datos.proveedores) this.productos.registrarProveedor(proveedor);
    this.productos.registrarCategoria('Frutas frescas');
    this.productos.registrarCategoria('Cítricos', 'Frutas frescas');
    this.productos.registrarCategoria('Procesados');
    this.productos.registrarCategoria('Néctares', 'Procesados');
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
    for (const pedido of [...datos.pedidos].reverse()) this.pedidos.registrarPedido(pedido);

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

  /** Fuente única de verdad para el stock de un producto en todas las ubicaciones. */
  stockProducto(sku: string): number {
    return this.ubicaciones.stockTotal(sku);
  }

  registrarProveedor(proveedor: Proveedor): Proveedor {
    const registrado = this.productos.registrarProveedor(proveedor);
    this.emitir(
      'inventario',
      'stock',
      `Proveedor ${registrado.nombre} registrado`,
      'Catálogo',
      'Administración',
      registrado.id,
    );
    return registrado;
  }

  registrarProducto(producto: Producto, stockInicial = 0): Producto {
    if (!Number.isInteger(stockInicial) || stockInicial < 0) {
      throw new ValidacionError('El stock inicial debe ser un entero mayor o igual que cero');
    }
    const ubicacion = this.ubicaciones.consultarUbicacion(producto.ubicacion);
    const registrado = this.productos.registrarProducto(producto);
    if (stockInicial > 0) {
      this.ubicaciones.ajustarStock(ubicacion.id, registrado.sku, stockInicial);
      ubicacion.unidades += stockInicial;
      ubicacion.productos += 1;
      ubicacion.actualizado = 'justo ahora';
      this.productos.registrarMovimiento(
        registrado.sku,
        'entrada',
        stockInicial,
        registrado.proveedorId
          ? this.productos.consultarProveedor(registrado.proveedorId).nombre
          : 'Alta inicial',
        horaActual(),
      );
    }
    this.emitir(
      'inventario',
      'stock',
      `Producto ${registrado.nombre} (${registrado.sku}) registrado con ${stockInicial} ${registrado.unidad}`,
      ubicacion.nombre,
      'Administración',
      registrado.sku,
    );
    return registrado;
  }

  registrarMovimientoInventario(
    sku: string,
    tipo: Movimiento['tipo'],
    cantidad: number,
    ubicacionId: string,
    descripcion: string,
  ): Movimiento {
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      throw new ValidacionError('La cantidad debe ser un entero mayor que cero');
    }
    const producto = this.productos.consultarProducto(sku);
    const ubicacion = this.ubicaciones.consultarUbicacion(ubicacionId);
    const delta = tipo === 'entrada' ? cantidad : -cantidad;
    this.ubicaciones.ajustarStock(ubicacionId, sku, delta);
    ubicacion.unidades += delta;
    ubicacion.actualizado = 'justo ahora';
    const motivo = descripcion.trim() || (tipo === 'entrada' ? 'Ingreso a bodega' : 'Salida operativa');
    const movimiento = this.productos.registrarMovimiento(sku, tipo, cantidad, motivo, horaActual());
    this.emitir(
      'inventario',
      'stock',
      `${tipo === 'entrada' ? 'Ingreso' : 'Salida'} de ${cantidad} ${producto.unidad} de ${producto.nombre} (${motivo})`,
      ubicacion.nombre,
      'Equipo de bodega',
      sku,
    );
    return movimiento;
  }

  registrarCliente(cliente: Cliente): Cliente {
    const id = cliente.id.trim();
    const nombre = cliente.nombre.trim();
    if (!id || !nombre) throw new ValidacionError('El cliente requiere identificador y nombre');
    const registrado = this.ventas.registrarCliente({ ...cliente, id, nombre });
    this.emitir('venta', 'sale', `Cliente ${registrado.nombre} registrado`, 'Centro', 'Mostrador', registrado.id);
    return registrado;
  }

  /** Registra una venta, descuenta el stock de cada producto y emite su evento. */
  registrarVenta(clienteId: string, items: Array<{ sku: string; cantidad: number }>): Venta {
    const cliente = this.ventas.consultarCliente(clienteId);
    if (items.length === 0) throw new ValidacionError('La venta necesita al menos un producto');

    let total = 0;
    let articulos = 0;
    const detalles: string[] = [];
    const lineas: VentaItem[] = [];
    for (const item of items) {
      if (!Number.isInteger(item.cantidad) || item.cantidad < 1) {
        throw new ValidacionError('La cantidad debe ser un entero mayor que cero');
      }
      const producto = this.productos.consultarProducto(item.sku);
      const disponible = this.ubicaciones.consultarStock(producto.ubicacion, item.sku);
      if (disponible < item.cantidad) {
        throw new ValidacionError(
          `Stock insuficiente de '${producto.nombre}' en '${producto.ubicacion}' (disponible: ${disponible})`,
        );
      }
      total += producto.precio * item.cantidad;
      articulos += item.cantidad;
      lineas.push({ sku: item.sku, cantidad: item.cantidad, ubicacion: producto.ubicacion });
    }

    for (const linea of lineas) {
      const producto = this.productos.consultarProducto(linea.sku);
      this.ubicaciones.ajustarStock(linea.ubicacion, linea.sku, -linea.cantidad);
      const ubicacion = this.ubicaciones.consultarUbicacion(linea.ubicacion);
      ubicacion.unidades -= linea.cantidad;
      ubicacion.actualizado = 'justo ahora';
      this.productos.registrarMovimiento(
        linea.sku,
        'salida',
        linea.cantidad,
        `Venta a ${cliente.nombre}`,
        horaActual(),
      );
      detalles.push(`${linea.cantidad} ${producto.unidad} de ${producto.nombre}`);
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
      items: lineas,
    };
    this.ventas.registrarVenta(venta);
    this.emitir('venta', 'sale', `Venta a ${cliente.nombre} · $${venta.total.toFixed(2)} (${detalles.join(', ')})`, venta.sucursal, 'Mostrador', venta.id.replace('V-2026-', 'V-'));
    return venta;
  }

  /** Cancela la última venta activa (pila LIFO), restaura stock y emite evento. */
  cancelarUltimaVenta(): Venta {
    const venta = this.ventas.cancelarUltimaVenta();
    for (const item of venta.items ?? []) {
      this.ubicaciones.ajustarStock(item.ubicacion, item.sku, item.cantidad);
      const ubicacion = this.ubicaciones.consultarUbicacion(item.ubicacion);
      ubicacion.unidades += item.cantidad;
      ubicacion.actualizado = 'justo ahora';
      this.productos.registrarMovimiento(
        item.sku,
        'entrada',
        item.cantidad,
        `Cancelación ${venta.id}`,
        horaActual(),
      );
    }
    this.emitir(
      'venta',
      'sale',
      `Venta ${venta.id} cancelada (LIFO) · $${venta.total.toFixed(2)}`,
      venta.sucursal,
      'Mostrador',
      venta.id.replace('V-2026-', 'V-'),
    );
    return venta;
  }

  /** Da de alta un pedido nuevo en la cola de atención. */
  crearPedido(cliente?: string, destino?: string, total?: number): Pedido {
    if (total !== undefined && (!Number.isFinite(total) || total <= 0)) {
      throw new ValidacionError('El total del pedido debe ser mayor que cero');
    }
    const pedido: Pedido = {
      id: `P-2026-${String(307 + this.pedidos.todosLosPedidos().length).padStart(3, '0')}`,
      cliente: cliente?.trim() || this.ventas.listarClientes()[0].nombre,
      destino: destino ?? 'SUC-CENTRO',
      recibido: horaActual(),
      entrega: 'Hoy · 4:00 p. m.',
      total: total !== undefined ? Number(total.toFixed(2)) : 250,
      estado: EstadoPedido.Nuevo,
    };
    this.pedidos.registrarPedido(pedido);
    this.emitir('pedido', 'order', `Nuevo pedido recibido · $${pedido.total.toFixed(2)}`, this.nombreUbicacion(pedido.destino), 'Sistema', pedido.id.replace('P-2026-', 'P-0'));
    return pedido;
  }

  /** Atiende el pedido más antiguo en la cola FIFO (Nuevo → Confirmado). */
  atenderSiguientePedido(): Pedido {
    const pedido = this.pedidos.atenderSiguiente();
    this.emitir('pedido', 'order', `Pedido ${pedido.id} atendido (FIFO) → ${pedido.estado}`, this.nombreUbicacion(pedido.destino), 'Equipo de bodega', pedido.id.replace('P-2026-', 'P-0'));
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

  /** Deshace el último cambio de estado usando la pila del pedido. */
  deshacerEstadoPedido(id: string): Pedido {
    const pedido = this.pedidos.deshacerCambio(id);
    this.emitir('pedido', 'order', `Pedido ${id} restaurado a ${pedido.estado} (Pila)`, this.nombreUbicacion(pedido.destino), 'Equipo de bodega', pedido.id.replace('P-2026-', 'P-0'));
    return pedido;
  }

  /** Cancela un pedido activo antes de despacharlo. */
  cancelarPedido(id: string): Pedido {
    const pedido = this.pedidos.cambiarEstado(id, EstadoPedido.Cancelado);
    this.emitir('pedido', 'order', `Pedido ${id} cancelado`, this.nombreUbicacion(pedido.destino), 'Equipo de bodega', pedido.id.replace('P-2026-', 'P-0'));
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

  /** Procesa la transferencia más antigua en la cola FIFO y mueve el stock. */
  procesarSiguienteTransferencia(): Transferencia {
    const transferencia = this.ubicaciones.procesarSiguienteTransferencia();
    const origen = this.ubicaciones.consultarUbicacion(transferencia.origen);
    const destino = this.ubicaciones.consultarUbicacion(transferencia.destino);
    origen.unidades -= transferencia.cantidad;
    destino.unidades += transferencia.cantidad;
    origen.actualizado = 'justo ahora';
    destino.actualizado = 'justo ahora';
    const producto = this.productos.consultarProducto(transferencia.sku);
    this.productos.registrarMovimiento(
      transferencia.sku,
      'salida',
      transferencia.cantidad,
      `Transferencia ${transferencia.id} hacia ${destino.nombre}`,
      horaActual(),
    );
    this.emitir(
      'transferencia',
      'transfer',
      `Transferencia ${transferencia.id} completada (FIFO): ${transferencia.cantidad} ${producto.unidad} de ${producto.nombre}`,
      `${origen.nombre} → ${destino.nombre}`,
      'Equipo de bodega',
      transferencia.id.replace('TR-2026-', 'TR-'),
    );
    return transferencia;
  }

  /** Usa Dijkstra para planificar una ruta entre dos ubicaciones de la red. */
  planificarRuta(destino: string, origen = 'CENTRAL'): Ruta {
    if (origen === destino) {
      throw new ValidacionError('El origen y el destino deben ser distintos');
    }
    const camino = this.logistica.rutaMasCorta(origen, destino);
    const nombres = camino.map((nodo) => this.nombreUbicacion(nodo));
    const ruta: Ruta = {
      id: `R-${String(this.logistica.listarRutas().length + 2).padStart(2, '0')}`,
      destino,
      recorrido: nombres.join(' → '),
      paradas: camino.length,
      conductor: 'Ana Cruz',
      salida: horaActual(),
      estado: 'Preparada',
    };
    this.logistica.registrarRuta(ruta);
    this.emitir(
      'despacho',
      'delivery',
      `Ruta ${ruta.id} planificada (${this.logistica.distanciaRuta(camino)} km) · ${ruta.recorrido}`,
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
