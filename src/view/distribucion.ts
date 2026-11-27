/** Vista de logística: grafo, Dijkstra, rutas alternativas con DFS recursivo y planificación. */

import type { EstadoUI } from '../controller/estado';
import { conexiones } from '../model/datos';
import type { Sistema } from '../model/sistema';
import { EstadoPedido } from '../model/tipos';
import { esc, estadoRuta, numero } from './formatos';

const CLASES_NODO: Record<string, string> = {
  CENTRAL: 'node-central',
  'SUC-CENTRO': 'node-centro',
  'SUC-SANTA-ANA': 'node-santa',
  'SUC-SAN-MIGUEL': 'node-miguel',
  'PUERTO-LA-LIBERTAD': 'node-libertad',
};

export function vistaDistribucion(sistema: Sistema, estado: EstadoUI): string {
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

  const mismoNodo = estado.rutaOrigen === estado.rutaDestino;
  const caminoOptimo = mismoNodo
    ? [estado.rutaOrigen]
    : sistema.logistica.rutaMasCorta(estado.rutaOrigen, estado.rutaDestino);
  const distanciaOptima = mismoNodo ? 0 : sistema.logistica.distanciaRuta(caminoOptimo);
  const textoCamino = caminoOptimo.map((nodo) => sistema.nombreUbicacion(nodo)).join(' → ');
  const alternativas = mismoNodo
    ? []
    : sistema.logistica.rutasPosibles(estado.rutaOrigen, estado.rutaDestino);
  const listaAlternativas = alternativas
    .map((camino) => {
      const km = sistema.logistica.distanciaRuta(camino);
      const etiqueta = camino.map((n) => sistema.nombreUbicacion(n)).join(' → ');
      return `<li>${esc(etiqueta)} <b>(${km} km)</b></li>`;
    })
    .join('');

  const estadoProxima = proxima ? estadoRuta(proxima.estado) : { clase: 'status-done', texto: 'Sin ruta' };
  const pedidosProxima = pedidos.filter((pedido) => pedido.destino === estado.rutaDestino).length;

  const opcionesOrigen = ubicaciones
    .map((ubi) => `<option value="${ubi.id}"${estado.rutaOrigen === ubi.id ? ' selected' : ''}>${esc(ubi.nombre)}</option>`)
    .join('');
  const opcionesDestino = ubicaciones
    .map((ubi) => `<option value="${ubi.id}"${estado.rutaDestino === ubi.id ? ' selected' : ''}>${esc(ubi.nombre)}</option>`)
    .join('');

  const filas = rutas.map((ruta) => {
    const est = estadoRuta(ruta.estado);
    return `<tr><td class="ref">${esc(ruta.id)}</td><td>${esc(ruta.recorrido)}</td><td>${numero(ruta.paradas)} nodos</td><td>${esc(ruta.conductor)}</td><td>${esc(ruta.salida)}</td><td><span class="status ${est.clase}">${est.texto}</span></td></tr>`;
  }).join('');

  return `<section class="page-title-row"><div><div class="eyebrow"><span class="eyebrow-line"></span> RED DE DISTRIBUCIÓN</div><h1 class="page-title">Del origen a su destino,<br /><em>con buen rumbo.</em></h1><p class="intro">Calcula la ruta más corta con Dijkstra y explora alternativas con DFS recursivo.</p></div><button type="button" class="button button-dark" data-action="planificar-ruta">＋ Planificar ruta</button></section>
<div class="metric-grid compact-metrics"><article class="metric-card"><div class="metric-top"><span>RUTAS ACTIVAS</span><span class="metric-symbol green">⌁</span></div><strong class="metric-value">${rutas.length}</strong><div class="metric-foot"><span class="metric-note">En ${new Set(ubicaciones.map((ubicacion) => ubicacion.direccion.split(' · ')[0])).size} departamentos</span></div></article><article class="metric-card"><div class="metric-top"><span>ENTREGAS EN CURSO</span><span class="metric-symbol blue">◷</span></div><strong class="metric-value">${enCurso}</strong><div class="metric-foot"><span class="metric-note">Pedidos en preparación o listos</span></div></article><article class="metric-card"><div class="metric-top"><span>ENTREGAS COMPLETADAS</span><span class="metric-symbol violet">✓</span></div><strong class="metric-value">${completadas}</strong><div class="metric-foot"><span class="trend">↑ ${completadas}</span><span>despachos finalizados</span></div></article></div>
<div class="distribution-layout"><section class="panel route-map-panel"><div class="panel-heading"><div><div class="section-kicker">VISTA DE LA RED</div><h2>Conexiones y destinos</h2></div><span class="select-pill">${rutas.length} rutas</span></div><div class="route-map" role="img" aria-label="Diagrama esquemático de rutas de distribución"><div class="map-lines">${lineas}</div>${nodos}<span class="map-key"><i></i> Ruta activa <i class="key-faint"></i> Conexión disponible</span></div></section>
<aside class="panel route-focus"><div class="section-kicker">SIMULADOR DIJKSTRA Y DFS</div><div class="route-number">RUTA <strong>${proxima?.id.replace('R-', '') ?? '—'}</strong><span class="status ${estadoProxima.clase}">${estadoProxima.texto}</span></div><div class="inline-form"><label>ORIGEN<select class="fake-select" data-filter="rutaOrigen">${opcionesOrigen}</select></label><label>DESTINO<select class="fake-select" data-filter="rutaDestino">${opcionesDestino}</select></label></div><p class="panel-description"><strong>Óptima (${distanciaOptima} km):</strong> ${esc(textoCamino)}</p><div class="route-facts"><div><span>Paradas</span><strong>${caminoOptimo.length} nodos</strong></div><div><span>Pedidos al destino</span><strong>${pedidosProxima} pedidos</strong></div><div><span>Rutas posibles (DFS)</span><strong>${alternativas.length}</strong></div></div><ul class="alt-routes">${listaAlternativas || '<li>Selecciona un origen y destino distintos.</li>'}</ul><button type="button" class="button button-dark button-full" data-action="planificar-ruta">＋ Registrar ruta óptima <span>→</span></button></aside></div>
<section class="panel routes-panel" id="rutas"><div class="panel-heading"><div><div class="section-kicker">DESPACHOS DEL DÍA</div><h2>Rutas planificadas</h2></div><a class="text-link" href="#/seguimiento">Seguimiento de entregas <span>↗</span></a></div><div class="activity-table-wrap"><table><thead><tr><th>RUTA</th><th>RECORRIDO</th><th>PARADAS</th><th>CONDUCTOR</th><th>SALIDA</th><th>ESTADO</th></tr></thead><tbody>${filas}</tbody></table></div></section>`;
}
