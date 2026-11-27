/** Vista de seguimiento: bitácora append-only, índice por tipo y árbol binario de búsqueda por rango. */

import type { EstadoUI } from '../controller/estado';
import type { Sistema } from '../model/sistema';
import { esc, iconoEvento, numero } from './formatos';

export function vistaSeguimiento(sistema: Sistema, estado: EstadoUI): string {
  const todos = sistema.seguimiento.todosLosEventos();
  const resumen = sistema.seguimiento.resumenPorTipo();
  const movimientos = Object.values(resumen).reduce((total, cantidad) => total + cantidad, 0);

  const desdeNum = estado.seguimientoDesde ? Number(estado.seguimientoDesde) : 1;
  const hastaNum = estado.seguimientoHasta ? Number(estado.seguimientoHasta) : Math.max(1, todos.length);
  const usandoRango = Boolean(estado.seguimientoDesde || estado.seguimientoHasta);

  let visibles = todos;
  let avisoRango = '';
  if (usandoRango) {
    if (Number.isInteger(desdeNum) && Number.isInteger(hastaNum) && desdeNum >= 1 && desdeNum <= hastaNum) {
      visibles = sistema.seguimiento.eventosEntre(desdeNum, hastaNum);
    } else {
      visibles = [];
      avisoRango = 'Rango inválido: "desde" debe ser >= 1 y <= "hasta".';
    }
  } else if (estado.seguimientoTipo) {
    visibles = sistema.seguimiento.eventosPorTipo(estado.seguimientoTipo);
  }

  if (usandoRango && estado.seguimientoTipo) {
    visibles = visibles.filter((ev) => ev.tipo === estado.seguimientoTipo);
  }

  const clavePorEvento = new Map<object, number>();
  todos.forEach((ev, idx) => clavePorEvento.set(ev, idx + 1));

  const eventosOrdenados = [...visibles].reverse();
  const filas = eventosOrdenados.map((evento) => {
    const icono = iconoEvento(evento.tipo);
    const correlativo = clavePorEvento.get(evento) ?? '—';
    return `<tr><td class="ref">#${correlativo}</td><td>${esc(evento.hora)}</td><td><span class="operation-icon ${icono.clase}">${icono.glifo}</span> ${esc(icono.texto)}</td><td>${esc(evento.detalle)}</td><td>${esc(evento.ubicacion)}</td><td>${esc(evento.responsable)}</td><td class="ref">${esc(evento.referencia)}</td></tr>`;
  }).join('');

  const tipos = Object.keys(resumen)
    .map((tipo) => `<option value="${esc(tipo)}"${estado.seguimientoTipo === tipo ? ' selected' : ''}>${esc(tipo)}</option>`)
    .join('');

  return `<section class="page-title-row"><div><div class="eyebrow"><span class="eyebrow-line"></span> TRAZABILIDAD DE OPERACIONES</div><h1 class="page-title">Nada se pierde<br /><em>en el camino.</em></h1><p class="intro">Bitácora inmutable con índice por tipo y consultas por rango en árbol binario de búsqueda.</p></div><a class="button button-outline" href="#/seguimiento/actividad" data-action="exportar-registro">↓ Exportar registro</a></section>
<div class="metric-grid compact-metrics"><article class="metric-card"><div class="metric-top"><span>MOVIMIENTOS DE HOY</span><span class="metric-symbol green">◷</span></div><strong class="metric-value">${numero(movimientos)}</strong><div class="metric-foot"><span class="metric-note">En todas las ubicaciones</span></div></article><article class="metric-card"><div class="metric-top"><span>VENTAS REGISTRADAS</span><span class="metric-symbol blue">↗</span></div><strong class="metric-value">${resumen.venta ?? 0}</strong><div class="metric-foot"><span class="metric-note">Hoy · ${new Set(sistema.ventas.todasLasVentas().map((venta) => venta.sucursal)).size} sucursales</span></div></article><article class="metric-card"><div class="metric-top"><span>DESPACHOS EN CURSO</span><span class="metric-symbol violet">⌁</span></div><strong class="metric-value">${resumen.despacho ?? 0}</strong><div class="metric-foot"><span class="metric-note">${resumen.transferencia ?? 0} transferencias</span></div></article></div>
<section class="panel timeline-panel"><div class="panel-heading"><div><div class="section-kicker">BITÁCORA UNIFICADA</div><h2>Actividad del negocio</h2></div><div class="filter-row compact-filter"><select class="select-pill" data-filter="seguimientoTipo"><option value="">Todas las operaciones</option>${tipos}</select><input class="select-pill" style="width:95px" type="number" min="1" placeholder="Desde #" value="${esc(estado.seguimientoDesde)}" data-filter="seguimientoDesde" /><input class="select-pill" style="width:95px" type="number" min="1" placeholder="Hasta #" value="${esc(estado.seguimientoHasta)}" data-filter="seguimientoHasta" /></div></div>
<div class="activity-table-wrap"><table><thead><tr><th>#</th><th>HORA</th><th>TIPO DE OPERACIÓN</th><th>DETALLE</th><th>UBICACIÓN</th><th>REALIZADO POR</th><th>REFERENCIA</th></tr></thead><tbody>${filas || `<tr><td colspan="7">${esc(avisoRango || 'Sin eventos para el filtro actual.')}</td></tr>`}</tbody></table></div>
<div class="table-bottom"><span>${usandoRango ? 'Consulta por rango mediante recorrido in-order en ABB' : 'Registro ordenado del más reciente al más antiguo'}</span><span class="pagination">${eventosOrdenados.length} de ${todos.length} eventos</span></div></section>
<section class="network-strip"><div><span class="network-orb">◷</span><div><strong>Una operación fácil de reconstruir.</strong><small>Cada venta, ajuste, transferencia y despacho queda asociado a su correlativo, referencia y responsable.</small></div></div><span class="record-tag">REGISTRO CONTINUO · HOY, 26 NOV</span></section>`;
}
