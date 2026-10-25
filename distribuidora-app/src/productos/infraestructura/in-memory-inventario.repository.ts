import type { CatalogoRepository } from '../dominio/catalogo.repository';
import type { NuevoProducto } from '../dominio/entidades';
/* eslint-disable @typescript-eslint/require-await -- El adaptador en memoria cumple el contrato asíncrono del repositorio. */
import { InventarioRepository } from '../dominio/inventario.repository';
import {
  Producto,
  Lote,
  Pedido,
  Merma,
  MovimientoSurtido,
  NuevoPedido,
} from '../dominio/entidades';
import {
  LoteNoEncontradoError,
  PedidoNoEncontradoError,
} from '../dominio/errores';

export class InMemoryInventarioRepository
  implements InventarioRepository, CatalogoRepository
{
  private productos: Producto[];
  private lotes: Lote[];
  private pedidos: Pedido[] = [];
  private mermas: Merma[] = [];
  private movimientos: MovimientoSurtido[] = [];
  private cola: Promise<void> = Promise.resolve();

  constructor(
    productos: Producto[] = [],
    lotes: Lote[] = [],
    private readonly ahora = () => new Date(),
  ) {
    this.productos = structuredClone(productos);
    this.lotes = structuredClone(lotes);
  }

  async enTransaccion<T>(operacion: () => Promise<T>): Promise<T> {
    const anterior = this.cola;
    let liberar!: () => void;
    this.cola = new Promise<void>((resolve) => {
      liberar = resolve;
    });
    await anterior;
    const copia = structuredClone({
      productos: this.productos,
      lotes: this.lotes,
      pedidos: this.pedidos,
      mermas: this.mermas,
      movimientos: this.movimientos,
    });
    try {
      return await operacion();
    } catch (error) {
      this.productos = copia.productos;
      this.lotes = copia.lotes;
      this.pedidos = copia.pedidos;
      this.mermas = copia.mermas;
      this.movimientos = copia.movimientos;
      throw error;
    } finally {
      liberar();
    }
  }

  async crearProducto(datos: NuevoProducto) {
    const producto = {
      ...structuredClone(datos),
      id: Math.max(0, ...this.productos.map((p) => p.id)) + 1,
    };
    this.productos.push(producto);
    return structuredClone(producto);
  }
  async listarPedidos(clienteId?: number) {
    return structuredClone(
      this.pedidos
        .filter((p) => clienteId === undefined || p.clienteId === clienteId)
        .sort((a, b) => b.id - a.id),
    );
  }
  async listarProductos() {
    return structuredClone(this.productos);
  }
  async buscarProducto(id: number) {
    return structuredClone(this.productos.find((p) => p.id === id) ?? null);
  }
  async listarLotesProducto(id: number) {
    return structuredClone(this.lotes.filter((l) => l.productoId === id));
  }
  async buscarLote(id: number) {
    return structuredClone(this.lotes.find((l) => l.id === id) ?? null);
  }
  async crearLote(datos: Omit<Lote, 'id'>) {
    const lote = {
      ...structuredClone(datos),
      id: Math.max(0, ...this.lotes.map((l) => l.id)) + 1,
    };
    this.lotes.push(lote);
    return structuredClone(lote);
  }
  async actualizarLote(lote: Lote) {
    const indice = this.lotes.findIndex((l) => l.id === lote.id);
    if (indice < 0) throw new LoteNoEncontradoError(lote.id);
    this.lotes[indice] = structuredClone(lote);
    return structuredClone(lote);
  }
  async crearPedido(datos: NuevoPedido) {
    const pedido: Pedido = {
      ...datos,
      id: Math.max(0, ...this.pedidos.map((p) => p.id)) + 1,
      fecha: this.ahora(),
      estado: 'recibido',
    };
    this.pedidos.push(structuredClone(pedido));
    return structuredClone(pedido);
  }
  async buscarPedido(id: number) {
    return structuredClone(this.pedidos.find((p) => p.id === id) ?? null);
  }
  async actualizarPedido(pedido: Pedido) {
    const indice = this.pedidos.findIndex((p) => p.id === pedido.id);
    if (indice < 0) throw new PedidoNoEncontradoError(pedido.id);
    this.pedidos[indice] = structuredClone(pedido);
    return structuredClone(pedido);
  }
  async registrarSurtido(movimiento: MovimientoSurtido) {
    this.movimientos.push(structuredClone(movimiento));
  }
  async registrarMerma(datos: Omit<Merma, 'id'>) {
    const merma = { ...structuredClone(datos), id: this.mermas.length + 1 };
    this.mermas.push(merma);
    return structuredClone(merma);
  }
  async listarMermas() {
    return structuredClone(this.mermas);
  }
  async listarSurtidos() {
    return structuredClone(this.movimientos);
  }
}
