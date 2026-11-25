/** Funcionalidad 3: clientes, registro append-only de ventas y pila de cancelaciones. */

import { ErrorDeNegocio, NoEncontrado, ValidacionError } from './errores';
import type { Cliente, Venta } from './tipos';

export class GestorVentas {
  private readonly clientes = new Map<string, Cliente>();
  private readonly ventas: Venta[] = [];
  private readonly porCliente = new Map<string, string[]>();
  private readonly pilaActivas: Venta[] = [];

  registrarCliente(cliente: Cliente): Cliente {
    if (this.clientes.has(cliente.id)) {
      throw new ValidacionError(`Cliente '${cliente.id}' ya registrado`);
    }
    this.clientes.set(cliente.id, cliente);
    this.porCliente.set(cliente.id, []);
    return cliente;
  }

  consultarCliente(id: string): Cliente {
    const cliente = this.clientes.get(id);
    if (!cliente) throw new NoEncontrado(`Cliente '${id}' no encontrado`);
    return cliente;
  }

  listarClientes(): Cliente[] {
    return [...this.clientes.values()];
  }

  registrarVenta(venta: Venta): Venta {
    if (this.ventas.some((registrada) => registrada.id === venta.id)) {
      throw new ValidacionError(`Venta '${venta.id}' ya registrada`);
    }
    if (venta.articulos < 1 || venta.total <= 0) {
      throw new ValidacionError('La venta debe tener artículos y un total positivo');
    }
    this.ventas.push(venta);
    this.porCliente.set(venta.clienteId, [
      ...(this.porCliente.get(venta.clienteId) ?? []),
      venta.id,
    ]);
    this.pilaActivas.push(venta);
    return venta;
  }

  /** Saca la última venta activa (LIFO), la marca cancelada y conserva el registro. */
  cancelarUltimaVenta(): Venta {
    const venta = this.pilaActivas.pop();
    if (!venta) throw new ErrorDeNegocio('No hay ventas activas para cancelar');
    venta.cancelada = true;
    return venta;
  }

  ventasCliente(cliente: string): Venta[] {
    this.consultarCliente(cliente);
    const ids = new Set(this.porCliente.get(cliente) ?? []);
    return this.ventas.filter((venta) => ids.has(venta.id));
  }

  todasLasVentas(): Venta[] {
    return [...this.ventas];
  }

  totalVendido(): number {
    return this.ventas
      .filter((venta) => !venta.cancelada)
      .reduce((total, venta) => total + venta.total, 0);
  }
}
