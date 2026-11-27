/** Funcionalidad 2: stock por ubicación y cola FIFO de transferencias. */

import { ErrorDeNegocio, NoEncontrado, StockInsuficiente, ValidacionError } from './errores';
import type { Transferencia, Ubicacion } from './tipos';

export class GestorUbicaciones {
  private readonly ubicaciones = new Map<string, Ubicacion>();
  private readonly stock = new Map<string, Map<string, number>>();
  private transferencias: Transferencia[] = [];
  private cabeza = 0;

  registrarUbicacion(ubicacion: Ubicacion): Ubicacion {
    if (this.ubicaciones.has(ubicacion.id)) {
      throw new ValidacionError(`Ubicación '${ubicacion.id}' ya registrada`);
    }
    this.ubicaciones.set(ubicacion.id, ubicacion);
    this.stock.set(ubicacion.id, new Map<string, number>());
    return ubicacion;
  }

  consultarUbicacion(id: string): Ubicacion {
    const ubicacion = this.ubicaciones.get(id);
    if (!ubicacion) throw new NoEncontrado(`Ubicación '${id}' no encontrada`);
    return ubicacion;
  }

  listarUbicaciones(): Ubicacion[] {
    return [...this.ubicaciones.values()];
  }

  consultarStock(id: string, sku: string): number {
    this.consultarUbicacion(id);
    return this.stock.get(id)!.get(sku) ?? 0;
  }

  ajustarStock(id: string, sku: string, delta: number): number {
    this.consultarUbicacion(id);
    if (!Number.isInteger(delta)) throw new ValidacionError('El ajuste debe ser entero');
    const disponible = this.consultarStock(id, sku);
    const nuevo = disponible + delta;
    if (nuevo < 0) {
      throw new StockInsuficiente(
        `Stock insuficiente de '${sku}' en '${id}' (disponible: ${disponible})`,
      );
    }
    this.stock.get(id)!.set(sku, nuevo);
    return nuevo;
  }

  stockTotal(sku: string): number {
    let total = 0;
    for (const unidades of this.stock.values()) total += unidades.get(sku) ?? 0;
    return total;
  }

  stockPorUbicacion(sku: string): Record<string, number> {
    const resultado: Record<string, number> = {};
    for (const [id, unidades] of this.stock) {
      const cantidad = unidades.get(sku) ?? 0;
      if (cantidad > 0) resultado[id] = cantidad;
    }
    return resultado;
  }

  registrarTransferencia(transferencia: Transferencia): Transferencia {
    this.consultarUbicacion(transferencia.origen);
    this.consultarUbicacion(transferencia.destino);
    this.transferencias.push(transferencia);
    return transferencia;
  }

  /** Valida stock y encola; el orden de atención es FIFO. */
  solicitarTransferencia(transferencia: Transferencia): Transferencia {
    if (transferencia.origen === transferencia.destino) {
      throw new ValidacionError('El origen y el destino deben ser distintos');
    }
    if (transferencia.cantidad < 1) {
      throw new ValidacionError('La cantidad debe ser mayor que cero');
    }
    const disponible = this.consultarStock(transferencia.origen, transferencia.sku);
    if (disponible < transferencia.cantidad) {
      throw new StockInsuficiente(
        `Stock insuficiente de '${transferencia.sku}' en '${transferencia.origen}'`,
      );
    }
    return this.registrarTransferencia(transferencia);
  }

  procesarSiguienteTransferencia(): Transferencia {
    if (this.cabeza >= this.transferencias.length) {
      throw new ErrorDeNegocio('No hay transferencias pendientes');
    }
    const transferencia = this.transferencias[this.cabeza];
    const disponible = this.consultarStock(transferencia.origen, transferencia.sku);
    if (disponible < transferencia.cantidad) {
      throw new StockInsuficiente(
        `Ya no hay stock suficiente para '${transferencia.id}' en '${transferencia.origen}' (disponible: ${disponible})`,
      );
    }
    this.cabeza++;
    if (this.cabeza > 64 && this.cabeza * 2 >= this.transferencias.length) {
      this.transferencias = this.transferencias.slice(this.cabeza);
      this.cabeza = 0;
    }
    this.ajustarStock(transferencia.origen, transferencia.sku, -transferencia.cantidad);
    this.ajustarStock(transferencia.destino, transferencia.sku, transferencia.cantidad);
    transferencia.estado = 'Completada';
    return transferencia;
  }

  transferenciasPendientes(): Transferencia[] {
    return this.transferencias.slice(this.cabeza);
  }
}
