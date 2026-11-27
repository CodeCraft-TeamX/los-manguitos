/** Controlador de navegación: interpreta el hash y renderiza la vista activa con el modelo. */

import type { Seccion } from '../model/tipos';
import type { Sistema } from '../model/sistema';
import { TITULOS, renderShell } from '../view/layout';
import { vistaDashboard } from '../view/dashboard';
import { vistaProductos } from '../view/productos';
import { vistaUbicaciones } from '../view/ubicaciones';
import { vistaVentas } from '../view/ventas';
import { vistaPedidos } from '../view/pedidos';
import { vistaDistribucion } from '../view/distribucion';
import { vistaSeguimiento } from '../view/seguimiento';
import { instalarAcciones } from './acciones';
import { crearEstadoUI, type EstadoUI } from './estado';

const VISTAS: Record<Seccion, (sistema: Sistema, estado: EstadoUI) => string> = {
  resumen: (sistema) => vistaDashboard(sistema),
  productos: vistaProductos,
  ubicaciones: (sistema) => vistaUbicaciones(sistema),
  ventas: vistaVentas,
  pedidos: vistaPedidos,
  distribucion: vistaDistribucion,
  seguimiento: vistaSeguimiento,
};

interface Ruta {
  seccion: Seccion;
  foco?: string;
}

function leerHash(): Ruta {
  const crudo = window.location.hash.replace(/^#\/?/, '');
  const [nombre, foco] = crudo.split('/');
  const seccion = nombre && nombre in VISTAS ? (nombre as Seccion) : 'resumen';
  return { seccion, foco };
}

export function iniciarRouter(sistema: Sistema): void {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) throw new Error('No se encontró el contenedor #app');

  const estado = crearEstadoUI();
  let renderizar: () => void = () => {};
  // La delegación se instala una sola vez: el render reemplaza el contenido de #app.
  instalarAcciones(app, sistema, estado, () => renderizar());

  renderizar = (): void => {
    const activo = document.activeElement as HTMLInputElement | null;
    const filtroActivo = activo?.dataset?.filter;
    const seleccionInicio = activo?.selectionStart ?? null;
    const seleccionFin = activo?.selectionEnd ?? null;

    const { seccion, foco } = leerHash();
    app.innerHTML = renderShell(VISTAS[seccion](sistema, estado), seccion);
    document.title = `${TITULOS[seccion]} · Los Manguitos`;

    if (filtroActivo) {
      const campo = app.querySelector<HTMLInputElement>(`[data-filter="${filtroActivo}"]`);
      if (campo) {
        campo.focus();
        if (seleccionInicio !== null && seleccionFin !== null && campo.type === 'search') {
          campo.setSelectionRange(seleccionInicio, seleccionFin);
        }
      }
      return;
    }

    if (foco) {
      requestAnimationFrame(() => {
        document.getElementById(foco)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else {
      window.scrollTo({ top: 0 });
    }
  };

  window.addEventListener('hashchange', renderizar);
  renderizar();
}
