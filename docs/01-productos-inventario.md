# 1. Gestión de productos e inventario

**Necesidad:** registrar productos, categorías y existencias, y conservar el historial de entradas y salidas.

**Estado:** implementado en `src/model/productos.ts`.

**Nota de implementación:** el stock efectivo es propiedad de `GestorUbicaciones` (fuente única de verdad); `Producto` no duplica el número. El historial de movimientos queda como auditoría.

## Estructuras elegidas

| Dato | Estructura | Uso |
| --- | --- | --- |
| Catálogo | `Map<string, Producto>` (clave = `sku`) | Alta, consulta y actualización por identificador. |
| Movimientos | `Map<string, Movimiento[]>` (clave = `sku`) | Historial cronológico de entradas y salidas. |
| Categorías | `Map<string, string[]>` + recursividad | Categorías con subcategorías de profundidad variable. |

## Por qué estas estructuras

- `Map` da acceso `O(1)` promedio por SKU, que es único e inmutable; evita recorrer el catálogo y controlar duplicados a mano.
- El arreglo de movimientos solo crece con `push` (`O(1)` amortizado) y conserva el orden de ocurrencia, base del módulo de seguimiento.
- El árbol de categorías se recorre con `nombresDelArbol()`, recursivo y con un `Set` de visitados para evitar ciclos.

## Por qué no otras

- Un arreglo de productos exigiría búsqueda lineal `O(n)` por SKU.
- Una pila o cola no aplica al stock: los productos se consultan por identificador; el orden solo importa en el historial.
- Un grafo sería excesivo: las categorías forman un árbol sin rutas alternativas.

## Operaciones previstas y complejidad

| Operación | Complejidad |
| --- | --- |
| `registrarProducto(sku, …)` | `O(1)` + validación de duplicado |
| `consultarProducto(sku)` | `O(1)` |
| `registrarMovimiento(sku, …)` | `O(1)` |
| `movimientos(sku)` | `O(k)` |
| `listarCategoria(categoria)` | `O(n)` recursivo sobre descendientes |

## Validaciones

- SKU vacío o duplicado; categoría no registrada; cantidad de movimiento `<= 0`.
- Catálogo o historial vacío: se devuelve lista vacía, nunca un error por índice.

## Datos de prueba sugeridos

`PR-001` Mango Tommy (12 kg, mínimo 25), `PR-008` Limón pérsico (8 cajas, mínimo 20), `PR-024` Néctar de mango (16 uds., mínimo 30), `PR-015` Aguacate nacional, `PR-031` Pulpa de mango. Categorías: *Frutas frescas* y *Procesados*.
