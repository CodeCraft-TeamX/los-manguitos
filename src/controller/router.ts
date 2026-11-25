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

const VISTAS: Record<Seccion, (sistema: Sistema) => string> = {
  resumen: vistaDashboard,
  productos: vistaProductos,
  ubicaciones: vistaUbicaciones,
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

  let renderizar: () => void = () => {};
  // La delegación se instala una sola vez: el render reemplaza el contenido de #app.
  instalarAcciones(app, sistema, () => renderizar());

  renderizar = (): void => {
    const { seccion, foco } = leerHash();
    app.innerHTML = renderShell(VISTAS[seccion](sistema), seccion);
    document.title = `${TITULOS[seccion]} · Los Manguitos`;

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
