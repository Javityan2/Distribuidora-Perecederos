import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { InventarioService } from './dominio/inventario.service';
import type { InventarioRepository } from './dominio/inventario.repository';
import type { CatalogoRepository } from './dominio/catalogo.repository';
import type { NuevoPedido } from './dominio/entidades';
import { PedidoNoEncontradoError } from './dominio/errores';
import { INVENTARIO_REPOSITORY, CATALOGO_REPOSITORY } from './productos.tokens';
import { UsuariosService } from '../usuarios/usuarios.service';
import type { Usuario } from '../usuarios/dominio/entidades';

/** Coordinación de identidad y propiedad del pedido, fuera del dominio de inventario. */
@Injectable()
export class PedidosService {
  constructor(
    private readonly inventario: InventarioService,
    private readonly usuarios: UsuariosService,
    @Inject(INVENTARIO_REPOSITORY) private readonly repo: InventarioRepository,
    @Inject(CATALOGO_REPOSITORY) private readonly catalogo: CatalogoRepository,
  ) {}
  listar(usuario: Usuario) {
    return this.catalogo.listarPedidos(
      usuario.rol === 'cliente' ? usuario.id : undefined,
    );
  }
  async crear(datos: NuevoPedido, usuario: Usuario) {
    if (usuario.rol === 'cliente' && datos.clienteId !== usuario.id)
      throw new ForbiddenException('Solo puedes crear tus propios pedidos');
    await this.usuarios.buscarClienteActivo(datos.clienteId);
    return this.inventario.crearPedido(datos);
  }
  async buscar(id: number, usuario: Usuario) {
    const pedido = await this.repo.buscarPedido(id);
    if (!pedido) throw new PedidoNoEncontradoError(id);
    if (usuario.rol === 'cliente' && pedido.clienteId !== usuario.id)
      throw new ForbiddenException('El pedido pertenece a otro cliente');
    return pedido;
  }
}
