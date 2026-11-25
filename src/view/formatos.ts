/** Utilidades de presentación compartidas por las vistas. */

import { EstadoPedido, type Producto } from '../model/tipos';

/** Escapa texto que proviene del modelo antes de insertarlo en el marcado. */
export function esc(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function dinero(valor: number): string {
  return `$${valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Separa la parte entera de los centavos para reproducir las cifras del diseño original. */
export function partesDinero(valor: number): [string, string] {
  const [entero, decimal] = dinero(valor).split('.');
  return [entero, decimal ?? '00'];
}

export function numero(valor: number): string {
  return valor.toLocaleString('en-US');
}

export function estadoStock(producto: Producto): { clase: string; texto: string } {
  return producto.existencias < producto.minimo
    ? { clase: 'status-low', texto: 'Stock bajo' }
    : { clase: 'status-done', texto: 'Disponible' };
}

export function estadoPedido(estado: EstadoPedido): { clase: string; texto: string } {
  const estados: Record<EstadoPedido, { clase: string; texto: string }> = {
    [EstadoPedido.Nuevo]: { clase: 'status-new', texto: 'Nuevo' },
    [EstadoPedido.Confirmado]: { clase: 'status-done', texto: 'Confirmado' },
    [EstadoPedido.Preparando]: { clase: 'status-preparing', texto: 'Preparando' },
    [EstadoPedido.Listo]: { clase: 'status-route', texto: 'Listo' },
    [EstadoPedido.Despachado]: { clase: 'status-done', texto: 'Despachado' },
    [EstadoPedido.Cancelado]: { clase: 'status-low', texto: 'Cancelado' },
  };
  return estados[estado];
}

export function estadoRuta(estado: string): { clase: string; texto: string } {
  return estado === 'Preparada'
    ? { clase: 'status-route', texto: 'Preparada' }
    : { clase: 'status-preparing', texto: 'En curso' };
}

const ICONOS: Record<string, { clase: string; glifo: string; texto: string; estado: { clase: string; texto: string } }> = {
  venta: { clase: 'sale', glifo: '↗', texto: 'Venta', estado: { clase: 'status-done', texto: 'Completada' } },
  transferencia: { clase: 'transfer', glifo: '⇄', texto: 'Transferencia', estado: { clase: 'status-route', texto: 'En tránsito' } },
  pedido: { clase: 'order', glifo: '▤', texto: 'Pedido', estado: { clase: 'status-new', texto: 'Nuevo' } },
  inventario: { clase: 'stock', glifo: '＋', texto: 'Entrada', estado: { clase: 'status-done', texto: 'Completada' } },
  despacho: { clase: 'delivery', glifo: '⌁', texto: 'Despacho', estado: { clase: 'status-preparing', texto: 'En curso' } },
};

export function iconoEvento(tipo: string): { clase: string; glifo: string; texto: string } {
  const evento = ICONOS[tipo] ?? { clase: 'order', glifo: '•', texto: tipo };
  return { clase: evento.clase, glifo: evento.glifo, texto: evento.texto };
}

export function estadoEvento(tipo: string): { clase: string; texto: string } {
  return ICONOS[tipo]?.estado ?? { clase: 'status-done', texto: 'Registrado' };
}

export function nombreOperacion(tipo: string): string {
  const nombres: Record<string, string> = {
    venta: 'Venta registrada',
    transferencia: 'Transferencia enviada',
    pedido: 'Pedido recibido',
    inventario: 'Entrada registrada',
    despacho: 'Despacho iniciado',
  };
  return nombres[tipo] ?? 'Operación registrada';
}
