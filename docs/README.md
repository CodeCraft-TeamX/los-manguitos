# Decisiones de diseño — Estructuras de datos (versión web)

Este directorio documenta las estructuras de datos usadas en `src/model/`, en equivalencia con los documentos del prototipo CLI (`los-manguitos-python/docs/`). Cada archivo responde: qué problema resuelve, por qué la estructura elegida es adecuada, por qué no otra, qué operaciones expone y qué validaciones la acompañan.

La versión web conserva el dataset visual de la interfaz «bonita» (`PR-001` Mango Tommy, `V-2026-0842`, `P-2026-311`, rutas `R-04`…). La lógica está organizada igual que en el CLI: seis gestores coordinados por `Sistema`.

| # | Funcionalidad | Estructuras elegidas | Módulo | Detalle |
| --- | --- | --- | --- | --- |
| 1 | Productos e inventario | `Map` por SKU, lista de movimientos, árbol de categorías con recursividad | `src/model/productos.ts` | [01-productos-inventario.md](01-productos-inventario.md) |
| 2 | Bodegas y sucursales | `Map` anidado, arreglo FIFO de transferencias | `src/model/ubicaciones.ts` | [02-bodegas-sucursales.md](02-bodegas-sucursales.md) |
| 3 | Clientes y ventas | `Map` de clientes, lista append-only, índice por cliente, pila LIFO | `src/model/ventas.ts` | [03-clientes-ventas.md](03-clientes-ventas.md) |
| 4 | Pedidos | Arreglo FIFO, `Map` índice, pila de estados con `enum` | `src/model/pedidos.ts` | [04-pedidos.md](04-pedidos.md) |
| 5 | Logística y distribución | Grafo de adyacencia, Dijkstra, DFS recursivo | `src/model/logistica.ts` | [05-logistica-distribucion.md](05-logistica-distribucion.md) |
| 6 | Seguimiento de operaciones | Lista append-only, índice por tipo, árbol por correlativo | `src/model/seguimiento.ts` | [06-seguimiento-operaciones.md](06-seguimiento-operaciones.md) |

`src/model/sistema.ts` coordina los seis gestores; `src/controller/` es la interfaz (navegación por hash y acciones) y `src/model/datos.ts` carga el dataset de demostración.

## Principios comunes

- Toda estructura responde una necesidad real del negocio; no se incluye una sola «por cumplir el requisito».
- Las claves de consulta son identificadores estables (`sku`, `clienteId`, `pedidoId`, `ubicacion`).
- Las entradas inválidas y las operaciones sobre estructuras vacías se validan antes de mutar el estado.
- Los eventos de seguimiento se registran con `push`, nunca se reescriben.
- Las vistas (`src/view/`) solo presentan marcado; la lógica de negocio vive en `src/model/`.
