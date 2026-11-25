# Los Manguitos — Prototipo web (HTML/TS)

Prototipo web del sistema integral de gestión de inventario, ventas y distribución de **Los Manguitos**. La versión CLI (Python) del prototipo se desarrolla en un repositorio aparte (`los-manguitos-python`).

## Estructura

| Ruta | Contenido |
| --- | --- |
| `index.html` | Única entrada del sitio: contenedor `#app` y carga de `src/main.ts`. |
| `src/main.ts` | Punto de entrada: importa estilos, crea el modelo con los datos de ejemplo e inicia el controlador. |
| `src/model/` | Modelo (seis gestores, tipos, errores, dataset y fachada `Sistema`). |
| `src/view/` | Vistas: `layout.ts` (estructura común), un archivo TS por sección y `styles.css`. |
| `src/controller/` | Controlador: `router.ts` (navegación por hash) y `acciones.ts` (interacciones). |
| `docs/` | Justificación de las estructuras de datos por funcionalidad. |
| `vite.config.ts` | Configuración de Vite y del plugin `vite-plugin-singlefile`, que incrusta CSS y JS en el HTML. |
| `tsconfig.json` | Configuración de TypeScript. |
| `public/` | Recursos estáticos (`favicon.svg`, `icons.svg`). |
| `dist/` | Salida del build: un único `index.html` autocontenido listo para entregar. |

La interfaz conserva el diseño de la versión «bonita» y permite recorrer las seis áreas del negocio mediante rutas internas (`#/productos`, `#/ventas`, …). El recorrido de pedidos sigue el ciclo `Nuevo → Confirmado → Preparando → Listo → Despachado`, con referencias como `P-2026-311`.

## Modelo de dominio (equivalente al de la versión CLI)

| # | Funcionalidad | Estructuras elegidas |
| --- | --- | --- |
| 1 | Productos e inventario | `Map` por SKU, lista de movimientos, árbol de categorías con recursividad. |
| 2 | Bodegas y sucursales | Stock anidado `ubicación → sku → cantidad`, arreglo FIFO de transferencias. |
| 3 | Clientes y ventas | `Map` de clientes, registro append-only, índice por cliente, pila LIFO para cancelar la última venta. |
| 4 | Pedidos | Arreglo FIFO de atención, `Map` índice, pila de historial de estados con `enum`. |
| 5 | Logística y distribución | Grafo de adyacencia, Dijkstra para la ruta más corta, DFS recursivo para rutas alternativas. |
| 6 | Seguimiento de operaciones | Lista append-only de eventos, índice por tipo, árbol de búsqueda por correlativo. |

El stock es propiedad de las ubicaciones (fuente única de verdad); el catálogo guarda solo el historial de movimientos. El detalle de cada decisión está en [`docs/README.md`](docs/README.md).

## Cómo ejecutarlo

### Con pnpm (recomendado)

```bash
pnpm install      # instala las dependencias desde pnpm-lock.yaml
pnpm dev          # inicia el servidor de desarrollo de Vite
pnpm build        # genera un único HTML autocontenido en dist/index.html
pnpm preview      # sirve dist/ para verificar el resultado final
```

`pnpm` respeta las versiones fijadas en `package.json` y `pnpm-lock.yaml`. Para agregar una librería nueva usa `pnpm add <paquete>`: actualiza `package.json` y el lockfile. Si solo quieres instalar lo que ya está bloqueado, `pnpm install --frozen-lockfile` no modifica el lockfile.

### Sin pnpm

```bash
npm install
npm run dev
npm run build
```

Las dependencias son `vite`, `vite-plugin-singlefile` y `typescript`. Se necesita Node.js instalado; no se requiere Python ni entorno virtual para esta versión.

## Pruebas

```bash
pnpm exec tsc --noEmit      # comprobación de tipos
pnpm build && pnpm preview  # verificación manual del HTML generado
```

A diferencia del prototipo CLI (34 pruebas con `unittest`), la versión web todavía no tiene pruebas automatizadas: la validación se hace revisando el resultado en el navegador.
