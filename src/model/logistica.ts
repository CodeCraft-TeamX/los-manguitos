/** Funcionalidad 5: grafo de la red, Dijkstra, DFS recursivo y entregas. */

import { ErrorDeNegocio, NoEncontrado, ValidacionError } from './errores';
import type { Entrega, Ruta } from './tipos';

class MinHeap {
  private readonly datos: Array<[number, string]> = [];

  get size(): number {
    return this.datos.length;
  }

  push(distancia: number, nodo: string): void {
    this.datos.push([distancia, nodo]);
    let idx = this.datos.length - 1;
    while (idx > 0) {
      const padre = (idx - 1) >> 1;
      if (this.datos[padre][0] <= this.datos[idx][0]) break;
      [this.datos[padre], this.datos[idx]] = [this.datos[idx], this.datos[padre]];
      idx = padre;
    }
  }

  pop(): [number, string] {
    const min = this.datos[0];
    const ultimo = this.datos.pop()!;
    if (this.datos.length > 0) {
      this.datos[0] = ultimo;
      let idx = 0;
      const len = this.datos.length;
      while (true) {
        const izq = idx * 2 + 1;
        const der = izq + 1;
        let menor = idx;
        if (izq < len && this.datos[izq][0] < this.datos[menor][0]) menor = izq;
        if (der < len && this.datos[der][0] < this.datos[menor][0]) menor = der;
        if (menor === idx) break;
        [this.datos[idx], this.datos[menor]] = [this.datos[menor], this.datos[idx]];
        idx = menor;
      }
    }
    return min;
  }
}

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

  /** Dijkstra con min-heap binario: O((V + E) log V). */
  rutaMasCorta(origen: string, destino: string): string[] {
    this.validarNodo(origen);
    this.validarNodo(destino);
    const distancias = new Map<string, number>([...this.grafo.keys()].map((nodo) => [nodo, Infinity]));
    const anteriores = new Map<string, string>();
    const cola = new MinHeap();
    distancias.set(origen, 0);
    cola.push(0, origen);

    while (cola.size > 0) {
      const [distancia, actual] = cola.pop();
      if (distancia > (distancias.get(actual) ?? Infinity)) continue;
      if (actual === destino) break;
      for (const [vecino, peso] of this.grafo.get(actual) ?? []) {
        const candidata = distancia + peso;
        if (candidata < (distancias.get(vecino) ?? Infinity)) {
          distancias.set(vecino, candidata);
          anteriores.set(vecino, actual);
          cola.push(candidata, vecino);
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

  /** Suma las distancias de un camino válido en el grafo. */
  distanciaRuta(camino: string[]): number {
    let total = 0;
    for (let i = 0; i < camino.length - 1; i++) {
      const peso = this.grafo.get(camino[i])?.get(camino[i + 1]);
      if (peso === undefined) {
        throw new ErrorDeNegocio(`No hay conexión directa entre '${camino[i]}' y '${camino[i + 1]}'`);
      }
      total += peso;
    }
    return total;
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
