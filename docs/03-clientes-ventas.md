# 3. Gestión de clientes y ventas

**Necesidad:** registrar clientes, ventas, cantidades, totales y cancelaciones.

**Estado:** implementado en `src/model/ventas.ts`.

## Estructuras elegidas

| Dato | Estructura | Uso |
| --- | --- | --- |
| Clientes | `Map<string, Cliente>` (clave = `clienteId`) | Alta y consulta rápida. |
| Ventas | `Venta[]` (solo `push`) | Registro cronológico y auditoría. |
| Ventas por cliente | `Map<string, string[]>` (`clienteId → ventaIds`) | Historial de un cliente sin recorrer todo. |
| Cancelaciones | `Venta[]` usada como pila LIFO (`push`/`pop`) | Deshacer la última venta. |

## Por qué estas estructuras

- El cliente se consulta siempre por su ID: `Map` da `O(1)` y evita duplicados.
- Las ventas fluyen en orden cronológico; el arreglo conserva ese orden sin inserciones por medio.
- La pila modela exactamente «cancelar la última venta»: `pop()` devuelve la operación más reciente.

## Por qué no otras

- Un `Map` para ventas ayudaría a buscar por ID, pero no daría el orden del informe; por eso se combina con el arreglo y el índice.
- Una cola FIFO cancelaría la venta más antigua, no la última.
- Un árbol ordenado por total no responde ninguna pregunta del caso.

## Operaciones previstas y complejidad

| Operación | Complejidad |
| --- | --- |
| `registrarCliente(id, …)` | `O(1)` |
| `registrarVenta(venta)` | `O(1)` + índice |
| `ventasCliente(id)` | `O(v)` sobre las ventas del cliente |
| `cancelarUltimaVenta()` | `O(1)` |
| `totalVendido()` | `O(n)` excluyendo canceladas |

## Validaciones

- Cliente inexistente, venta duplicada, sin artículos o con total `<= 0`.
- Pila vacía al cancelar: mensaje claro.
- La venta cancelada se mantiene en el registro con `cancelada = true`.

## Datos de prueba sugeridos

Clientes `CLI-01`…`CLI-05`. Ventas `V-2026-0842` a `V-2026-0838`, por ejemplo `V-2026-0842`: Mercado La Ceiba, 4 artículos, $186.00, 10:42 a. m.
