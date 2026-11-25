/** Funcionalidad 6: log append-only, índice por tipo y árbol por correlativo. */

import { ValidacionError } from './errores';
import type { Evento } from './tipos';

interface Nodo {
  evento: Evento;
  clave: number;
  izquierdo?: Nodo;
  derecho?: Nodo;
}

export class RegistroOperaciones {
  private readonly eventos: Evento[] = [];
  private readonly porTipo = new Map<string, Evento[]>();
  private raiz?: Nodo;
  private siguienteId = 1;

  registrarEvento(evento: Evento): Evento {
    if (!evento.tipo || !evento.referencia) {
      throw new ValidacionError('El evento necesita tipo y referencia');
    }
    const clave = this.siguienteId++;
    this.eventos.push(evento);
    this.porTipo.set(evento.tipo, [...(this.porTipo.get(evento.tipo) ?? []), evento]);
    this.raiz = this.insertar(this.raiz, evento, clave);
    return evento;
  }

  eventosPorTipo(tipo: string): Evento[] {
    return [...(this.porTipo.get(tipo) ?? [])];
  }

  /** Rango por correlativo: en la web la hora es texto de presentación. */
  eventosEntre(desde: number, hasta: number): Evento[] {
    if (desde > hasta) throw new ValidacionError('El inicio no puede ser mayor que el fin');
    const encontrados: Evento[] = [];
    this.rango(this.raiz, desde, hasta, encontrados);
    return encontrados;
  }

  ultimosEventos(cantidad = 10): Evento[] {
    if (cantidad < 1) throw new ValidacionError('La cantidad debe ser mayor que cero');
    return this.eventos.slice(-cantidad);
  }

  todosLosEventos(): Evento[] {
    return [...this.eventos];
  }

  resumenPorTipo(): Record<string, number> {
    const resumen: Record<string, number> = {};
    for (const [tipo, eventos] of this.porTipo) resumen[tipo] = eventos.length;
    return resumen;
  }

  private insertar(nodo: Nodo | undefined, evento: Evento, clave: number): Nodo {
    if (!nodo) return { evento, clave };
    if (clave < nodo.clave) nodo.izquierdo = this.insertar(nodo.izquierdo, evento, clave);
    else nodo.derecho = this.insertar(nodo.derecho, evento, clave);
    return nodo;
  }

  private rango(nodo: Nodo | undefined, desde: number, hasta: number, salida: Evento[]): void {
    if (!nodo) return;
    if (nodo.clave >= desde) this.rango(nodo.izquierdo, desde, hasta, salida);
    if (nodo.clave >= desde && nodo.clave <= hasta) salida.push(nodo.evento);
    if (nodo.clave <= hasta) this.rango(nodo.derecho, desde, hasta, salida);
  }
}
