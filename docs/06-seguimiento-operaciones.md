# 6. Seguimiento de operaciones

**Necesidad:** mantener el registro de movimientos, ventas, pedidos, transferencias y despachos.

**Estado:** implementado en `src/model/seguimiento.ts`.

## Estructuras elegidas

| Dato | Estructura | Uso |
| --- | --- | --- |
| Registro de eventos | `Evento[]` append-only | Bitácora cronológica inmutable. |
| Índice por tipo | `Map<string, Evento[]>` | Filtrar sin escanear todo el registro. |
| Consultas por rango | Árbol binario de búsqueda por correlativo | Recorrido recursivo con poda de ramas. |

Cada `Evento` lleva hora de presentación, tipo, icono, detalle, ubicación, responsable y referencia. Los seis gestores emiten eventos hacia aquí.

## Por qué estas estructuras

- El registro solo crece con `push` y nunca reescribe el pasado, lo que facilita auditoría.
- El índice por tipo evita recorrer toda la bitácora cuando solo se piden despachos o ventas.
- El árbol mantiene los eventos ordenados **mientras se insertan**, permitiendo rangos sin ordenar cada vez. El recorrido usa recursividad.

En la web la hora es texto (`10:42 a. m.`), así que el árbol se ordena por un correlativo creciente asignado al registrar, no por la cadena de texto. Es el equivalente al `timestamp` del CLI.

## Por qué no otras

- Un `Map` plano por ID no conserva el orden temporal; exigiría ordenar en cada consulta.
- Una pila o cola descartaría eventos al consultarlos: son estructuras de trabajo, no de auditoría.
- Un arreglo ordenado con búsqueda binaria también resolvería los rangos y es más simple; se elige árbol para practicar inserciones dinámicas y recursividad.

## Operaciones previstas y complejidad

| Operación | Complejidad |
| --- | --- |
| `registrarEvento(evento)` | `O(1)` + `O(log n)` inserción en el árbol |
| `eventosPorTipo(tipo)` | `O(k)` usando el índice |
| `eventosEntre(desde, hasta)` | `O(log n + k)` con árbol balanceado |
| `ultimosEventos(n)` | `O(n)` sobre el final del arreglo |
| `resumenPorTipo()` | `O(t)` sobre los tipos registrados |

## Validaciones

- Evento sin tipo o sin referencia: se rechaza antes de mutar el registro.
- Rango invertido (`desde > hasta`): mensaje explícito.
- Registro vacío: devuelve lista vacía, nunca error.
- Correlación: todo evento apunta a una operación existente en su módulo de origen.

## Datos de prueba sugeridos

Eventos `V-0842` (venta), `TR-019` (transferencia), `P-0311` (pedido), `EN-126` (inventario), `R-003` (despacho) y `V-0839` (venta). El controlador permite exportar la bitácora a CSV desde el botón «Exportar registro».
