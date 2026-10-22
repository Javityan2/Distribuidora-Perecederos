import {
  Producto,
  Lote,
  Pedido,
  Merma,
  NuevoPedido,
  MovimientoSurtido,
} from './entidades';

// La interfaz que el Service conoce. No sabe si detras hay un Map en memoria o MySQL.
// Todos los metodos devuelven Promise aunque hoy el Map no lo necesite:
// el contrato se diseña para el caso mas lento.
export interface InventarioRepository {
  // Todo el caso de uso se confirma o se revierte; evita surtidos concurrentes.
  enTransaccion<T>(operacion: () => Promise<T>): Promise<T>;
  listarProductos(): Promise<Producto[]>;
  buscarProducto(productoId: number): Promise<Producto | null>;

  // Lotes
  listarLotesProducto(productoId: number): Promise<Lote[]>;
  buscarLote(loteId: number): Promise<Lote | null>;
  crearLote(lote: Omit<Lote, 'id'>): Promise<Lote>;
  actualizarLote(lote: Lote): Promise<Lote>;

  // Pedidos
  crearPedido(pedido: NuevoPedido): Promise<Pedido>;
  buscarPedido(pedidoId: number): Promise<Pedido | null>;
  actualizarPedido(pedido: Pedido): Promise<Pedido>;

  // Surtido FEFO (First Expired, First Out)
  registrarSurtido(movimiento: MovimientoSurtido): Promise<void>;

  // Mermas
  registrarMerma(merma: Omit<Merma, 'id'>): Promise<Merma>;

  /* Consultas de inventario
  existencia(productoId: number, fecha: Date): Promise<number>;
  */
}
