import { ErrorDeDominio } from '../../dominio/error-de-dominio';

export class ProductoNoEncontradoError extends ErrorDeDominio {
  constructor(productoId: number) {
    super(`No existe el producto ${productoId}`);
  }
}

export class PedidoNoEncontradoError extends ErrorDeDominio {
  constructor(pedidoId: number) {
    super(`No existe el pedido ${pedidoId}`);
  }
}

export class LoteNoEncontradoError extends ErrorDeDominio {
  constructor(loteId: number) {
    super(`No existe el lote ${loteId}`);
  }
}

export class InventarioInsuficienteError extends ErrorDeDominio {
  constructor(productoId: number, solicitado: number, disponible: number) {
    super(
      `Producto ${productoId}: solicitado ${solicitado}, disponible ${disponible}`,
    );
  }
}

export class ProductoCaducadoError extends ErrorDeDominio {
  constructor(productoId: number, loteId?: number) {
    super(
      loteId
        ? `El lote ${loteId} del producto ${productoId} ya está caducado`
        : `El lote que se intenta registrar para el producto ${productoId} ya está caducado`,
    );
  }
}

export class PedidoYaSurtidoError extends ErrorDeDominio {
  constructor(pedidoId: number) {
    super(`El pedido ${pedidoId} ya fue surtido`);
  }
}

export class CantidadInvalidaError extends ErrorDeDominio {
  constructor(cantidad: number) {
    super(
      `La cantidad ${cantidad} debe ser finita, positiva, de hasta tres decimales y no superar 999999999.999`,
    );
  }
}

export class StockMinimoComprometidoError extends ErrorDeDominio {
  constructor(productoId: number, minimo: number) {
    super(
      `El surtido del producto ${productoId} dejaría menos del stock mínimo ${minimo}`,
    );
  }
}

export class FechaInvalidaError extends ErrorDeDominio {
  constructor() {
    super('Las fechas deben ser válidas y la caducidad posterior al ingreso');
  }
}
