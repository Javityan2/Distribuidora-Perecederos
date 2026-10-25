import { Inject, Injectable } from '@nestjs/common';
import type { InventarioRepository } from './dominio/inventario.repository';
import type { CatalogoRepository } from './dominio/catalogo.repository';
import type { NuevoProducto } from './dominio/entidades';
import { ProductoNoEncontradoError } from './dominio/errores';
import { INVENTARIO_REPOSITORY, CATALOGO_REPOSITORY } from './productos.tokens';

@Injectable()
export class ProductosService {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly inventario: InventarioRepository,
    @Inject(CATALOGO_REPOSITORY) private readonly catalogo: CatalogoRepository,
  ) {}
  listar() {
    return this.inventario.listarProductos();
  }
  async buscar(id: number) {
    const producto = await this.inventario.buscarProducto(id);
    if (!producto) throw new ProductoNoEncontradoError(id);
    return producto;
  }
  crear(datos: NuevoProducto) {
    return this.catalogo.crearProducto(datos);
  }
  async listarLotes(id: number) {
    await this.buscar(id);
    return this.inventario.listarLotesProducto(id);
  }
  listarMermas() {
    return this.catalogo.listarMermas();
  }
}
