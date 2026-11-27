/** Controlador de interacciones: conecta botones, formularios y filtros con el modelo. */

import { ventaRapida } from '../model/datos';
import { ValidacionError } from '../model/errores';
import type { Sistema } from '../model/sistema';
import type { Cliente, Producto } from '../model/tipos';
import type { EstadoUI } from './estado';

type Accion =
  | 'exportar-registro'
  | 'avanzar-pedido'
  | 'deshacer-pedido'
  | 'cancelar-pedido'
  | 'atender-siguiente'
  | 'nuevo-pedido'
  | 'completar-venta'
  | 'cancelar-ultima-venta'
  | 'registrar-cliente'
  | 'preparar-transferencia'
  | 'procesar-transferencia'
  | 'planificar-ruta'
  | 'registrar-producto'
  | 'registrar-movimiento'
  | 'registrar-proveedor';

export function instalarAcciones(
  raiz: HTMLElement,
  sistema: Sistema,
  estado: EstadoUI,
  renderizar: () => void,
): void {
  const actualizarFiltro = (evento: Event): void => {
    const control = evento.target as HTMLInputElement | HTMLSelectElement | null;
    if (evento.type === 'input' && control instanceof HTMLInputElement && control.name === 'provContacto') {
      const digitos = control.value.replace(/\D/g, '').slice(0, 8);
      control.value = digitos.length > 4 ? `${digitos.slice(0, 4)}-${digitos.slice(4)}` : digitos;
      return;
    }
    const clave = control?.dataset?.filter as keyof EstadoUI | undefined;
    if (!control || !clave || !(clave in estado)) return;
    if (evento.type === 'input' && control.tagName === 'SELECT') return;
    if (evento.type === 'change' && control.tagName === 'INPUT') return;
    estado[clave] = control.value;
    renderizar();
  };

  raiz.addEventListener('input', actualizarFiltro);
  raiz.addEventListener('change', actualizarFiltro);

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
        case 'deshacer-pedido': {
          const pedido = sistema.deshacerEstadoPedido(objetivo.dataset.id ?? '');
          notificar(`${pedido.id} restaurado a ${pedido.estado}`);
          renderizar();
          break;
        }
        case 'cancelar-pedido': {
          const pedido = sistema.cancelarPedido(objetivo.dataset.id ?? '');
          notificar(`Pedido ${pedido.id} cancelado`);
          renderizar();
          break;
        }
        case 'atender-siguiente': {
          const pedido = sistema.atenderSiguientePedido();
          notificar(`Pedido ${pedido.id} atendido (FIFO) → ${pedido.estado}`);
          renderizar();
          break;
        }
        case 'nuevo-pedido': {
          const cliente = valor(raiz, 'pedidoCliente') || undefined;
          const destino = valor(raiz, 'pedidoDestino') || undefined;
          const totalCrudo = valor(raiz, 'pedidoTotal');
          const total = totalCrudo ? Number(totalCrudo) : undefined;
          const pedido = sistema.crearPedido(cliente, destino, total);
          notificar(`Pedido ${pedido.id} registrado en la cola`);
          renderizar();
          break;
        }
        case 'completar-venta': {
          const clienteId = valor(raiz, 'clienteId');
          if (!clienteId) throw new ValidacionError('Selecciona un cliente para la venta');
          const ventaSku = valor(raiz, 'ventaSku');
          const items = ventaSku
            ? [{ sku: ventaSku, cantidad: Number(valor(raiz, 'ventaCantidad')) }]
            : ventaRapida;
          const venta = sistema.registrarVenta(clienteId, items);
          notificar(`Venta ${venta.id} registrada por $${venta.total.toFixed(2)}`);
          renderizar();
          break;
        }
        case 'cancelar-ultima-venta': {
          const venta = sistema.cancelarUltimaVenta();
          notificar(`Venta ${venta.id} cancelada (LIFO); stock restaurado`);
          renderizar();
          break;
        }
        case 'registrar-cliente': {
          const cliente: Cliente = {
            id: valor(raiz, 'nuevoClienteId'),
            nombre: valor(raiz, 'nuevoClienteNombre'),
            tipo: (valor(raiz, 'nuevoClienteTipo') || 'minorista') as Cliente['tipo'],
          };
          sistema.registrarCliente(cliente);
          notificar(`Cliente ${cliente.nombre} registrado`);
          renderizar();
          break;
        }
        case 'preparar-transferencia': {
          const origen = valor(raiz, 'origen');
          const destino = valor(raiz, 'destino');
          const sku = valor(raiz, 'sku');
          const cantidad = Number(valor(raiz, 'cantidad'));
          if (!Number.isInteger(cantidad) || cantidad < 1) {
            throw new ValidacionError('La cantidad debe ser un entero mayor que cero');
          }
          const transferencia = sistema.solicitarTransferencia({ origen, destino, sku, cantidad });
          notificar(`Transferencia ${transferencia.id} preparada`);
          renderizar();
          break;
        }
        case 'procesar-transferencia': {
          const transferencia = sistema.procesarSiguienteTransferencia();
          notificar(`Transferencia ${transferencia.id} procesada (FIFO)`);
          renderizar();
          break;
        }
        case 'planificar-ruta': {
          const ruta = sistema.planificarRuta(estado.rutaDestino, estado.rutaOrigen);
          notificar(`Ruta ${ruta.id} calculada con Dijkstra`);
          renderizar();
          break;
        }
        case 'registrar-producto': {
          const nombre = valor(raiz, 'prodNombre');
          const producto: Producto = {
            sku: valor(raiz, 'prodSku'),
            nombre,
            categoria: valor(raiz, 'prodCategoria'),
            ubicacion: valor(raiz, 'prodUbicacion'),
            unidad: valor(raiz, 'prodUnidad') || 'kg',
            existencias: Number(valor(raiz, 'prodStock') || '0'),
            minimo: Number(valor(raiz, 'prodMinimo') || '10'),
            precio: Number(valor(raiz, 'prodPrecio') || '0'),
            inicial: (nombre.trim()[0] ?? 'P').toUpperCase(),
            thumb: 'mango',
            proveedorId: valor(raiz, 'prodProveedor') || undefined,
          };
          const stockInicial = Number(valor(raiz, 'prodStock') || '0');
          sistema.registrarProducto(producto, stockInicial);
          notificar(`Producto ${producto.sku} (${producto.nombre}) registrado`);
          renderizar();
          break;
        }
        case 'registrar-movimiento': {
          const sku = valor(raiz, 'movSku');
          const tipo = (valor(raiz, 'movTipo') || 'entrada') as 'entrada' | 'salida';
          const ubicacion = valor(raiz, 'movUbicacion');
          const cantidad = Number(valor(raiz, 'movCantidad'));
          const descripcion = valor(raiz, 'movDescripcion');
          sistema.registrarMovimientoInventario(sku, tipo, cantidad, ubicacion, descripcion);
          notificar(`Movimiento de ${tipo} registrado para ${sku}`);
          renderizar();
          break;
        }
        case 'registrar-proveedor': {
          const proveedor = sistema.registrarProveedor({
            id: valor(raiz, 'provId'),
            nombre: valor(raiz, 'provNombre'),
            contacto: valor(raiz, 'provContacto'),
          });
          notificar(`Proveedor ${proveedor.nombre} registrado`);
          renderizar();
          break;
        }
      }
    } catch (error) {
      notificar(error instanceof Error ? error.message : 'No se pudo completar la operación', 'error');
    }
  });
}

function valor(raiz: HTMLElement, nombre: string): string {
  const campo = raiz.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${nombre}"]`);
  return campo?.value?.trim() ?? '';
}

function exportarRegistro(sistema: Sistema): void {
  const cabecera = 'HORA;TIPO;DETALLE;UBICACION;RESPONSABLE;REFERENCIA';
  const filas = sistema.seguimiento.todosLosEventos().map((evento) =>
    [evento.hora, evento.tipo, evento.detalle, evento.ubicacion, evento.responsable, evento.referencia]
      .map((dato) => `"${dato.replace(/"/g, '""')}"`)
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
