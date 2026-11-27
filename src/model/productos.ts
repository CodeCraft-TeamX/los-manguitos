/** Funcionalidad 1: catálogo, categorías jerárquicas e historial de movimientos. */

import { NoEncontrado, ValidacionError } from './errores';
import type { Movimiento, Producto, Proveedor } from './tipos';

export class GestorProductos {
  private readonly proveedores = new Map<string, Proveedor>();
  private readonly catalogo = new Map<string, Producto>();
  private readonly historial = new Map<string, Movimiento[]>();
  private readonly categorias = new Map<string, string[]>();

  registrarProveedor(proveedor: Proveedor): Proveedor {
    const id = proveedor.id.trim();
    const nombre = proveedor.nombre.trim();
    if (!id || !nombre) {
      throw new ValidacionError('El proveedor requiere identificador y nombre');
    }
    if (this.proveedores.has(id)) {
      throw new ValidacionError(`El proveedor '${id}' ya existe`);
    }
    const limpio: Proveedor = { id, nombre, contacto: proveedor.contacto.trim() };
    this.proveedores.set(id, limpio);
    return limpio;
  }

  consultarProveedor(id: string): Proveedor {
    const proveedor = this.proveedores.get(id);
    if (!proveedor) throw new NoEncontrado(`Proveedor '${id}' no encontrado`);
    return proveedor;
  }

  listarProveedores(): Proveedor[] {
    return [...this.proveedores.values()];
  }

  registrarCategoria(nombre: string, padre?: string): void {
    if (!nombre.trim()) throw new ValidacionError('La categoría no puede estar vacía');
    if (padre !== undefined && !this.categorias.has(padre)) {
      throw new NoEncontrado(`Categoría padre '${padre}' no registrada`);
    }
    this.categorias.set(nombre, this.categorias.get(nombre) ?? []);
    if (padre !== undefined) {
      const hijos = this.categorias.get(padre)!;
      if (!hijos.includes(nombre)) hijos.push(nombre);
    }
  }

  registrarProducto(producto: Producto): Producto {
    if (!producto.sku.trim() || !producto.nombre.trim()) {
      throw new ValidacionError('El producto requiere SKU y nombre');
    }
    if (this.catalogo.has(producto.sku)) {
      throw new ValidacionError(`El producto '${producto.sku}' ya existe`);
    }
    if (!this.categorias.has(producto.categoria)) {
      throw new NoEncontrado(`Categoría '${producto.categoria}' no registrada`);
    }
    if (producto.proveedorId) {
      this.consultarProveedor(producto.proveedorId);
    }
    if (!Number.isFinite(producto.precio) || producto.precio <= 0) {
      throw new ValidacionError('El precio debe ser mayor que cero');
    }
    if (!Number.isInteger(producto.minimo) || producto.minimo < 0) {
      throw new ValidacionError('El stock mínimo debe ser un entero mayor o igual a cero');
    }
    this.catalogo.set(producto.sku, producto);
    this.historial.set(producto.sku, []);
    return producto;
  }

  consultarProducto(sku: string): Producto {
    const producto = this.catalogo.get(sku);
    if (!producto) throw new NoEncontrado(`Producto '${sku}' no encontrado`);
    return producto;
  }

  listarProductos(): Producto[] {
    return [...this.catalogo.values()];
  }

  listarCategorias(): string[] {
    return [...this.categorias.keys()];
  }

  registrarMovimiento(
    sku: string,
    tipo: Movimiento['tipo'],
    cantidad: number,
    descripcion: string,
    hora: string,
  ): Movimiento {
    this.consultarProducto(sku);
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      throw new ValidacionError('La cantidad debe ser un entero mayor que cero');
    }
    const movimiento: Movimiento = { sku, tipo, cantidad, descripcion, hora };
    this.historial.get(sku)!.push(movimiento);
    return movimiento;
  }

  movimientos(sku: string): Movimiento[] {
    this.consultarProducto(sku);
    return [...this.historial.get(sku)!];
  }

  /** Recorrido recursivo del árbol de categorías con protección de ciclos. */
  listarCategoria(categoria: string): Producto[] {
    if (!this.categorias.has(categoria)) {
      throw new NoEncontrado(`Categoría '${categoria}' no registrada`);
    }
    const nombres = this.nombresDelArbol(categoria, new Set<string>());
    return this.listarProductos().filter((producto) => nombres.has(producto.categoria));
  }

  private nombresDelArbol(categoria: string, visitados: Set<string>): Set<string> {
    if (visitados.has(categoria)) return new Set<string>();
    visitados.add(categoria);
    const nombres = new Set<string>([categoria]);
    for (const hijo of this.categorias.get(categoria) ?? []) {
      for (const nombre of this.nombresDelArbol(hijo, visitados)) nombres.add(nombre);
    }
    return nombres;
  }
}
