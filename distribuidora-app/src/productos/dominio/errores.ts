export class ProductoNoEncontradoError extends Error {
  constructor(productoId: number) {
    super(`No existe el producto ${productoId}`);
  }
}

export class PedidoNoEncontradoError extends Error {
  constructor(pedidoId: number) {
    super(`No existe el pedido ${pedidoId}`);
  }
}

export class LoteNoEncontradoError extends Error {
  constructor(loteId: number) {
    super(`No existe el lote ${loteId}`);
  }
}

export class InventarioInsuficienteError extends Error {
  constructor(productoId: number, solicitado: number, disponible: number) {
    super(
      `Producto ${productoId}: solicitado ${solicitado}, disponible ${disponible}`,
    );
  }
}

export class ProductoCaducadoError extends Error {
  constructor(productoId: number, loteId: number) {
    super(`El lote ${loteId} del producto ${productoId} ya esta caducado`);
  }
}

export class PedidoYaSurtidoError extends Error {
  constructor(pedidoId: number) {
    super(`El pedido ${pedidoId} ya fue surtido`);
  }
}

export class CantidadInvalidaError extends Error {
  constructor(cantidad: number) {
    super(`La cantidad ${cantidad} debe ser finita y mayor que cero`);
  }
}

export class StockMinimoComprometidoError extends Error {
  constructor(productoId: number, minimo: number) {
    super(
      `El surtido del producto ${productoId} dejaría menos del stock mínimo ${minimo}`,
    );
  }
}

export class FechaInvalidaError extends Error {
  constructor() {
    super('Las fechas deben ser válidas y la caducidad posterior al ingreso');
  }
}
