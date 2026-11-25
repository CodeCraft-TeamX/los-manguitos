/** Vista de pedidos: bandeja generada desde la cola y los estados del modelo. */

import { EstadoPedido } from '../model/tipos';
import type { Sistema } from '../model/sistema';
import { dinero, esc, estadoPedido } from './formatos';

export function vistaPedidos(sistema: Sistema): string {
  const pedidos = sistema.pedidos.todosLosPedidos().sort((a, b) => b.id.localeCompare(a.id));
  const porConfirmar = pedidos.filter((pedido) => pedido.estado === EstadoPedido.Nuevo || pedido.estado === EstadoPedido.Confirmado).length;
  const enPreparacion = pedidos.filter((pedido) => pedido.estado === EstadoPedido.Preparando).length;
  const listos = pedidos.filter((pedido) => pedido.estado === EstadoPedido.Listo).length;

  const filas = pedidos.map((pedido) => {
    const estado = estadoPedido(pedido.estado);
    const puedeAvanzar = pedido.estado !== EstadoPedido.Despachado && pedido.estado !== EstadoPedido.Cancelado;
    const accion = puedeAvanzar
      ? `<button type="button" class="table-action" data-action="avanzar-pedido" data-id="${pedido.id}" title="Avanzar al siguiente estado">→</button>`
      : '—';
    return `<tr><td class="ref">${esc(pedido.id)}</td><td><b>${esc(pedido.cliente)}</b><small class="table-muted table-block">${esc(sistema.nombreUbicacion(pedido.destino))}</small></td><td>${esc(pedido.recibido)}</td><td>${esc(pedido.entrega)}</td><td><b>${dinero(pedido.total)}</b></td><td><span class="status ${estado.clase}">${estado.texto}</span></td><td>${accion}</td></tr>`;
  }).join('');

  const pasos = ['Recibir', 'Confirmar', 'Preparar', 'Despachar'];
  const detalles = ['Registrar solicitud', 'Validar existencias', 'Alistar productos', 'Asignar a una ruta'];
  const orden: EstadoPedido[] = [EstadoPedido.Nuevo, EstadoPedido.Confirmado, EstadoPedido.Preparando, EstadoPedido.Listo];
  const actual = pedidos[0] ? Math.max(0, orden.indexOf(pedidos[0].estado)) : 0;
  const flujo = pasos.map((paso, indice) => `${indice > 0 ? '<i></i>' : ''}<div class="process-step${indice === actual ? ' current' : ''}"><span>${String(indice + 1).padStart(2, '0')}</span><strong>${paso}</strong><small>${detalles[indice]}</small></div>`).join('');

  return `<section class="page-title-row"><div><div class="eyebrow"><span class="eyebrow-line"></span> CICLO DE ATENCIÓN</div><h1 class="page-title">De solicitud a entrega,<br /><em>sin perder el hilo.</em></h1><p class="intro">Organiza el trabajo pendiente y prepara cada despacho.</p></div><button type="button" class="button button-dark" data-action="nuevo-pedido">＋ Nuevo pedido</button></section><div class="metric-grid compact-metrics"><article class="metric-card"><div class="metric-top"><span>POR CONFIRMAR</span><span class="metric-symbol orange">◷</span></div><strong class="metric-value">${porConfirmar}</strong><div class="metric-foot"><span class="metric-note">Requieren revisión</span></div></article><article class="metric-card"><div class="metric-top"><span>EN PREPARACIÓN</span><span class="metric-symbol blue">▤</span></div><strong class="metric-value">${enPreparacion}</strong><div class="metric-foot"><span class="metric-note">Bodega central</span></div></article><article class="metric-card"><div class="metric-top"><span>LISTOS PARA SALIR</span><span class="metric-symbol green">✓</span></div><strong class="metric-value">${listos}</strong><div class="metric-foot"><span class="metric-note">Próxima ruta: ${sistema.logistica.listarRutas()[0]?.salida ?? 'sin definir'}</span></div></article></div><section class="panel orders-panel"><div class="panel-heading"><div><div class="section-kicker">BANDEJA DE PEDIDOS</div><h2>Atención en curso <span class="heading-count">${pedidos.length}</span></h2></div><a class="text-link" href="#/pedidos/historial">Historial de pedidos <span>↗</span></a></div><div class="filter-row"><span class="search-field">⌕ <span>Buscar pedido o cliente…</span></span><span class="select-pill">Todos los estados <span>⌄</span></span><span class="select-pill">Todas las ubicaciones <span>⌄</span></span></div><div class="activity-table-wrap"><table><thead><tr><th>PEDIDO</th><th>CLIENTE</th><th>RECIBIDO</th><th>ENTREGA</th><th>TOTAL</th><th>ESTADO</th><th></th></tr></thead><tbody>${filas}</tbody></table></div><div class="table-bottom"><span>Mostrando ${pedidos.length} pedidos activos</span><span class="pagination">‹ <b>1</b> 2 3 ›</span></div></section><section class="panel process-panel" id="nuevo-pedido"><div class="section-kicker">UN PEDIDO, CUATRO MOMENTOS</div><div class="process-flow">${flujo}</div></section>`;
}
