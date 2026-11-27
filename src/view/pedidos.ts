/** Vista de pedidos: bandeja generada desde la cola FIFO, filtros y pila de estados. */

import type { EstadoUI } from '../controller/estado';
import type { Sistema } from '../model/sistema';
import { EstadoPedido } from '../model/tipos';
import { dinero, esc, estadoPedido } from './formatos';

export function vistaPedidos(sistema: Sistema, estado: EstadoUI): string {
  const todos = sistema.pedidos.todosLosPedidos();
  const termino = estado.pedidosBusqueda.trim().toLowerCase();
  const filtrados = todos
    .filter((pedido) => {
      const coincideTexto = !termino
        || pedido.id.toLowerCase().includes(termino)
        || pedido.cliente.toLowerCase().includes(termino);
      const coincideEstado = !estado.pedidosEstado || pedido.estado === estado.pedidosEstado;
      const coincideUbi = !estado.pedidosUbicacion || pedido.destino === estado.pedidosUbicacion;
      return coincideTexto && coincideEstado && coincideUbi;
    })
    .sort((a, b) => b.id.localeCompare(a.id));

  const pendientesCola = sistema.pedidos.pedidosPendientes();
  const siguienteFifo = pendientesCola[0];
  const porConfirmar = todos.filter((pedido) => pedido.estado === EstadoPedido.Nuevo || pedido.estado === EstadoPedido.Confirmado).length;
  const enPreparacion = todos.filter((pedido) => pedido.estado === EstadoPedido.Preparando).length;
  const listos = todos.filter((pedido) => pedido.estado === EstadoPedido.Listo).length;

  const filas = filtrados.map((pedido) => {
    const est = estadoPedido(pedido.estado);
    const puedeAvanzar = pedido.estado !== EstadoPedido.Despachado && pedido.estado !== EstadoPedido.Cancelado;
    const esPrimeroCola = siguienteFifo?.id === pedido.id;
    const marcaFifo = esPrimeroCola ? ' <span class="status status-new">Siguiente FIFO</span>' : '';
    const btnAvanzar = puedeAvanzar
      ? `<button type="button" class="table-action" data-action="avanzar-pedido" data-id="${pedido.id}" title="Avanzar al siguiente estado">→</button>`
      : '';
    const btnDeshacer = `<button type="button" class="table-action" data-action="deshacer-pedido" data-id="${pedido.id}" title="Deshacer último cambio (Pila)">↩</button>`;
    const btnCancelar = puedeAvanzar
      ? `<button type="button" class="table-action" data-action="cancelar-pedido" data-id="${pedido.id}" title="Cancelar pedido">✕</button>`
      : '';
    return `<tr><td class="ref">${esc(pedido.id)}</td><td><b>${esc(pedido.cliente)}</b><small class="table-muted table-block">${esc(sistema.nombreUbicacion(pedido.destino))}</small></td><td>${esc(pedido.recibido)}</td><td>${esc(pedido.entrega)}</td><td><b>${dinero(pedido.total)}</b></td><td><span class="status ${est.clase}">${est.texto}</span>${marcaFifo}</td><td><div class="row-actions">${btnAvanzar}${btnDeshacer}${btnCancelar}</div></td></tr>`;
  }).join('');

  const pasos = ['Recibir', 'Confirmar', 'Preparar', 'Despachar'];
  const detalles = ['Registrar solicitud', 'Validar existencias', 'Alistar productos', 'Asignar a una ruta'];
  const orden: EstadoPedido[] = [EstadoPedido.Nuevo, EstadoPedido.Confirmado, EstadoPedido.Preparando, EstadoPedido.Listo];
  const actual = filtrados[0] ? Math.max(0, orden.indexOf(filtrados[0].estado)) : 0;
  const flujo = pasos.map((paso, indice) => `${indice > 0 ? '<i></i>' : ''}<div class="process-step${indice === actual ? ' current' : ''}"><span>${String(indice + 1).padStart(2, '0')}</span><strong>${paso}</strong><small>${detalles[indice]}</small></div>`).join('');

  const opcionesEstados = Object.values(EstadoPedido)
    .map((val) => `<option value="${val}"${estado.pedidosEstado === val ? ' selected' : ''}>${val}</option>`)
    .join('');
  const ubicaciones = sistema.ubicaciones.listarUbicaciones();
  const opcionesUbicacionesFiltro = ubicaciones
    .map((ubi) => `<option value="${ubi.id}"${estado.pedidosUbicacion === ubi.id ? ' selected' : ''}>${esc(ubi.nombre)}</option>`)
    .join('');
  const opcionesUbicacionesForm = ubicaciones
    .map((ubi) => `<option value="${ubi.id}"${ubi.id === 'SUC-CENTRO' ? ' selected' : ''}>${esc(ubi.nombre)}</option>`)
    .join('');
  const opcionesClientes = sistema.ventas.listarClientes()
    .map((cli) => `<option value="${esc(cli.nombre)}">${esc(cli.nombre)}</option>`)
    .join('');

  return `<section class="page-title-row"><div><div class="eyebrow"><span class="eyebrow-line"></span> CICLO DE ATENCIÓN</div><h1 class="page-title">De solicitud a entrega,<br /><em>sin perder el hilo.</em></h1><p class="intro">Cola FIFO de atención, ciclo de estados y pila para deshacer cambios.</p></div><div class="actions-row"><button type="button" class="button button-outline" data-action="atender-siguiente">▶ Atender siguiente (FIFO)</button><button type="button" class="button button-dark" data-action="nuevo-pedido">＋ Nuevo pedido</button></div></section>
<div class="metric-grid compact-metrics"><article class="metric-card"><div class="metric-top"><span>POR CONFIRMAR</span><span class="metric-symbol orange">◷</span></div><strong class="metric-value">${porConfirmar}</strong><div class="metric-foot"><span class="metric-note">${pendientesCola.length} activos en cola FIFO · siguiente: ${esc(siguienteFifo?.id ?? 'ninguno')}</span></div></article><article class="metric-card"><div class="metric-top"><span>EN PREPARACIÓN</span><span class="metric-symbol blue">▤</span></div><strong class="metric-value">${enPreparacion}</strong><div class="metric-foot"><span class="metric-note">Bodega central</span></div></article><article class="metric-card"><div class="metric-top"><span>LISTOS PARA SALIR</span><span class="metric-symbol green">✓</span></div><strong class="metric-value">${listos}</strong><div class="metric-foot"><span class="metric-note">Próxima ruta: ${sistema.logistica.listarRutas()[0]?.salida ?? 'sin definir'}</span></div></article></div>
<section class="panel orders-panel"><div class="panel-heading"><div><div class="section-kicker">BANDEJA DE PEDIDOS</div><h2>Atención en curso <span class="heading-count">${filtrados.length}</span></h2></div><a class="text-link" href="#/pedidos/nuevo-pedido">Crear pedido personalizado <span>↗</span></a></div>
<div class="filter-row"><label class="search-field">⌕ <input class="search-input" type="search" placeholder="Buscar pedido o cliente…" value="${esc(estado.pedidosBusqueda)}" data-filter="pedidosBusqueda" /></label><select class="select-pill" data-filter="pedidosEstado"><option value="">Todos los estados</option>${opcionesEstados}</select><select class="select-pill" data-filter="pedidosUbicacion"><option value="">Todas las ubicaciones</option>${opcionesUbicacionesFiltro}</select></div>
<div class="activity-table-wrap"><table><thead><tr><th>PEDIDO</th><th>CLIENTE</th><th>RECIBIDO</th><th>ENTREGA</th><th>TOTAL</th><th>ESTADO</th><th>ACCIONES</th></tr></thead><tbody>${filas || '<tr><td colspan="7">No hay pedidos que coincidan con el filtro.</td></tr>'}</tbody></table></div>
<div class="table-bottom"><span>Mostrando ${filtrados.length} de ${todos.length} pedidos</span><span class="pagination">→ Avanzar · ↩ Deshacer (Pila) · ✕ Cancelar</span></div></section>
<section class="panel process-panel" id="nuevo-pedido"><div class="section-kicker">ALTA RÁPIDA DE PEDIDO Y CICLO DE ESTADOS</div><div class="inline-form"><label>CLIENTE<select class="fake-select" name="pedidoCliente">${opcionesClientes}</select></label><label>DESTINO<select class="fake-select" name="pedidoDestino">${opcionesUbicacionesForm}</select></label><label>TOTAL ($)<input class="fake-select" type="number" name="pedidoTotal" min="1" step="0.5" value="250" /></label><button type="button" class="button button-dark button-sm" data-action="nuevo-pedido">＋ Encolar pedido</button></div><div class="process-flow">${flujo}</div></section>`;
}
