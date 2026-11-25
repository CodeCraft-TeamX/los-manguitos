/** Funcionalidad 5: grafo de la red, Dijkstra, DFS recursivo y entregas. */

import { ErrorDeNegocio, NoEncontrado, ValidacionError } from './errores';
import type { Entrega, Ruta } from './tipos';

export class RedLogistica {
  private readonly grafo = new Map<string, Map<string, number>>();
  private readonly entregas = new Map<string, Entrega>();
  private readonly rutas: Ruta[] = [];

  agregarNodo(nodo: string): void {
    if (!this.grafo.has(nodo)) this.grafo.set(nodo, new Map<string, number>());
  }

  agregarConexion(origen: string, destino: string, distancia: number): void {
    this.validarNodo(origen);
    this.validarNodo(destino);
    if (!Number.isFinite(distancia) || distancia <= 0) {
      throw new ValidacionError('La distancia debe ser un número mayor que cero');
    }
    this.grafo.get(origen)!.set(destino, distancia);
    this.grafo.get(destino)!.set(origen, distancia);
  }

  vecinos(nodo: string): Map<string, number> {
    this.validarNodo(nodo);
    return new Map(this.grafo.get(nodo));
  }

  /** Dijkstra con cola de prioridad simple (orden lineal sobre los nodos pendientes). */
  rutaMasCorta(origen: string, destino: string): string[] {
    this.validarNodo(origen);
    this.validarNodo(destino);
    const distancias = new Map<string, number>([...this.grafo.keys()].map((nodo) => [nodo, Infinity]));
    const anteriores = new Map<string, string>();
    const pendientes = new Set(this.grafo.keys());
    distancias.set(origen, 0);

    while (pendientes.size > 0) {
      let actual: string | undefined;
      let menor = Infinity;
      for (const nodo of pendientes) {
        const distancia = distancias.get(nodo) ?? Infinity;
        if (distancia < menor) {
          menor = distancia;
          actual = nodo;
        }
      }
      if (actual === undefined || actual === destino) break;
      pendientes.delete(actual);
      for (const [vecino, peso] of this.grafo.get(actual) ?? []) {
        const candidata = menor + peso;
        if (candidata < (distancias.get(vecino) ?? Infinity)) {
          distancias.set(vecino, candidata);
          anteriores.set(vecino, actual);
        }
      }
    }

    if ((distancias.get(destino) ?? Infinity) === Infinity) {
      throw new ErrorDeNegocio(`No hay ruta disponible de '${origen}' a '${destino}'`);
    }
    const ruta = [destino];
    while (ruta[0] !== origen) {
      const anterior = anteriores.get(ruta[0]);
      if (!anterior) throw new ErrorDeNegocio('Ruta incompleta');
      ruta.unshift(anterior);
    }
    return ruta;
  }

  /** Enumera rutas simples con DFS recursivo, controlando ciclos y profundidad. */
  rutasPosibles(origen: string, destino: string, maxProfundidad = 6, limite = 10): string[][] {
    this.validarNodo(origen);
    this.validarNodo(destino);
    if (maxProfundidad < 1 || limite < 1) {
      throw new ValidacionError('Profundidad y límite deben ser mayores que cero');
    }
    const rutas: string[][] = [];
    this.explorar(origen, destino, [origen], new Set([origen]), maxProfundidad, limite, rutas);
    return rutas;
  }

  registrarRuta(ruta: Ruta): Ruta {
    this.rutas.push(ruta);
    return ruta;
  }

  listarRutas(): Ruta[] {
    return [...this.rutas];
  }

  registrarEntrega(id: string, pedidoId: string, ruta: string[]): Entrega {
    if (this.entregas.has(id)) throw new ValidacionError(`Entrega '${id}' ya registrada`);
    const entrega: Entrega = { id, pedidoId, ruta };
    this.entregas.set(id, entrega);
    return entrega;
  }

  listarEntregas(): Entrega[] {
    return [...this.entregas.values()];
  }

  private validarNodo(nodo: string): void {
    if (!this.grafo.has(nodo)) throw new NoEncontrado(`Nodo '${nodo}' no existe en la red`);
  }

  private explorar(
    actual: string,
    destino: string,
    camino: string[],
    visitados: Set<string>,
    maxProfundidad: number,
    limite: number,
    rutas: string[][],
  ): void {
    if (rutas.length >= limite || camino.length > maxProfundidad) return;
    for (const vecino of this.grafo.get(actual)!.keys()) {
      if (visitados.has(vecino)) continue;
      const nuevoCamino = [...camino, vecino];
      if (vecino === destino) {
        rutas.push(nuevoCamino);
        if (rutas.length >= limite) return;
      } else {
        this.explorar(
          vecino,
          destino,
          nuevoCamino,
          new Set([...visitados, vecino]),
          maxProfundidad,
          limite,
          rutas,
        );
      }
    }
  }
}
