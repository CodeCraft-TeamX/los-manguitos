/** Errores de negocio que el controlador puede mostrar al operador. */

export class ErrorDeNegocio extends Error {}

export class ValidacionError extends ErrorDeNegocio {}

export class NoEncontrado extends ErrorDeNegocio {}

export class StockInsuficiente extends ErrorDeNegocio {}

export class TransicionInvalida extends ErrorDeNegocio {}
