/** Vista de productos e inventario: tabla y métricas generadas desde el modelo. */

import type { Sistema } from '../model/sistema';
import { esc, estadoStock, numero, partesDinero } from './formatos';

export function vistaProductos(sistema: Sistema): string {
  const productos = sistema.productos.listarProductos();
  const categorias = sistema.productos.listarCategorias();
  const bajos = productos.filter((producto) => producto.existencias < producto.minimo);
  const valor = productos.reduce(
    (total, producto) => total + sistema.ubicaciones.stockTotal(producto.sku) * producto.precio,
    0,
  );
  const [valorEntero, valorDecimal] = partesDinero(valor);

  const filas = productos.map((producto) => {
    const estado = estadoStock(producto);
    return `<tr><td><span class="product-thumb ${producto.thumb}">${producto.inicial}</span> ${esc(producto.nombre)}</td><td class="ref">${esc(producto.sku)}</td><td>${esc(producto.categoria)}</td><td>${esc(sistema.nombreUbicacion(producto.ubicacion))}</td><td><b>${numero(producto.existencias)} ${esc(producto.unidad)}</b> <small class="table-muted">/ mín. ${numero(producto.minimo)}</small></td><td><span class="status ${estado.clase}">${estado.texto}</span></td></tr>`;
  }).join('');

  const movimientos = productos.flatMap((producto) => sistema.productos.movimientos(producto.sku));
  const ultimo = movimientos[movimientos.length - 1];
  const productoMovimiento = productos.find((producto) => producto.sku === ultimo?.sku);
  const detalleMovimiento = ultimo && productoMovimiento
    ? `<p><span class="operation-icon transfer">⇄</span> ${esc(ultimo.tipo === 'entrada' ? 'Entrada' : 'Salida')} de <strong>${numero(ultimo.cantidad)} ${esc(productoMovimiento.unidad)} ${esc(productoMovimiento.nombre)}</strong> · Proveedor: ${esc(ultimo.descripcion)} · Hoy, ${esc(ultimo.hora)}</p>`
    : '<p>Sin movimientos registrados.</p>';

  return `<section class="page-title-row"><div><div class="eyebrow"><span class="eyebrow-line"></span> CATÁLOGO Y EXISTENCIAS</div><h1 class="page-title">Productos e <em>inventario.</em></h1><p class="intro">Cada producto, cada lote y cada movimiento bajo control.</p></div><a class="button button-dark" href="#/productos/registro">＋ Registrar producto</a></section><div class="metric-grid compact-metrics"><article class="metric-card"><div class="metric-top"><span>PRODUCTOS ACTIVOS</span><span class="metric-symbol green">▦</span></div><strong class="metric-value">${productos.length}</strong><div class="metric-foot"><span class="metric-note">En ${categorias.length} categorías</span></div></article><article class="metric-card"><div class="metric-top"><span>VALOR EN EXISTENCIAS</span><span class="metric-symbol orange">$</span></div><strong class="metric-value">${valorEntero}<span>.${valorDecimal}</span></strong><div class="metric-foot"><span class="metric-note">En todas las ubicaciones</span></div></article><article class="metric-card"><div class="metric-top"><span>REQUIEREN REPOSICIÓN</span><span class="metric-symbol violet">!</span></div><strong class="metric-value">${bajos.length}</strong><div class="metric-foot"><span class="metric-note">${bajos.filter((producto) => producto.existencias < producto.minimo / 2).length} con prioridad alta</span></div></article></div><section class="panel inventory-panel"><div class="panel-heading"><div><div class="section-kicker">CONTROL DE EXISTENCIAS</div><h2>Inventario de productos</h2></div><span class="select-pill">Todas las ubicaciones <span>⌄</span></span></div><div class="filter-row"><span class="search-field">⌕ <span>Buscar por producto o código…</span></span><span class="select-pill">Categoría <span>⌄</span></span><span class="select-pill">Estado de stock <span>⌄</span></span><a class="text-link" href="#/productos/movimientos">Ver movimientos <span>↗</span></a></div><div class="activity-table-wrap"><table><thead><tr><th>PRODUCTO</th><th>CÓDIGO</th><th>CATEGORÍA</th><th>UBICACIÓN</th><th>EXISTENCIAS</th><th>ESTADO</th></tr></thead><tbody>${filas}</tbody></table></div><div class="table-bottom"><span>Mostrando ${productos.length} de ${productos.length} productos</span><span class="pagination">‹ <b>1</b> 2 3 … 26 ›</span></div></section><section class="panel movement-strip" id="movimientos"><div class="section-kicker">TRAZABILIDAD</div><h2>Último movimiento registrado</h2>${detalleMovimiento}</section>`;
}
