# 4. Administración de pedidos

**Necesidad:** registrar pedidos, consultar estados y organizar la atención y el despacho.

**Estado:** implementado en `src/model/pedidos.ts`.

## Estructuras elegidas

| Dato | Estructura | Uso |
| --- | --- | --- |
| Pedidos en espera | `Pedido[]` como cola FIFO (`push`/`shift`) | Atención por orden de llegada. |
| Índice de pedidos | `Map<string, Pedido>` | Consulta de estado por ID. |
| Historial de estados | `Map<string, EstadoPedido[]>` usado como pila | Deshacer el último cambio. |

Ciclo permitido: `Nuevo → Confirmado → Preparando → Listo → Despachado`, con `Cancelado` como salida alternativa. Los estados se modelan con `enum EstadoPedido` (posible gracias a haber quitado `erasableSyntaxOnly` del `tsconfig.json`).

## Por qué estas estructuras

- La cola FIFO representa la regla de atención justa: quien pide primero, se prepara primero.
- El `Map` resuelve «¿en qué estado está el pedido X?» sin recorrer la cola, que además se va vaciando.
- La pila de estados permite corregir un cambio volviendo exactamente al anterior (`pop()`).

## Por qué no otras

- `Array.shift()` desplaza los elementos (`O(n)`); con `deque` en Python es `O(1)`. El volumen del prototipo es pequeño, pero se documenta la limitación.
- Un heap por prioridad no aplica: el caso no define urgencias, solo orden de llegada.
- Una cola para el historial devolvería el estado más antiguo al deshacer.

## Operaciones previstas y complejidad

| Operación | Complejidad |
| --- | --- |
| `registrarPedido(...)` | `O(1)` |
| `consultarPedido(id)` | `O(1)` |
| `atenderSiguiente()` | `O(n)` (`shift`) + transición |
| `cambiarEstado(id, nuevo)` | `O(1)` + validación |
| `deshacerCambio(id)` | `O(1)` |

## Validaciones

- Pedido duplicado o inexistente; cola vacía; historial vacío al deshacer.
- Transiciones inválidas (por ejemplo, `Nuevo → Despachado` sin preparación).
- Deshacer restaura el estado, pero no reinserta el pedido en la cola.

## Datos de prueba sugeridos

`P-2026-311` (Nuevo), `P-2026-310` y `P-2026-309` (Preparando), `P-2026-308` (Listo), `P-2026-307` (Confirmado). Recorrido de demostración: atender el primero, pasar a `Listo` y deshacer el cambio.
