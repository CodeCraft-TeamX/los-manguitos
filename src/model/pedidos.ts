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

const SIGUIENTE_ESTADO: Partial<Record<EstadoPedido, EstadoPedido>> = {
  [EstadoPedido.Nuevo]: EstadoPedido.Confirmado,
  [EstadoPedido.Confirmado]: EstadoPedido.Preparando,
  [EstadoPedido.Preparando]: EstadoPedido.Listo,
  [EstadoPedido.Listo]: EstadoPedido.Despachado,
};

const esActivo = (estado: EstadoPedido): boolean =>
  estado !== EstadoPedido.Despachado && estado !== EstadoPedido.Cancelado;

export class GestorPedidos {
  private readonly pedidos = new Map<string, Pedido>();
  private cola: Pedido[] = [];
  private cabeza = 0;
  private readonly historial = new Map<string, EstadoPedido[]>();

  registrarPedido(pedido: Pedido): Pedido {
    if (this.pedidos.has(pedido.id)) {
      throw new ValidacionError(`Pedido '${pedido.id}' ya registrado`);
    }
    this.pedidos.set(pedido.id, pedido);
    this.historial.set(pedido.id, []);
    if (esActivo(pedido.estado)) this.cola.push(pedido);
    return pedido;
  }

  consultarPedido(id: string): Pedido {
    const pedido = this.pedidos.get(id);
    if (!pedido) throw new NoEncontrado(`Pedido '${id}' no encontrado`);
    return pedido;
  }

  private limpiarCabeza(): void {
    while (this.cabeza < this.cola.length && !esActivo(this.cola[this.cabeza].estado)) {
      this.cabeza++;
    }
    if (this.cabeza > 64 && this.cabeza * 2 >= this.cola.length) {
      this.cola = this.cola.slice(this.cabeza);
      this.cabeza = 0;
    }
  }

  /** Atiende el pedido activo más antiguo en la cola FIFO hasta despacharlo. */
  atenderSiguiente(): Pedido {
    this.limpiarCabeza();
    if (this.cabeza >= this.cola.length) {
      throw new ErrorDeNegocio('No hay pedidos pendientes de atención');
    }
    const pedido = this.cola[this.cabeza];
    const siguiente = SIGUIENTE_ESTADO[pedido.estado];
    if (!siguiente) {
      this.cabeza++;
      return this.atenderSiguiente();
    }
    this.cambiarEstado(pedido.id, siguiente);
    if (!esActivo(pedido.estado)) {
      this.cabeza++;
    }
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

  /** Restaura el estado anterior; si vuelve a estar activo, asegura su lugar en la cola. */
  deshacerCambio(id: string): Pedido {
    const pedido = this.consultarPedido(id);
    const anterior = this.historial.get(id)!.pop();
    if (!anterior) throw new ErrorDeNegocio(`Pedido '${id}' no tiene cambios para deshacer`);
    pedido.estado = anterior;
    if (esActivo(pedido.estado) && !this.cola.slice(this.cabeza).some((item) => item.id === pedido.id)) {
      this.cola.push(pedido);
    }
    return pedido;
  }

  pedidosPendientes(): Pedido[] {
    this.limpiarCabeza();
    return this.cola.slice(this.cabeza).filter((pedido) => esActivo(pedido.estado));
  }

  todosLosPedidos(): Pedido[] {
    return [...this.pedidos.values()];
  }
}
