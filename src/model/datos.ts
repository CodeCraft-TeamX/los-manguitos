/**
 * Dataset de demostración de la versión web ("bonita"): frutas frescas
 * y procesados, con referencias PR-xxx, V-2026-xxxx, P-2026-xxx y R-xx.
 * Es el equivalente a `src/datos.py` del prototipo CLI.
 */

import {
  EstadoPedido,
  type Cliente,
  type Evento,
  type Movimiento,
  type Pedido,
  type Producto,
  type Ruta,
  type Transferencia,
  type Ubicacion,
  type Venta,
} from './tipos';

export const cifras = {
  ventasHoy: 2486.5,
  productosActivos: 128,
  pedidosPorAtender: 14,
  entregasEnCurso: 6,
  ventasSemana: 14820.4,
  tendenciaDia: 12.8,
  tendenciaSemana: 8.4,
};

export const productos: Producto[] = [
  { sku: 'PR-001', nombre: 'Mango Tommy', categoria: 'Frutas frescas', ubicacion: 'CENTRAL', unidad: 'kg', existencias: 12, minimo: 25, precio: 2.4, inicial: 'M', thumb: 'mango' },
  { sku: 'PR-008', nombre: 'Limón pérsico', categoria: 'Frutas frescas', ubicacion: 'SUC-CENTRO', unidad: 'cajas', existencias: 8, minimo: 20, precio: 3.2, inicial: 'L', thumb: 'lime' },
  { sku: 'PR-024', nombre: 'Néctar de mango', categoria: 'Procesados', ubicacion: 'CENTRAL', unidad: 'uds.', existencias: 16, minimo: 30, precio: 1.5, inicial: 'N', thumb: 'honey' },
  { sku: 'PR-015', nombre: 'Aguacate nacional', categoria: 'Frutas frescas', ubicacion: 'SUC-SANTA-ANA', unidad: 'kg', existencias: 74, minimo: 20, precio: 2.8, inicial: 'A', thumb: 'avocado' },
  { sku: 'PR-031', nombre: 'Pulpa de mango', categoria: 'Procesados', ubicacion: 'CENTRAL', unidad: 'uds.', existencias: 46, minimo: 18, precio: 4.1, inicial: 'P', thumb: 'tomato' },
];

export const movimientos: Movimiento[] = [
  { sku: 'PR-001', tipo: 'entrada', cantidad: 40, descripcion: 'Finca El Paraíso', hora: '08:32 a. m.' },
  { sku: 'PR-008', tipo: 'salida', cantidad: 24, descripcion: 'Transferencia a Santa Ana', hora: '10:18 a. m.' },
  { sku: 'PR-024', tipo: 'entrada', cantidad: 20, descripcion: 'Producción semanal', hora: '11:05 a. m.' },
];

export const ubicaciones: Ubicacion[] = [
  { id: 'CENTRAL', nombre: 'Bodega central', tipo: 'central', direccion: 'San Salvador · Soyapango', productos: 84, actualizado: 'hace 4 min', unidades: 1842, estado: 'Operativa' },
  { id: 'SUC-CENTRO', nombre: 'Sucursal Centro', tipo: 'sucursal', direccion: 'San Salvador · Centro Histórico', productos: 62, actualizado: 'hace 12 min', unidades: 624, estado: 'Operativa' },
  { id: 'SUC-SANTA-ANA', nombre: 'Sucursal Santa Ana', tipo: 'sucursal', direccion: 'Santa Ana · Centro', productos: 58, actualizado: 'hace 21 min', unidades: 510, estado: 'Operativa' },
  { id: 'SUC-SAN-MIGUEL', nombre: 'Sucursal San Miguel', tipo: 'sucursal', direccion: 'San Miguel · Avenida Roosevelt', productos: 51, actualizado: 'hace 38 min', unidades: 438, estado: 'Operativa' },
  { id: 'PUERTO-LA-LIBERTAD', nombre: 'Puerto La Libertad', tipo: 'sucursal', direccion: 'La Libertad · Puerto', productos: 44, actualizado: 'hace 45 min', unidades: 296, estado: 'Operativa' },
];

export const transferencias: Transferencia[] = [
  { id: 'TR-2026-019', origen: 'CENTRAL', destino: 'SUC-SANTA-ANA', sku: 'PR-008', cantidad: 24, estado: 'En tránsito' },
  { id: 'TR-2026-018', origen: 'CENTRAL', destino: 'SUC-CENTRO', sku: 'PR-001', cantidad: 12, estado: 'En tránsito' },
  { id: 'TR-2026-017', origen: 'CENTRAL', destino: 'SUC-SAN-MIGUEL', sku: 'PR-024', cantidad: 8, estado: 'Preparada' },
];

export const clientes: Cliente[] = [
  { id: 'CLI-01', nombre: 'Mercado La Ceiba', tipo: 'frecuente' },
  { id: 'CLI-02', nombre: 'Restaurante El Patio', tipo: 'frecuente' },
  { id: 'CLI-03', nombre: 'Rosa Hernández', tipo: 'minorista' },
  { id: 'CLI-04', nombre: 'Hotel Las Palmeras', tipo: 'frecuente' },
  { id: 'CLI-05', nombre: 'José Martínez', tipo: 'minorista' },
];

export const ventas: Venta[] = [
  { id: 'V-2026-0842', clienteId: 'CLI-01', cliente: 'Mercado La Ceiba', tipoCliente: 'Cliente frecuente', sucursal: 'Centro', articulos: 4, total: 186, hora: '10:42 a. m.', cancelada: false },
  { id: 'V-2026-0841', clienteId: 'CLI-02', cliente: 'Restaurante El Patio', tipoCliente: 'Cliente frecuente', sucursal: 'Santa Ana', articulos: 7, total: 324.5, hora: '10:26 a. m.', cancelada: false },
  { id: 'V-2026-0840', clienteId: 'CLI-03', cliente: 'Rosa Hernández', tipoCliente: 'Cliente minorista', sucursal: 'Centro', articulos: 2, total: 18.75, hora: '10:11 a. m.', cancelada: false },
  { id: 'V-2026-0839', clienteId: 'CLI-04', cliente: 'Hotel Las Palmeras', tipoCliente: 'Cliente frecuente', sucursal: 'San Miguel', articulos: 11, total: 508, hora: '09:48 a. m.', cancelada: false },
  { id: 'V-2026-0838', clienteId: 'CLI-05', cliente: 'José Martínez', tipoCliente: 'Cliente minorista', sucursal: 'Centro', articulos: 3, total: 42.25, hora: '09:33 a. m.', cancelada: false },
];

export const pedidos: Pedido[] = [
  { id: 'P-2026-311', cliente: 'Comercial La Ceiba', destino: 'SUC-SANTA-ANA', recibido: '10:56 a. m.', entrega: 'Hoy · 2:00 p. m.', total: 482, estado: EstadoPedido.Nuevo },
  { id: 'P-2026-310', cliente: 'Restaurante El Patio', destino: 'SUC-CENTRO', recibido: '10:22 a. m.', entrega: 'Hoy · 12:30 p. m.', total: 216.5, estado: EstadoPedido.Preparando },
  { id: 'P-2026-309', cliente: 'Hotel Las Palmeras', destino: 'SUC-SAN-MIGUEL', recibido: '09:48 a. m.', entrega: 'Hoy · 1:00 p. m.', total: 724, estado: EstadoPedido.Preparando },
  { id: 'P-2026-308', cliente: 'Mercado Don Pedro', destino: 'SUC-CENTRO', recibido: '09:15 a. m.', entrega: 'Hoy · 11:30 a. m.', total: 168, estado: EstadoPedido.Listo },
  { id: 'P-2026-307', cliente: 'Distribuidora El Sol', destino: 'CENTRAL', recibido: '08:52 a. m.', entrega: 'Mañana · 9:00 a. m.', total: 1120, estado: EstadoPedido.Confirmado },
];

/** Distancias de demostración entre los nodos del mapa de distribución. */
export const conexiones: Array<[string, string, number]> = [
  ['CENTRAL', 'SUC-CENTRO', 12],
  ['CENTRAL', 'SUC-SANTA-ANA', 26],
  ['CENTRAL', 'SUC-SAN-MIGUEL', 48],
  ['CENTRAL', 'PUERTO-LA-LIBERTAD', 18],
  ['SUC-CENTRO', 'PUERTO-LA-LIBERTAD', 14],
];

export const rutas: Ruta[] = [
  { id: 'R-04', destino: 'SUC-SANTA-ANA', recorrido: 'Bodega central → Santa Ana', paradas: 3, conductor: 'José Ramírez', salida: '11:30 a. m.', estado: 'Preparada' },
  { id: 'R-03', destino: 'SUC-CENTRO', recorrido: 'Bodega central → San Salvador', paradas: 4, conductor: 'Pedro Molina', salida: '09:15 a. m.', estado: 'En curso' },
  { id: 'R-02', destino: 'PUERTO-LA-LIBERTAD', recorrido: 'Bodega central → La Libertad', paradas: 2, conductor: 'Ana Cruz', salida: '08:40 a. m.', estado: 'En curso' },
];

/** Carrito del panel de venta rápida; cantidades de demostración. */
export const ventaRapida: Array<{ sku: string; cantidad: number }> = [
  { sku: 'PR-001', cantidad: 2 },
  { sku: 'PR-024', cantidad: 3 },
];

export const eventos: Evento[] = [
  { hora: '10:42 a. m.', tipo: 'venta', icono: 'sale', detalle: 'Venta a Mercado La Ceiba · $186.00', ubicacion: 'Sucursal Centro', responsable: 'María López', referencia: 'V-0842' },
  { hora: '10:18 a. m.', tipo: 'transferencia', icono: 'transfer', detalle: 'Salida de 24 cajas de limón pérsico', ubicacion: 'Central → Santa Ana', responsable: 'José Ramírez', referencia: 'TR-019' },
  { hora: '09:56 a. m.', tipo: 'pedido', icono: 'order', detalle: 'Nuevo pedido recibido · $482.00', ubicacion: 'Bodega central', responsable: 'Sistema', referencia: 'P-0311' },
  { hora: '09:32 a. m.', tipo: 'inventario', icono: 'stock', detalle: 'Ingreso de 40 kg de Mango Tommy', ubicacion: 'Bodega central', responsable: 'Pedro Molina', referencia: 'EN-126' },
  { hora: '09:15 a. m.', tipo: 'despacho', icono: 'delivery', detalle: 'Ruta 03 inició recorrido · 4 paradas', ubicacion: 'San Salvador', responsable: 'Pedro Molina', referencia: 'R-003' },
  { hora: '08:48 a. m.', tipo: 'venta', icono: 'sale', detalle: 'Venta a Hotel Las Palmeras · $508.00', ubicacion: 'Sucursal San Miguel', responsable: 'Ana Cruz', referencia: 'V-0839' },
];
