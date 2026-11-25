/** Estructura común a todas las secciones: barra lateral, cabecera y pie. */

import type { Seccion } from '../model/tipos';

interface Enlace {
  id: Seccion;
  etiqueta: string;
  icono: string;
  numero?: string;
}

const NAVEGACION: Enlace[] = [
  { id: 'resumen', etiqueta: 'Resumen general', icono: '◫' },
  { id: 'productos', etiqueta: 'Productos e inventario', icono: '▦', numero: '01' },
  { id: 'ubicaciones', etiqueta: 'Bodegas y sucursales', icono: '⌖', numero: '02' },
  { id: 'ventas', etiqueta: 'Clientes y ventas', icono: '↗', numero: '03' },
  { id: 'pedidos', etiqueta: 'Pedidos', icono: '▤', numero: '04' },
  { id: 'distribucion', etiqueta: 'Logística y distribución', icono: '⌁', numero: '05' },
  { id: 'seguimiento', etiqueta: 'Seguimiento operativo', icono: '◷', numero: '06' },
];

const TITULOS: Record<Seccion, string> = {
  resumen: 'Resumen general',
  productos: 'Productos e inventario',
  ubicaciones: 'Bodegas y sucursales',
  ventas: 'Clientes y ventas',
  pedidos: 'Pedidos',
  distribucion: 'Logística y distribución',
  seguimiento: 'Seguimiento operativo',
};

function navegacion(seccion: Seccion): string {
  const enlaces = NAVEGACION.map((enlace, indice) => {
    const activo = enlace.id === seccion;
    const prefijo = indice === 1 ? '<div class="nav-heading">GESTIÓN DEL NEGOCIO</div>' : '';
    const actual = activo ? ' active" aria-current="page"' : '"';
    const contador = enlace.numero ? `<span class="nav-count">${enlace.numero}</span>` : '';
    return `${prefijo}<a class="nav-link${actual} href="#/${enlace.id}"><span class="nav-icon">${enlace.icono}</span>${enlace.etiqueta}${contador}</a>`;
  }).join('');
  return enlaces;
}

function cabecera(seccion: Seccion): string {
  const ruta = seccion === 'resumen' ? 'Operaciones' : 'Gestión del negocio';
  const acciones = seccion === 'resumen'
    ? '<button class="icon-button" aria-label="Notificaciones">♧<i class="notification-dot"></i></button>'
    : '<span class="user-mini">LM</span>';
  return `<div class="breadcrumb">${ruta} <span>/</span> <strong>${TITULOS[seccion]}</strong></div><div class="topbar-actions"><span class="live-status"><i></i> Sistema al día</span><span class="top-divider"></span><span class="today">MARTES, 24 NOV 2026</span>${acciones}</div>`;
}

/** Devuelve el documento completo con la sección solicitada en el área principal. */
export function renderShell(contenido: string, seccion: Seccion): string {
  return `<div class="app-shell">
      <aside class="sidebar">
        <a class="brand" href="#/resumen" aria-label="Los Manguitos, inicio">
          <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
          <span class="brand-copy"><strong>los manguitos</strong><small>OPERACIONES · EL SALVADOR</small></span>
        </a>
        <div class="workspace-label">ESPACIO DE TRABAJO</div>
        <nav class="primary-nav" aria-label="Navegación principal">
          ${navegacion(seccion)}
        </nav>
        <div class="sidebar-bottom"><div class="help-card"><span class="help-orb">✳</span><strong>Todo en movimiento.</strong><p>Una vista clara para cada decisión del día.</p><a href="#/seguimiento">Ver actividad <span>↗</span></a></div><div class="profile"><span class="avatar">LM</span><span class="profile-info"><strong>Equipo Los Manguitos</strong><small>Administración</small></span><span class="profile-dots">···</span></div></div>
      </aside>
      <main class="main-area">
        <header class="topbar">${cabecera(seccion)}</header>
        <div class="page-content">
          ${contenido}
          <footer class="page-footer"><span><b class="footer-mark">●</b> LOS MANGUITOS <span class="footer-sep">·</span> Sistema de gestión operativa</span><span>Propuesta de prototipo <i>v.01</i></span></footer>
        </div>
      </main>
    </div>`;
}

export { TITULOS };
