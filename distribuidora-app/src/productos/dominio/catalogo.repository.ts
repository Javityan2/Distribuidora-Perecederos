import type { Merma, NuevoProducto, Pedido, Producto } from './entidades';

/** Operaciones de catálogo y consulta que complementan el contrato de inventario. */
export interface CatalogoRepository {
  crearProducto(datos: NuevoProducto): Promise<Producto>;
  listarPedidos(clienteId?: number): Promise<Pedido[]>;
  listarMermas(): Promise<Merma[]>;
}
