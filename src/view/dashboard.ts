/** Vista de resumen general: mismo marcado, con las cifras leídas del modelo. */

import type { Sistema } from '../model/sistema';
import {
  esc,
  estadoEvento,
  iconoEvento,
  nombreOperacion,
  numero,
  partesDinero,
} from './formatos';

export function vistaDashboard(sistema: Sistema): string {
  const cifras = sistema.indicadores();
  const ventasActivas = sistema.ventas.todasLasVentas().filter((venta) => !venta.cancelada);
  const [ventasEntero, ventasDecimal] = partesDinero(sistema.ventas.totalVendido());
  const [semanaEntero, semanaDecimal] = partesDinero(cifras.ventasSemana);
  const productos = sistema.productos.listarProductos();
  const bajos = productos.filter((producto) => producto.existencias < producto.minimo);
  const pendientes = sistema.pedidos.pedidosPendientes().length;
  const rutas = sistema.logistica.listarRutas();
  const enCurso = rutas.filter((ruta) => ruta.estado === 'En curso').length;

  const stock = bajos.map((producto) => `<div class="stock-item"><span class="product-thumb ${producto.thumb}">${producto.inicial}</span><span class="stock-name"><strong>${esc(producto.nombre)}</strong><small>${esc(producto.categoria)} · ${esc(sistema.nombreUbicacion(producto.ubicacion))}</small></span><span class="stock-qty"><strong>${numero(producto.existencias)} <small>${esc(producto.unidad)}</small></strong><small class="low-label">Mínimo: ${numero(producto.minimo)} ${esc(producto.unidad)}</small></span><span class="stock-alert">Bajo</span></div>`).join('');

  const actividad = [...sistema.seguimiento.ultimosEventos(3)].reverse().map((evento) => {
    const icono = iconoEvento(evento.tipo);
    const estado = estadoEvento(evento.tipo);
    return `<tr><td><span class="operation-icon ${icono.clase}">${icono.glifo}</span>${nombreOperacion(evento.tipo)}</td><td class="ref">${esc(evento.referencia)}</td><td>${esc(evento.ubicacion)}</td><td>${esc(evento.responsable)}</td><td>${esc(evento.hora)}</td><td><span class="status ${estado.clase}">${estado.texto}</span></td></tr>`;
  }).join('');

  return `<section class="welcome-row"><div><div class="eyebrow"><span class="eyebrow-line"></span> CENTRO DE OPERACIONES</div><h1>Un buen día empieza<br />con <em>todo en su sitio.</em></h1><p class="intro">El pulso de Los Manguitos, de la bodega a cada sucursal.</p></div><a class="button button-dark" href="#/pedidos">Revisar pedidos <span>↗</span></a></section>
          <section class="metric-grid" aria-label="Indicadores del negocio">
            <article class="metric-card"><div class="metric-top"><span>VENTAS DE HOY</span><span class="metric-symbol green">↗</span></div><strong class="metric-value">${ventasEntero}<span>.${ventasDecimal}</span></strong><div class="metric-foot"><span class="trend">↑ ${cifras.tendenciaDia}%</span><span>${ventasActivas.length} transacciones</span><span class="sparkline">▁▃▂▅▄▇▆█</span></div></article>
            <article class="metric-card"><div class="metric-top"><span>PRODUCTOS ACTIVOS</span><span class="metric-symbol orange">▦</span></div><strong class="metric-value">${productos.length}</strong><div class="metric-foot"><span class="metric-note"><i class="tiny-dot amber"></i> ${bajos.length} por debajo del mínimo</span><span class="sparkline orange-line">▂▃▃▅▄▆▅▇</span></div></article>
            <article class="metric-card"><div class="metric-top"><span>PEDIDOS POR ATENDER</span><span class="metric-symbol blue">▤</span></div><strong class="metric-value">${pendientes}</strong><div class="metric-foot"><span class="metric-note">${sistema.pedidos.todosLosPedidos().filter((pedido) => pedido.estado === 'Listo').length} listos para despacho</span><span class="sparkline blue-line">▁▂▄▃▅▄▆▅</span></div></article>
            <article class="metric-card"><div class="metric-top"><span>ENTREGAS EN CURSO</span><span class="metric-symbol violet">⌁</span></div><strong class="metric-value">${enCurso}</strong><div class="metric-foot"><span class="metric-note"><i class="tiny-dot green-dot"></i> ${rutas.length} rutas activas</span><span class="sparkline violet-line">▂▁▃▄▃▅▆▇</span></div></article>
          </section>
          <section class="dashboard-grid">
            <article class="panel sales-panel"><div class="panel-heading"><div><div class="section-kicker">RENDIMIENTO</div><h2>Así va la semana</h2></div><span class="select-pill">Esta semana <span>⌄</span></span></div><div class="sales-summary"><strong>${semanaEntero}<span>.${semanaDecimal}</span></strong><span class="trend">↑ ${cifras.tendenciaSemana}%</span><small>en ventas</small></div><div class="chart" role="img" aria-label="Gráfico ilustrativo de ventas semanales"><div class="chart-labels"><span>$4k</span><span>$3k</span><span>$2k</span><span>$1k</span></div><div class="chart-grid"><div class="chart-bars"><div class="bar-group"><i style="--bar:43%"></i><i class="bar-muted" style="--bar:31%"></i></div><div class="bar-group"><i style="--bar:61%"></i><i class="bar-muted" style="--bar:42%"></i></div><div class="bar-group"><i style="--bar:49%"></i><i class="bar-muted" style="--bar:36%"></i></div><div class="bar-group"><i style="--bar:78%"></i><i class="bar-muted" style="--bar:54%"></i></div><div class="bar-group"><i style="--bar:66%"></i><i class="bar-muted" style="--bar:45%"></i></div><div class="bar-group"><i style="--bar:91%"></i><i class="bar-muted" style="--bar:61%"></i></div><div class="bar-group"><i style="--bar:72%"></i><i class="bar-muted" style="--bar:49%"></i></div></div><div class="chart-days"><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span></div></div></div><div class="chart-legend"><span><i></i> Esta semana</span><span><i class="legend-muted"></i> Semana anterior</span></div></article>
            <article class="panel stock-panel"><div class="panel-heading"><div><div class="section-kicker">ATENCIÓN PRIORITARIA</div><h2>Inventario por revisar</h2></div><a class="text-link" href="#/productos">Ver inventario <span>↗</span></a></div><div class="stock-list">${stock}</div></article>
          </section>
          <section class="panel activity-panel"><div class="panel-heading"><div><div class="section-kicker">LO QUE ESTÁ PASANDO</div><h2>Actividad reciente</h2></div><a class="text-link" href="#/seguimiento">Ver todos los movimientos <span>↗</span></a></div><div class="activity-table-wrap"><table><thead><tr><th>OPERACIÓN</th><th>REFERENCIA</th><th>UBICACIÓN</th><th>RESPONSABLE</th><th>HORA</th><th>ESTADO</th></tr></thead><tbody>${actividad}</tbody></table></div></section>`;
}
