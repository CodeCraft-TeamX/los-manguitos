/** Vista de logística: red, ruta calculada con Dijkstra y planificación desde el modelo. */

import { conexiones } from '../model/datos';
import { EstadoPedido } from '../model/tipos';
import type { Sistema } from '../model/sistema';
import { esc, estadoRuta, numero } from './formatos';

const CLASES_NODO: Record<string, string> = {
  CENTRAL: 'node-central',
  'SUC-CENTRO': 'node-centro',
  'SUC-SANTA-ANA': 'node-santa',
  'SUC-SAN-MIGUEL': 'node-miguel',
  'PUERTO-LA-LIBERTAD': 'node-libertad',
};

export function vistaDistribucion(sistema: Sistema): string {
  const rutas = sistema.logistica.listarRutas().sort((a, b) => b.id.localeCompare(a.id));
  const ubicaciones = sistema.ubicaciones.listarUbicaciones();
  const pedidos = sistema.pedidos.todosLosPedidos();
  const enCurso = pedidos.filter((pedido) => pedido.estado === EstadoPedido.Preparando || pedido.estado === EstadoPedido.Listo).length;
  const completadas = pedidos.filter((pedido) => pedido.estado === EstadoPedido.Despachado).length;
  const proxima = rutas[0];

  const lineas = conexiones.map((_, indice) => `<i class="line-${'abcde'[indice]}"></i>`).join('');
  const nodos = ubicaciones.map((ubicacion) => {
    const partes = ubicacion.direccion.split(' · ');
    const localidad = ubicacion.tipo === 'central' ? partes[1] : partes[0];
    return `<div class="map-node ${CLASES_NODO[ubicacion.id] ?? 'node-centro'}"><span>${ubicacion.tipo === 'central' ? '✳' : '⌖'}</span><strong>${esc(ubicacion.nombre)}</strong><small>${esc(localidad)}</small></div>`;
  }).join('');

  const camino = proxima
    ? sistema.logistica.rutaMasCorta('CENTRAL', proxima.destino).map((nodo) => sistema.nombreUbicacion(nodo)).join(' → ')
    : 'Sin rutas planificadas';
  const estadoProxima = proxima ? estadoRuta(proxima.estado) : { clase: 'status-done', texto: 'Sin ruta' };
  const pedidosProxima = proxima ? pedidos.filter((pedido) => pedido.destino === proxima.destino).length : 0;

  const filas = rutas.map((ruta) => {
    const estado = estadoRuta(ruta.estado);
    return `<tr><td class="ref">${esc(ruta.id)}</td><td>${esc(ruta.recorrido)}</td><td>${numero(ruta.paradas)} clientes</td><td>${esc(ruta.conductor)}</td><td>${esc(ruta.salida)}</td><td><span class="status ${estado.clase}">${estado.texto}</span></td></tr>`;
  }).join('');

  return `<section class="page-title-row"><div><div class="eyebrow"><span class="eyebrow-line"></span> RED DE DISTRIBUCIÓN</div><h1 class="page-title">Del origen a su destino,<br /><em>con buen rumbo.</em></h1><p class="intro">Planifica recorridos y mantén cada entrega en movimiento.</p></div><button type="button" class="button button-dark" data-action="planificar-ruta">＋ Planificar ruta</button></section><div class="metric-grid compact-metrics"><article class="metric-card"><div class="metric-top"><span>RUTAS ACTIVAS</span><span class="metric-symbol green">⌁</span></div><strong class="metric-value">${rutas.length}</strong><div class="metric-foot"><span class="metric-note">En ${new Set(ubicaciones.map((ubicacion) => ubicacion.direccion.split(' · ')[0])).size} departamentos</span></div></article><article class="metric-card"><div class="metric-top"><span>ENTREGAS EN CURSO</span><span class="metric-symbol blue">◷</span></div><strong class="metric-value">${enCurso}</strong><div class="metric-foot"><span class="metric-note">Pedidos en preparación o listos</span></div></article><article class="metric-card"><div class="metric-top"><span>ENTREGAS COMPLETADAS</span><span class="metric-symbol violet">✓</span></div><strong class="metric-value">${completadas}</strong><div class="metric-foot"><span class="trend">↑ ${completadas}</span><span>despachos finalizados</span></div></article></div><div class="distribution-layout"><section class="panel route-map-panel"><div class="panel-heading"><div><div class="section-kicker">VISTA DE LA RED</div><h2>Conexiones y destinos</h2></div><span class="select-pill">${rutas.length} rutas <span>⌄</span></span></div><div class="route-map" role="img" aria-label="Diagrama esquemático de rutas de distribución"><div class="map-lines">${lineas}</div>${nodos}<span class="map-key"><i></i> Ruta activa <i class="key-faint"></i> Conexión disponible</span></div></section><aside class="panel route-focus"><div class="section-kicker">PRÓXIMA SALIDA</div><div class="route-number">RUTA <strong>${proxima?.id.replace('R-', '') ?? '—'}</strong><span class="status ${estadoProxima.clase}">${estadoProxima.texto}</span></div><h2>Ruta ${proxima ? proxima.destino.split('-').slice(1).join(' ') : 'sin definir'}</h2><p class="panel-description">${proxima ? esc(proxima.recorrido) : 'Sin rutas'}<br />Ruta calculada: ${esc(camino)}</p><div class="route-facts"><div><span>Paradas</span><strong>${numero(proxima?.paradas ?? 0)} clientes</strong></div><div><span>Pedidos</span><strong>${pedidosProxima} pedidos</strong></div><div><span>Salida estimada</span><strong>${esc(proxima?.salida ?? '—')}</strong></div><div><span>Conductor</span><strong>${esc(proxima?.conductor ?? '—')}</strong></div></div><a class="button button-dark button-full" href="#/distribucion/rutas">Ver hoja de ruta <span>↗</span></a></aside></div><section class="panel routes-panel" id="rutas"><div class="panel-heading"><div><div class="section-kicker">DESPACHOS DEL DÍA</div><h2>Rutas planificadas</h2></div><a class="text-link" href="#/seguimiento">Seguimiento de entregas <span>↗</span></a></div><div class="activity-table-wrap"><table><thead><tr><th>RUTA</th><th>RECORRIDO</th><th>PARADAS</th><th>CONDUCTOR</th><th>SALIDA</th><th>ESTADO</th></tr></thead><tbody>${filas}</tbody></table></div></section>`;
}
