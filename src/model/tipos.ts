/** Entidades del dominio compartidas por los gestores y las vistas. */

export type Seccion =
  | 'resumen'
  | 'productos'
  | 'ubicaciones'
  | 'ventas'
  | 'pedidos'
  | 'distribucion'
  | 'seguimiento';

export type Tono = 'green' | 'orange' | 'blue' | 'violet';

export interface Producto {
  sku: string;
  nombre: string;
  categoria: string;
  ubicacion: string;
  unidad: string;
  existencias: number;
  minimo: number;
  precio: number;
  inicial: string;
  thumb: string;
}

export interface Movimiento {
  sku: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  descripcion: string;
  hora: string;
}

export interface Ubicacion {
  id: string;
  nombre: string;
  tipo: 'central' | 'sucursal';
  direccion: string;
  productos: number;
  actualizado: string;
  unidades: number;
  estado: string;
}

export interface Transferencia {
  id: string;
  origen: string;
  destino: string;
  sku: string;
  cantidad: number;
  estado: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  tipo: 'frecuente' | 'minorista';
}

export interface Venta {
  id: string;
  clienteId: string;
  cliente: string;
  tipoCliente: string;
  sucursal: string;
  articulos: number;
  total: number;
  hora: string;
  cancelada: boolean;
}

/** Estados del ciclo de atención, en el orden permitido por el negocio. */
export enum EstadoPedido {
  Nuevo = 'Nuevo',
  Confirmado = 'Confirmado',
  Preparando = 'Preparando',
  Listo = 'Listo',
  Despachado = 'Despachado',
  Cancelado = 'Cancelado',
}

export interface Pedido {
  id: string;
  cliente: string;
  destino: string;
  recibido: string;
  entrega: string;
  total: number;
  estado: EstadoPedido;
}

export interface Ruta {
  id: string;
  destino: string;
  recorrido: string;
  paradas: number;
  conductor: string;
  salida: string;
  estado: string;
}

export interface Entrega {
  id: string;
  pedidoId: string;
  ruta: string[];
}

export interface Evento {
  hora: string;
  tipo: string;
  icono: string;
  detalle: string;
  ubicacion: string;
  responsable: string;
  referencia: string;
}

export interface Indicador {
  etiqueta: string;
  valor: string;
  sufijo?: string;
  simbolo: string;
  tono: Tono;
  nota: string;
  tendencia?: string;
  sparkline?: string;
}
