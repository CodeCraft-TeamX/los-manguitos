/** Estado transitorio de filtros y selectores de la interfaz. */

export interface EstadoUI {
  productosBusqueda: string;
  productosCategoria: string;
  productosEstado: string;
  ventasClienteFiltro: string;
  pedidosBusqueda: string;
  pedidosEstado: string;
  pedidosUbicacion: string;
  rutaOrigen: string;
  rutaDestino: string;
  seguimientoTipo: string;
  seguimientoDesde: string;
  seguimientoHasta: string;
}

export function crearEstadoUI(): EstadoUI {
  return {
    productosBusqueda: '',
    productosCategoria: '',
    productosEstado: '',
    ventasClienteFiltro: '',
    pedidosBusqueda: '',
    pedidosEstado: '',
    pedidosUbicacion: '',
    rutaOrigen: 'CENTRAL',
    rutaDestino: 'PUERTO-LA-LIBERTAD',
    seguimientoTipo: '',
    seguimientoDesde: '',
    seguimientoHasta: '',
  };
}
