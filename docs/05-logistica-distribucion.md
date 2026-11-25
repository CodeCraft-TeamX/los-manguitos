# 5. Logística y distribución

**Necesidad:** representar las conexiones entre central, bodegas y sucursales; consultar rutas y administrar entregas.

**Estado:** implementado en `src/model/logistica.ts`.

## Estructuras elegidas

| Dato | Estructura | Uso |
| --- | --- | --- |
| Red | `Map<string, Map<string, number>>` de adyacencia | `grafo[origen][destino] = distancia`. |
| Ruta más corta | Dijkstra con cola de prioridad simple | Entrega de menor distancia total. |
| Rutas alternativas | DFS recursivo con `Set` de visitados | Enumerar caminos simples. |
| Entregas / rutas | `Map<string, Entrega>` y `Ruta[]` | Seguimiento del despacho. |

## Por qué estas estructuras

- La red es un grafo por naturaleza: una sucursal puede tener más de una vía de acceso.
- La adyacencia hace `O(1)` la consulta «¿están conectados A y B?».
- Dijkstra responde la pregunta de negocio con pesos reales (kilómetros de demostración).
- La recursividad es natural para explorar caminos; `visitados` evita ciclos y se limita la profundidad.

## Por qué no otras

- Una matriz de adyacencia desperdicia memoria: la red es dispersa.
- Una lista simple de rutas no permite descubrir conexiones indirectas.
- Un árbol no sirve: una sucursal puede tener más de un padre (rutas alternativas).

## Operaciones previstas y complejidad

| Operación | Complejidad |
| --- | --- |
| `agregarConexion(origen, destino, distancia)` | `O(1)` |
| `vecinos(nodo)` | `O(grado)` |
| `rutaMasCorta(origen, destino)` | Dijkstra (`O(V²)` con la cola simple) |
| `rutasPosibles(origen, destino)` | DFS recursivo, limitado a 10 rutas y profundidad 6 |
| `registrarEntrega(id, pedido, ruta)` | `O(1)` |

## Validaciones

- Nodos inexistentes; distancia `<= 0`; red desconectada (`sin ruta disponible`).
- Ciclos controlados por `visitados` en el DFS; límite de profundidad para no explorar indefinidamente.

## Datos de prueba sugeridos

Nodos: `CENTRAL`, `SUC-CENTRO`, `SUC-SANTA-ANA`, `SUC-SAN-MIGUEL`, `PUERTO-LA-LIBERTAD`. Conexiones: central–centro (12), central–Santa Ana (26), central–San Miguel (48), central–La Libertad (18), centro–La Libertad (14). Ruta esperada a `PUERTO-LA-LIBERTAD`: `CENTRAL → PUERTO-LA-LIBERTAD` (18), más corta que pasar por el centro (26).
