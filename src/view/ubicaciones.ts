/** Vista de bodegas y sucursales: ubicaciones y cola FIFO de transferencias. */

import type { Sistema } from '../model/sistema';
import { esc, numero, partesDinero } from './formatos';

export function vistaUbicaciones(sistema: Sistema): string {
  const ubicaciones = sistema.ubicaciones.listarUbicaciones();
  const transferencias = sistema.ubicaciones.transferenciasPendientes();
  const centrales = ubicaciones.filter((ubicacion) => ubicacion.tipo === 'central').length;
  const enTransito = transferencias.filter((transferencia) => transferencia.estado === 'En tránsito').length;
  const preparadas = transferencias.filter((transferencia) => transferencia.estado === 'Preparada').length;
  const valor = transferencias.reduce((total, transferencia) => {
    const producto = sistema.productos.consultarProducto(transferencia.sku);
    return total + transferencia.cantidad * producto.precio;
  }, 0);
  const [valorEntero, valorDecimal] = partesDinero(valor);

  const tarjetas = ubicaciones.map((ubicacion) => `<article class="location-card"><span class="location-pin ${ubicacion.tipo === 'central' ? 'central-pin' : 'store-pin'}">${ubicacion.tipo === 'central' ? '✳' : '⌖'}</span><div class="location-info"><div><h3>${esc(ubicacion.nombre)}</h3><span class="location-type">${ubicacion.tipo === 'central' ? 'CENTRO DE DISTRIBUCIÓN' : 'SUCURSAL'}</span></div><p>${esc(ubicacion.direccion)}</p><div class="location-meta"><span>${numero(ubicacion.productos)} productos</span><span>Actualizado ${esc(ubicacion.actualizado)}</span></div></div><div class="location-stat"><strong>${numero(ubicacion.unidades)}</strong><small>unidades totales</small><span class="status status-done">${esc(ubicacion.estado)}</span></div></article>`).join('');

  const opcionesOrigen = ubicaciones.map((ubicacion) => `<option value="${ubicacion.id}">${esc(ubicacion.nombre)}</option>`).join('');
  const opcionesDestino = ubicaciones
    .filter((ubicacion) => ubicacion.tipo === 'sucursal')
    .map((ubicacion) => `<option value="${ubicacion.id}">${esc(ubicacion.nombre)}</option>`).join('');
  const opcionesProducto = sistema.productos.listarProductos()
    .map((producto) => `<option value="${producto.sku}">${esc(producto.nombre)} · ${producto.sku}</option>`).join('');

  const filasCola = transferencias.map((tr) => `<tr><td class="ref">${esc(tr.id)}</td><td>${esc(sistema.nombreUbicacion(tr.origen))} → ${esc(sistema.nombreUbicacion(tr.destino))}</td><td>${esc(sistema.productos.consultarProducto(tr.sku).nombre)} (${esc(tr.sku)})</td><td><b>${numero(tr.cantidad)}</b></td><td><span class="status status-route">${esc(tr.estado)}</span></td></tr>`).join('');

  return `<section class="page-title-row"><div><div class="eyebrow"><span class="eyebrow-line"></span> RED DE UBICACIONES</div><h1 class="page-title">Cada lugar, <em>conectado.</em></h1><p class="intro">Existencias y transferencias visibles en toda la operación.</p></div><div class="actions-row"><button type="button" class="button button-outline" data-action="procesar-transferencia">▶ Procesar siguiente (FIFO)</button><a class="button button-dark" href="#/ubicaciones/transferencia">⇄ Nueva transferencia</a></div></section>
<div class="metric-grid compact-metrics"><article class="metric-card"><div class="metric-top"><span>UBICACIONES ACTIVAS</span><span class="metric-symbol green">⌖</span></div><strong class="metric-value">${ubicaciones.length}</strong><div class="metric-foot"><span class="metric-note">${centrales} central · ${ubicaciones.length - centrales} sucursales</span></div></article><article class="metric-card"><div class="metric-top"><span>TRANSFERENCIAS EN COLA</span><span class="metric-symbol blue">⇄</span></div><strong class="metric-value">${transferencias.length}</strong><div class="metric-foot"><span class="metric-note">${enTransito} en tránsito · ${preparadas} preparada${preparadas === 1 ? '' : 's'}</span></div></article><article class="metric-card"><div class="metric-top"><span>VALOR EN COLA</span><span class="metric-symbol violet">$</span></div><strong class="metric-value">${valorEntero}<span>.${valorDecimal}</span></strong><div class="metric-foot"><span class="metric-note">Orden FIFO de despacho</span></div></article></div>
<div class="location-layout"><section class="panel locations-panel"><div class="panel-heading"><div><div class="section-kicker">PUNTOS DE OPERACIÓN</div><h2>Bodegas y sucursales</h2></div><a class="text-link" href="#/distribucion">Vista de red <span>↗</span></a></div><div class="location-list">${tarjetas}</div></section><aside class="panel transfer-panel" id="transferencia"><div class="section-kicker">MOVIMIENTO ENTRE PUNTOS</div><h2>Nueva transferencia</h2><p class="panel-description">Solicita existencias entre ubicaciones.</p><label>ORIGEN<select class="fake-select" name="origen">${opcionesOrigen}</select></label><label>DESTINO<select class="fake-select" name="destino">${opcionesDestino}</select></label><label>PRODUCTO<select class="fake-select" name="sku">${opcionesProducto}</select></label><label>CANTIDAD<input class="fake-select" type="number" name="cantidad" min="1" step="1" value="1" /></label><button type="button" class="button button-dark button-full" data-action="preparar-transferencia">Preparar transferencia <span>→</span></button><p class="form-note">Se validará la existencia disponible al confirmar.</p></aside></div>
<section class="panel" id="cola-transferencias"><div class="panel-heading"><div><div class="section-kicker">COLA FIFO DE TRANSFERENCIAS</div><h2>Solicitudes pendientes</h2></div><button type="button" class="button button-dark button-sm" data-action="procesar-transferencia">▶ Atender primera en cola</button></div><div class="activity-table-wrap"><table><thead><tr><th>TRANSFERENCIA</th><th>RUTA</th><th>PRODUCTO</th><th>CANTIDAD</th><th>ESTADO</th></tr></thead><tbody>${filasCola || '<tr><td colspan="5">No hay transferencias pendientes en la cola.</td></tr>'}</tbody></table></div></section>`;
}
