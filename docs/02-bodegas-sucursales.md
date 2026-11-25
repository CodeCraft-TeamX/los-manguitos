# 2. Administración de bodegas y sucursales

**Necesidad:** controlar existencias por ubicación y gestionar transferencias entre bodegas y sucursales.

**Estado:** implementado en `src/model/ubicaciones.ts`.

## Estructuras elegidas

| Dato | Estructura | Uso |
| --- | --- | --- |
| Stock por ubicación | `Map<string, Map<string, number>>` (`ubicación → sku → cantidad`) | Consulta y ajuste directo del par. |
| Datos de la ubicación | `Map<string, Ubicacion>` | Metadata separada del stock. |
| Transferencias | Arreglo `Transferencia[]` usado como cola FIFO (`push`/`shift`) | Atención por orden de llegada. |

## Por qué estas estructuras

- El diccionario anidado responde la pregunta real del operador: «¿cuántas unidades de `PR-001` hay en la bodega central?» con clave compuesta y acceso `O(1)`.
- La cola FIFO refleja la regla operativa: la transferencia solicitada primero se procesa primero.

## Por qué no otras

- Una lista plana de registros exigiría recorrerla en cada consulta y controlar duplicados del par `(ubicación, sku)`.
- Una pila LIFO priorizaría la última solicitud y dejaría atascadas las antiguas.
- Un grafo pertenece al módulo logístico; usarlo aquí mezclaría responsabilidades.

En Python se usa `collections.deque` (`popleft` es `O(1)`). En JavaScript `Array.shift()` es `O(n)`, pero el dataset de demostración tiene tres transferencias; si el volumen creciera, se sustituiría por una lista enlazada o un arreglo circular.

## Operaciones previstas y complejidad

| Operación | Complejidad |
| --- | --- |
| `registrarUbicacion(id, …)` | `O(1)` |
| `consultarStock(ubicacion, sku)` | `O(1)` |
| `ajustarStock(ubicacion, sku, delta)` | `O(1)` |
| `solicitarTransferencia(...)` | `O(1)` (encola) + validación |
| `procesarSiguienteTransferencia()` | `O(n)` por `shift` + dos ajustes |

## Validaciones

- Ubicación inexistente; transferencia entre la misma ubicación; cantidad `<= 0`.
- Stock insuficiente en el origen: se rechaza antes de encolar.
- Cola vacía al procesar: mensaje explícito, sin error de índice.

## Datos de prueba sugeridos

`CENTRAL`, `SUC-CENTRO`, `SUC-SANTA-ANA`, `SUC-SAN-MIGUEL` y `PUERTO-LA-LIBERTAD`. Transferencias: `TR-2026-019` (24 cajas de limón a Santa Ana), `TR-2026-018`, `TR-2026-017`.
