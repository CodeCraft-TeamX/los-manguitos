/** Vista de seguimiento: bitácora append-only del modelo, de la más reciente a la más antigua. */

import type { Sistema } from '../model/sistema';
import { esc, iconoEvento, numero } from './formatos';

export function vistaSeguimiento(sistema: Sistema): string {
  const eventos = [...sistema.seguimiento.todosLosEventos()].reverse();
  const resumen = sistema.seguimiento.resumenPorTipo();
  const movimientos = Object.values(resumen).reduce((total, cantidad) => total + cantidad, 0);

  const filas = eventos.map((evento) => {
    const icono = iconoEvento(evento.tipo);
    return `<tr><td>${esc(evento.hora)}</td><td><span class="operation-icon ${icono.clase}">${icono.glifo}</span> ${esc(icono.texto)}</td><td>${esc(evento.detalle)}</td><td>${esc(evento.ubicacion)}</td><td>${esc(evento.responsable)}</td><td class="ref">${esc(evento.referencia)}</td></tr>`;
  }).join('');

  return `<section class="page-title-row"><div><div class="eyebrow"><span class="eyebrow-line"></span> TRAZABILIDAD DE OPERACIONES</div><h1 class="page-title">Nada se pierde<br /><em>en el camino.</em></h1><p class="intro">Una bitácora clara de lo que sucede en cada punto del negocio.</p></div><a class="button button-outline" href="#/seguimiento/actividad" data-action="exportar-registro">↓ Exportar registro</a></section><div class="metric-grid compact-metrics"><article class="metric-card"><div class="metric-top"><span>MOVIMIENTOS DE HOY</span><span class="metric-symbol green">◷</span></div><strong class="metric-value">${numero(movimientos)}</strong><div class="metric-foot"><span class="metric-note">En todas las ubicaciones</span></div></article><article class="metric-card"><div class="metric-top"><span>VENTAS REGISTRADAS</span><span class="metric-symbol blue">↗</span></div><strong class="metric-value">${resumen.venta ?? 0}</strong><div class="metric-foot"><span class="metric-note">Hoy · ${new Set(sistema.ventas.todasLasVentas().map((venta) => venta.sucursal)).size} sucursales</span></div></article><article class="metric-card"><div class="metric-top"><span>DESPACHOS EN CURSO</span><span class="metric-symbol violet">⌁</span></div><strong class="metric-value">${resumen.despacho ?? 0}</strong><div class="metric-foot"><span class="metric-note">${resumen.transferencia ?? 0} transferencias</span></div></article></div><section class="panel timeline-panel"><div class="panel-heading"><div><div class="section-kicker">BITÁCORA UNIFICADA</div><h2>Actividad del negocio</h2></div><div class="filter-row compact-filter"><span class="select-pill">Todas las operaciones <span>⌄</span></span><span class="select-pill">Hoy, 24 nov <span>⌄</span></span></div></div><div class="activity-table-wrap"><table><thead><tr><th>HORA</th><th>TIPO DE OPERACIÓN</th><th>DETALLE</th><th>UBICACIÓN</th><th>REALIZADO POR</th><th>REFERENCIA</th></tr></thead><tbody>${filas}</tbody></table></div><div class="table-bottom"><span>Registro ordenado del más reciente al más antiguo</span><span class="pagination">${eventos.length} eventos</span></div></section><section class="network-strip"><div><span class="network-orb">◷</span><div><strong>Una operación fácil de reconstruir.</strong><small>Cada venta, ajuste, transferencia y despacho queda asociado a su referencia y responsable.</small></div></div><span class="record-tag">REGISTRO CONTINUO · HOY</span></section>`;
}
