/** Controlador de interacciones: conecta los botones con las operaciones del modelo. */

import { ventaRapida } from '../model/datos';
import { ValidacionError } from '../model/errores';
import type { Sistema } from '../model/sistema';

type Accion =
  | 'exportar-registro'
  | 'avanzar-pedido'
  | 'nuevo-pedido'
  | 'completar-venta'
  | 'preparar-transferencia'
  | 'planificar-ruta';

export function instalarAcciones(
  raiz: HTMLElement,
  sistema: Sistema,
  renderizar: () => void,
): void {
  raiz.addEventListener('click', (evento) => {
    const objetivo = (evento.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!objetivo) return;
    const accion = objetivo.dataset.action as Accion | undefined;
    if (!accion) return;

    try {
      switch (accion) {
        case 'exportar-registro':
          evento.preventDefault();
          exportarRegistro(sistema);
          break;
        case 'avanzar-pedido': {
          const pedido = sistema.avanzarPedido(objetivo.dataset.id ?? '');
          notificar(`${pedido.id} avanzó a ${pedido.estado}`);
          renderizar();
          break;
        }
        case 'nuevo-pedido': {
          const pedido = sistema.crearPedido();
          notificar(`Pedido ${pedido.id} registrado en la cola`);
          renderizar();
          break;
        }
        case 'completar-venta': {
          const clienteId = raiz.querySelector<HTMLSelectElement>('select[name="clienteId"]')?.value;
          if (!clienteId) throw new ValidacionError('Selecciona un cliente para la venta');
          const venta = sistema.registrarVenta(clienteId, ventaRapida);
          notificar(`Venta ${venta.id} registrada por $${venta.total.toFixed(2)}`);
          renderizar();
          break;
        }
        case 'preparar-transferencia': {
          const origen = raiz.querySelector<HTMLSelectElement>('select[name="origen"]')?.value ?? '';
          const destino = raiz.querySelector<HTMLSelectElement>('select[name="destino"]')?.value ?? '';
          const sku = raiz.querySelector<HTMLSelectElement>('select[name="sku"]')?.value ?? '';
          const cantidad = Number(raiz.querySelector<HTMLInputElement>('input[name="cantidad"]')?.value);
          if (!Number.isInteger(cantidad) || cantidad < 1) {
            throw new ValidacionError('La cantidad debe ser un entero mayor que cero');
          }
          const transferencia = sistema.solicitarTransferencia({ origen, destino, sku, cantidad });
          notificar(`Transferencia ${transferencia.id} preparada`);
          renderizar();
          break;
        }
        case 'planificar-ruta': {
          const yaPlanificadas = new Set(sistema.logistica.listarRutas().map((ruta) => ruta.destino));
          const destino = sistema.ubicaciones.listarUbicaciones()
            .find((ubicacion) => ubicacion.tipo === 'sucursal' && !yaPlanificadas.has(ubicacion.id))?.id
            ?? 'PUERTO-LA-LIBERTAD';
          const ruta = sistema.planificarRuta(destino);
          notificar(`Ruta ${ruta.id} calculada con Dijkstra`);
          renderizar();
          break;
        }
      }
    } catch (error) {
      notificar(error instanceof Error ? error.message : 'No se pudo completar la operación', 'error');
    }
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
  notificar(`Bitácora exportada: ${filas.length} eventos`);
}

function notificar(mensaje: string, tipo: 'ok' | 'error' = 'ok'): void {
  const toast = document.querySelector<HTMLDivElement>('#toast');
  if (!toast) return;
  toast.textContent = mensaje;
  toast.className = `toast visible ${tipo}`;
  window.setTimeout(() => {
    toast.className = 'toast';
  }, 3500);
}
