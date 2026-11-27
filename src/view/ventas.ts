/** Vista de clientes y ventas: registro comercial, índice por cliente y pila LIFO de cancelación. */

import type { EstadoUI } from '../controller/estado';
import { ventaRapida } from '../model/datos';
import type { Sistema } from '../model/sistema';
import { dinero, esc, partesDinero } from './formatos';

export function vistaVentas(sistema: Sistema, estado: EstadoUI): string {
  const todas = sistema.ventas.todasLasVentas();
  const baseVentas = estado.ventasClienteFiltro
    ? sistema.ventas.ventasCliente(estado.ventasClienteFiltro)
    : todas;
  const ventas = [...baseVentas].sort((a, b) => b.id.localeCompare(a.id));
  const activas = todas.filter((venta) => !venta.cancelada);
  const sucursales = new Set(activas.map((venta) => venta.sucursal)).size;
  const clientes = sistema.ventas.listarClientes();
  const [ventasEntero, ventasDecimal] = partesDinero(sistema.ventas.totalVendido());

  const filas = ventas.map((venta) => {
    const etiquetaEstado = venta.cancelada
      ? '<span class="status status-low">Cancelada</span>'
      : '<span class="status status-done">Activa</span>';
    return `<tr><td class="ref">${esc(venta.id)}</td><td><b>${esc(venta.cliente)}</b><small class="table-muted table-block">${esc(venta.tipoCliente)}</small></td><td>${esc(venta.sucursal)}</td><td>${numeroArticulos(venta.articulos)}</td><td><b>${dinero(venta.total)}</b></td><td>${esc(venta.hora)}</td><td>${etiquetaEstado}</td></tr>`;
  }).join('');

  const opcionesCliente = clientes.map((cliente) => `<option value="${cliente.id}">${esc(cliente.nombre)}</option>`).join('');
  const opcionesFiltroCliente = clientes
    .map((cliente) => `<option value="${cliente.id}"${estado.ventasClienteFiltro === cliente.id ? ' selected' : ''}>${esc(cliente.nombre)}</option>`)
    .join('');
  const opcionesProductoVenta = sistema.productos.listarProductos()
    .map((producto) => `<option value="${producto.sku}">${esc(producto.nombre)} · ${dinero(producto.precio)} (${sistema.stockProducto(producto.sku)} disp.)</option>`)
    .join('');

  const carrito = ventaRapida.map(({ sku, cantidad }) => ({
    producto: sistema.productos.consultarProducto(sku),
    cantidad,
  }));
  const lineas = carrito.map(({ producto, cantidad }) => `<div class="cart-line"><span>${esc(producto.nombre)} <small>${cantidad} ${esc(producto.unidad)} × ${dinero(producto.precio)}</small></span><strong>${dinero(producto.precio * cantidad)}</strong></div>`).join('');
  const totalCarrito = carrito.reduce((total, { producto, cantidad }) => total + producto.precio * cantidad, 0);

  return `<section class="page-title-row"><div><div class="eyebrow"><span class="eyebrow-line"></span> RELACIÓN COMERCIAL</div><h1 class="page-title">Cada compra cuenta<br /><em>una historia.</em></h1><p class="intro">Clientes, ventas y cancelación LIFO conectados en un mismo lugar.</p></div><div class="actions-row"><button type="button" class="button button-outline" data-action="cancelar-ultima-venta">↩ Cancelar última venta (LIFO)</button><a class="button button-dark" href="#/ventas/venta">＋ Registrar venta</a></div></section>
<div class="metric-grid compact-metrics"><article class="metric-card"><div class="metric-top"><span>VENTAS DE HOY</span><span class="metric-symbol green">↗</span></div><strong class="metric-value">${ventasEntero}<span>.${ventasDecimal}</span></strong><div class="metric-foot"><span class="trend">↑ ${sistema.indicadores().tendenciaDia}%</span><span>${activas.length} transacciones activas</span></div></article><article class="metric-card"><div class="metric-top"><span>TRANSACCIONES</span><span class="metric-symbol blue">▤</span></div><strong class="metric-value">${activas.length}</strong><div class="metric-foot"><span class="metric-note">En ${sucursales} sucursales</span></div></article><article class="metric-card"><div class="metric-top"><span>CLIENTES REGISTRADOS</span><span class="metric-symbol violet">◎</span></div><strong class="metric-value">${clientes.length}</strong><div class="metric-foot"><span class="metric-note">${clientes.filter((cliente) => cliente.tipo === 'frecuente').length} clientes frecuentes</span></div></article></div>
<div class="sales-layout"><section class="panel sales-list-panel"><div class="panel-heading"><div><div class="section-kicker">REGISTRO COMERCIAL</div><h2>Ventas recientes</h2></div><select class="select-pill" data-filter="ventasClienteFiltro"><option value="">Todos los clientes</option>${opcionesFiltroCliente}</select></div><div class="activity-table-wrap"><table><thead><tr><th>VENTA</th><th>CLIENTE</th><th>SUCURSAL</th><th>ARTÍCULOS</th><th>TOTAL</th><th>HORA</th><th>ESTADO</th></tr></thead><tbody>${filas || '<tr><td colspan="7">Este cliente no tiene ventas registradas.</td></tr>'}</tbody></table></div><div class="table-bottom"><span>Mostrando ${ventas.length} de ${todas.length} transacciones</span><a class="text-link" href="#/ventas/clientes">Registrar cliente <span>↗</span></a></div></section>
<aside class="panel quick-sale" id="venta"><div class="section-kicker">PUNTO DE VENTA</div><h2>Venta rápida</h2><p class="panel-description">Usa el combo por defecto o selecciona un producto puntual.</p><label>CLIENTE<select class="fake-select" name="clienteId">${opcionesCliente}</select></label><label>PRODUCTO<select class="fake-select" name="ventaSku"><option value="">Combo rápido (2 Mango + 3 Néctar · ${dinero(totalCarrito)})</option>${opcionesProductoVenta}</select></label><label>CANTIDAD (SI ELIGES PRODUCTO)<input class="fake-select" type="number" name="ventaCantidad" min="1" step="1" value="1" /></label>${lineas}<div class="cart-total"><span>Combo rápido</span><strong>${dinero(totalCarrito)}</strong></div><button type="button" class="button button-dark button-full" data-action="completar-venta">Completar venta <span>→</span></button><p class="form-note">La existencia se descuenta al registrar y se devuelve si cancelas la última venta.</p></aside></div>
<section class="panel" id="clientes"><div class="section-kicker">DIRECTORIO DE CLIENTES</div><h2>Registrar nuevo cliente</h2><div class="inline-form"><label>ID<input class="fake-select" name="nuevoClienteId" placeholder="CLI-06" /></label><label>NOMBRE<input class="fake-select" name="nuevoClienteNombre" placeholder="Cafetería El Mirador" /></label><label>TIPO<select class="fake-select" name="nuevoClienteTipo"><option value="frecuente">Cliente frecuente</option><option value="minorista">Cliente minorista</option></select></label><button type="button" class="button button-dark button-sm" data-action="registrar-cliente">＋ Guardar cliente</button></div></section>`;
}

function numeroArticulos(cantidad: number): string {
  return `${cantidad} producto${cantidad === 1 ? '' : 's'}`;
}
