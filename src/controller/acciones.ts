/** Controlador de interacciones: conecta los botones con el modelo. */

import type { Sistema } from '../model/sistema';

export function instalarAcciones(raiz: HTMLElement, sistema: Sistema): void {
  const exportar = raiz.querySelector<HTMLElement>('[data-action="exportar-registro"]');
  exportar?.addEventListener('click', (evento) => {
    evento.preventDefault();
    exportarRegistro(sistema);
  });
}

function exportarRegistro(sistema: Sistema): void {
  const cabecera = 'HORA;TIPO;DETALLE;UBICACION;RESPONSABLE;REFERENCIA';
  const filas = sistema.seguimiento.todosLosEventos().map((evento) =>
    [evento.hora, evento.tipo, evento.detalle, evento.ubicacion, evento.responsable, evento.referencia]
      .map((valor) => `"${valor.replace(/"/g, '""')}"`)
      .join(';'),
  );
  const contenido = `\uFEFF${[cabecera, ...filas].join('\n')}`;
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = 'los-manguitos-registro.csv';
  enlace.click();
  URL.revokeObjectURL(url);
}
