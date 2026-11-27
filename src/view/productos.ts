/** Vista de productos e inventario: catálogo vivo, árbol de categorías, movimientos y proveedores. */

import type { EstadoUI } from '../controller/estado';
import type { Sistema } from '../model/sistema';
import { esc, estadoStock, numero, partesDinero } from './formatos';

export function vistaProductos(sistema: Sistema, estado: EstadoUI): string {
  const todos = sistema.productos.listarProductos();
  const categorias = sistema.productos.listarCategorias();
  const proveedores = sistema.productos.listarProveedores();
  const ubicaciones = sistema.ubicaciones.listarUbicaciones();

  const bajos = todos.filter((producto) => sistema.stockProducto(producto.sku) < producto.minimo);
  const valor = todos.reduce(
    (total, producto) => total + sistema.stockProducto(producto.sku) * producto.precio,
    0,
  );
  const [valorEntero, valorDecimal] = partesDinero(valor);

  const baseCategoria = estado.productosCategoria
    ? sistema.productos.listarCategoria(estado.productosCategoria)
    : todos;
  const termino = estado.productosBusqueda.trim().toLowerCase();
  const filtrados = baseCategoria.filter((producto) => {
    const existencias = sistema.stockProducto(producto.sku);
    const coincideTexto = !termino
      || producto.nombre.toLowerCase().includes(termino)
      || producto.sku.toLowerCase().includes(termino);
    const coincideEstado = !estado.productosEstado
      || (estado.productosEstado === 'bajo' ? existencias < producto.minimo : existencias >= producto.minimo);
    return coincideTexto && coincideEstado;
  });

  const filas = filtrados.map((producto) => {
    const existencias = sistema.stockProducto(producto.sku);
    const est = estadoStock({ ...producto, existencias });
    return `<tr><td><span class="product-thumb ${producto.thumb}">${producto.inicial}</span> ${esc(producto.nombre)}</td><td class="ref">${esc(producto.sku)}</td><td>${esc(producto.categoria)}</td><td>${esc(sistema.nombreUbicacion(producto.ubicacion))}</td><td><b>${numero(existencias)} ${esc(producto.unidad)}</b> <small class="table-muted">/ mín. ${numero(producto.minimo)}</small></td><td><span class="status ${est.clase}">${est.texto}</span></td></tr>`;
  }).join('');

  const movimientos = todos.flatMap((producto) => sistema.productos.movimientos(producto.sku));
  const ultimo = movimientos[movimientos.length - 1];
  const productoMovimiento = todos.find((producto) => producto.sku === ultimo?.sku);
  const detalleMovimiento = ultimo && productoMovimiento
    ? `<p><span class="operation-icon transfer">⇄</span> ${esc(ultimo.tipo === 'entrada' ? 'Entrada' : 'Salida')} de <strong>${numero(ultimo.cantidad)} ${esc(productoMovimiento.unidad)} ${esc(productoMovimiento.nombre)}</strong> · Detalle: ${esc(ultimo.descripcion)} · ${esc(ultimo.hora)}</p>`
    : '<p>Sin movimientos registrados.</p>';

  const opcionesCat = categorias
    .map((cat) => `<option value="${esc(cat)}"${estado.productosCategoria === cat ? ' selected' : ''}>${esc(cat)}</option>`)
    .join('');
  const opcionesCatForm = categorias
    .map((cat) => `<option value="${esc(cat)}">${esc(cat)}</option>`)
    .join('');
  const opcionesProv = proveedores
    .map((prov) => `<option value="${esc(prov.id)}">${esc(prov.nombre)} (${esc(prov.id)})</option>`)
    .join('');
  const opcionesUbi = ubicaciones
    .map((ubi) => `<option value="${esc(ubi.id)}">${esc(ubi.nombre)}</option>`)
    .join('');
  const opcionesProd = todos
    .map((prod) => `<option value="${esc(prod.sku)}">${esc(prod.nombre)} · ${esc(prod.sku)}</option>`)
    .join('');

  const filasProveedores = proveedores
    .map((prov) => `<tr><td class="ref">${esc(prov.id)}</td><td><b>${esc(prov.nombre)}</b></td><td>${esc(prov.contacto || '—')}</td></tr>`)
    .join('');

  return `<section class="page-title-row"><div><div class="eyebrow"><span class="eyebrow-line"></span> CATÁLOGO Y EXISTENCIAS</div><h1 class="page-title">Productos e <em>inventario.</em></h1><p class="intro">Cada producto, cada proveedor y cada movimiento bajo control.</p></div><a class="button button-dark" href="#/productos/registro">＋ Registrar producto</a></section>
<div class="metric-grid compact-metrics"><article class="metric-card"><div class="metric-top"><span>PRODUCTOS ACTIVOS</span><span class="metric-symbol green">▦</span></div><strong class="metric-value">${todos.length}</strong><div class="metric-foot"><span class="metric-note">En ${categorias.length} categorías · ${proveedores.length} proveedores</span></div></article><article class="metric-card"><div class="metric-top"><span>VALOR EN EXISTENCIAS</span><span class="metric-symbol orange">$</span></div><strong class="metric-value">${valorEntero}<span>.${valorDecimal}</span></strong><div class="metric-foot"><span class="metric-note">En todas las ubicaciones</span></div></article><article class="metric-card"><div class="metric-top"><span>REQUIEREN REPOSICIÓN</span><span class="metric-symbol violet">!</span></div><strong class="metric-value">${bajos.length}</strong><div class="metric-foot"><span class="metric-note">${bajos.filter((producto) => sistema.stockProducto(producto.sku) < producto.minimo / 2).length} con prioridad alta</span></div></article></div>
<section class="panel inventory-panel"><div class="panel-heading"><div><div class="section-kicker">CONTROL DE EXISTENCIAS</div><h2>Inventario de productos</h2></div><a class="text-link" href="#/productos/proveedores">Ver proveedores <span>↗</span></a></div>
<div class="filter-row"><label class="search-field">⌕ <input class="search-input" type="search" placeholder="Buscar por producto o código…" value="${esc(estado.productosBusqueda)}" data-filter="productosBusqueda" /></label><select class="select-pill" data-filter="productosCategoria"><option value="">Todas las categorías (árbol)</option>${opcionesCat}</select><select class="select-pill" data-filter="productosEstado"><option value=""${estado.productosEstado === '' ? ' selected' : ''}>Todos los estados</option><option value="disponible"${estado.productosEstado === 'disponible' ? ' selected' : ''}>Disponible</option><option value="bajo"${estado.productosEstado === 'bajo' ? ' selected' : ''}>Stock bajo</option></select><a class="text-link" href="#/productos/movimientos">Entradas y salidas <span>↗</span></a></div>
<div class="activity-table-wrap"><table><thead><tr><th>PRODUCTO</th><th>CÓDIGO</th><th>CATEGORÍA</th><th>UBICACIÓN</th><th>EXISTENCIAS</th><th>ESTADO</th></tr></thead><tbody>${filas || '<tr><td colspan="6">Sin productos que coincidan con el filtro.</td></tr>'}</tbody></table></div>
<div class="table-bottom"><span>Mostrando ${filtrados.length} de ${todos.length} productos</span><span class="pagination">Árbol de categorías y Map por SKU</span></div></section>
<div class="two-col-panels">
<section class="panel" id="registro"><div class="section-kicker">ALTA EN CATÁLOGO</div><h2>Registrar nuevo producto</h2><div class="form-grid"><label>SKU<input class="fake-select" name="prodSku" placeholder="PR-040" /></label><label>NOMBRE<input class="fake-select" name="prodNombre" placeholder="Mango Panadés" /></label><label>CATEGORÍA<select class="fake-select" name="prodCategoria">${opcionesCatForm}</select></label><label>PROVEEDOR<select class="fake-select" name="prodProveedor">${opcionesProv}</select></label><label>UBICACIÓN INICIAL<select class="fake-select" name="prodUbicacion">${opcionesUbi}</select></label><label>UNIDAD<select class="fake-select" name="prodUnidad"><option value="kg">kg</option><option value="cajas">cajas</option><option value="uds.">uds.</option></select></label><label>STOCK INICIAL<input class="fake-select" type="number" name="prodStock" min="0" step="1" value="15" /></label><label>STOCK MÍNIMO<input class="fake-select" type="number" name="prodMinimo" min="0" step="1" value="10" /></label><label>PRECIO ($)<input class="fake-select" type="number" name="prodPrecio" min="0.1" step="0.1" value="2.50" /></label></div><button type="button" class="button button-dark button-full" data-action="registrar-producto">＋ Guardar producto en catálogo <span>→</span></button></section>
<section class="panel movement-strip" id="movimientos"><div class="section-kicker">ENTRADAS Y SALIDAS</div><h2>Registrar movimiento de inventario</h2>${detalleMovimiento}<div class="inline-form"><label>PRODUCTO<select class="fake-select" name="movSku">${opcionesProd}</select></label><label>TIPO<select class="fake-select" name="movTipo"><option value="entrada">Entrada (+)</option><option value="salida">Salida (−)</option></select></label><label>UBICACIÓN<select class="fake-select" name="movUbicacion">${opcionesUbi}</select></label><label>CANTIDAD<input class="fake-select" type="number" name="movCantidad" min="1" step="1" value="5" /></label><label>DESCRIPCIÓN<input class="fake-select" name="movDescripcion" placeholder="Compra a proveedor" /></label></div><button type="button" class="button button-dark button-full" data-action="registrar-movimiento">⇄ Aplicar movimiento <span>→</span></button></section>
</div>
<section class="panel movement-strip" id="proveedores"><div class="panel-heading"><div><div class="section-kicker">MÓDULO DE PROVEEDORES</div><h2>Proveedores registrados</h2></div></div><div class="two-col-panels"><div class="activity-table-wrap"><table><thead><tr><th>ID</th><th>PROVEEDOR</th><th>CONTACTO</th></tr></thead><tbody>${filasProveedores}</tbody></table></div><div class="inline-form"><label>ID<input class="fake-select" name="provId" placeholder="PROV-03" /></label><label>NOMBRE<input class="fake-select" name="provNombre" placeholder="Cooperativa San Juan" /></label><label>TELÉFONO<input class="fake-select" type="tel" name="provContacto" inputmode="numeric" maxlength="9" placeholder="7890-5566" /></label><button type="button" class="button button-dark button-sm" data-action="registrar-proveedor">＋ Registrar proveedor</button></div></div></section>`;
}
