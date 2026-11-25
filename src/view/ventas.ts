/** Vista de clientes y ventas: registro comercial y venta rápida desde el modelo. */

import { ventaRapida } from '../model/datos';
import type { Sistema } from '../model/sistema';
import { dinero, esc, partesDinero } from './formatos';

export function vistaVentas(sistema: Sistema): string {
  const ventas = sistema.ventas.todasLasVentas().sort((a, b) => b.id.localeCompare(a.id));
  const activas = ventas.filter((venta) => !venta.cancelada);
  const sucursales = new Set(activas.map((venta) => venta.sucursal)).size;
  const clientes = sistema.ventas.listarClientes();
  const [ventasEntero, ventasDecimal] = partesDinero(sistema.ventas.totalVendido());

  const filas = ventas.map((venta) => `<tr><td class="ref">${esc(venta.id)}</td><td><b>${esc(venta.cliente)}</b><small class="table-muted table-block">${esc(venta.tipoCliente)}</small></td><td>${esc(venta.sucursal)}</td><td>${numeroArticulos(venta.articulos)}</td><td><b>${dinero(venta.total)}</b></td><td>${esc(venta.hora)}</td></tr>`).join('');

  const opcionesCliente = clientes.map((cliente) => `<option value="${cliente.id}">${esc(cliente.nombre)}</option>`).join('');
  const carrito = ventaRapida.map(({ sku, cantidad }) => ({
    producto: sistema.productos.consultarProducto(sku),
    cantidad,
  }));
  const lineas = carrito.map(({ producto, cantidad }) => `<div class="cart-line"><span>${esc(producto.nombre)} <small>${cantidad} ${esc(producto.unidad)} × ${dinero(producto.precio)}</small></span><strong>${dinero(producto.precio * cantidad)}</strong></div>`).join('');
  const totalCarrito = carrito.reduce((total, { producto, cantidad }) => total + producto.precio * cantidad, 0);

  return `<section class="page-title-row"><div><div class="eyebrow"><span class="eyebrow-line"></span> RELACIÓN COMERCIAL</div><h1 class="page-title">Cada compra cuenta<br /><em>una historia.</em></h1><p class="intro">Clientes, ventas y productos conectados en un mismo lugar.</p></div><a class="button button-dark" href="#/ventas/venta">＋ Registrar venta</a></section><div class="metric-grid compact-metrics"><article class="metric-card"><div class="metric-top"><span>VENTAS DE HOY</span><span class="metric-symbol green">↗</span></div><strong class="metric-value">${ventasEntero}<span>.${ventasDecimal}</span></strong><div class="metric-foot"><span class="trend">↑ ${sistema.indicadores().tendenciaDia}%</span><span>${activas.length} transacciones</span></div></article><article class="metric-card"><div class="metric-top"><span>TRANSACCIONES</span><span class="metric-symbol blue">▤</span></div><strong class="metric-value">${activas.length}</strong><div class="metric-foot"><span class="metric-note">En ${sucursales} sucursales</span></div></article><article class="metric-card"><div class="metric-top"><span>CLIENTES REGISTRADOS</span><span class="metric-symbol violet">◎</span></div><strong class="metric-value">${clientes.length}</strong><div class="metric-foot"><span class="metric-note">${clientes.filter((cliente) => cliente.tipo === 'frecuente').length} clientes frecuentes</span></div></article></div><div class="sales-layout"><section class="panel sales-list-panel"><div class="panel-heading"><div><div class="section-kicker">REGISTRO COMERCIAL</div><h2>Ventas recientes</h2></div><a class="text-link" href="#/ventas/historial">Ver historial <span>↗</span></a></div><div class="activity-table-wrap"><table><thead><tr><th>VENTA</th><th>CLIENTE</th><th>SUCURSAL</th><th>ARTÍCULOS</th><th>TOTAL</th><th>HORA</th></tr></thead><tbody>${filas}</tbody></table></div><div class="table-bottom"><span>Mostrando ${ventas.length} transacciones de hoy</span><span class="pagination">‹ <b>1</b> 2 3 … ›</span></div></section><aside class="panel quick-sale" id="venta"><div class="section-kicker">PUNTO DE VENTA</div><h2>Venta rápida</h2><p class="panel-description">Registra una transacción de mostrador.</p><label>CLIENTE<select class="fake-select" name="clienteId">${opcionesCliente}</select></label><label>PRODUCTOS<span class="fake-select">${carrito.length} productos seleccionados <b>⌄</b></span></label>${lineas}<div class="cart-total"><span>Total de venta</span><strong>${dinero(totalCarrito)}</strong></div><button type="button" class="button button-dark button-full" data-action="completar-venta">Completar venta <span>→</span></button><p class="form-note">La existencia se actualiza al registrar la venta.</p></aside></div><section class="network-strip"><div><span class="network-orb">◎</span><div><strong>Un cliente satisfecho vuelve.</strong><small>El historial de compras ayuda a brindar una atención cercana y consistente.</small></div></div><a class="text-link" href="#/ventas/clientes">Directorio de clientes ↗</a></section>`;
}

function numeroArticulos(cantidad: number): string {
  return `${cantidad} producto${cantidad === 1 ? '' : 's'}`;
}
