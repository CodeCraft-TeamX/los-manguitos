/** Funcionalidad 4: cola FIFO de atención, índice por ID y pila de estados. */

import { ErrorDeNegocio, NoEncontrado, TransicionInvalida, ValidacionError } from './errores';
import { EstadoPedido, type Pedido } from './tipos';

const TRANSICIONES: Record<EstadoPedido, EstadoPedido[]> = {
  [EstadoPedido.Nuevo]: [EstadoPedido.Confirmado, EstadoPedido.Cancelado],
  [EstadoPedido.Confirmado]: [EstadoPedido.Preparando, EstadoPedido.Cancelado],
  [EstadoPedido.Preparando]: [EstadoPedido.Listo, EstadoPedido.Cancelado],
  [EstadoPedido.Listo]: [EstadoPedido.Despachado, EstadoPedido.Cancelado],
  [EstadoPedido.Despachado]: [],
  [EstadoPedido.Cancelado]: [],
};

export class GestorPedidos {
  private readonly pedidos = new Map<string, Pedido>();
  private readonly cola: Pedido[] = [];
  private readonly historial = new Map<string, EstadoPedido[]>();

  registrarPedido(pedido: Pedido): Pedido {
    if (this.pedidos.has(pedido.id)) {
      throw new ValidacionError(`Pedido '${pedido.id}' ya registrado`);
    }
    this.pedidos.set(pedido.id, pedido);
    this.historial.set(pedido.id, []);
    if (pedido.estado === EstadoPedido.Nuevo) this.cola.push(pedido);
    return pedido;
  }

  consultarPedido(id: string): Pedido {
    const pedido = this.pedidos.get(id);
    if (!pedido) throw new NoEncontrado(`Pedido '${id}' no encontrado`);
    return pedido;
  }

  atenderSiguiente(): Pedido {
    const pedido = this.cola.shift();
    if (!pedido) throw new ErrorDeNegocio('No hay pedidos pendientes de atención');
    this.cambiarEstado(pedido.id, EstadoPedido.Preparando);
    return pedido;
  }

  cambiarEstado(id: string, nuevo: EstadoPedido): Pedido {
    const pedido = this.consultarPedido(id);
    if (!TRANSICIONES[pedido.estado].includes(nuevo)) {
      throw new TransicionInvalida(`No se puede pasar de ${pedido.estado} a ${nuevo}`);
    }
    this.historial.get(id)!.push(pedido.estado);
    pedido.estado = nuevo;
    return pedido;
  }

  /** Restaura el estado anterior; no reinserta el pedido en la cola. */
  deshacerCambio(id: string): Pedido {
    const pedido = this.consultarPedido(id);
    const anterior = this.historial.get(id)!.pop();
    if (!anterior) throw new ErrorDeNegocio(`Pedido '${id}' no tiene cambios para deshacer`);
    pedido.estado = anterior;
    return pedido;
  }

  pedidosPendientes(): Pedido[] {
    return [...this.cola];
  }

  todosLosPedidos(): Pedido[] {
    return [...this.pedidos.values()];
  }
}
