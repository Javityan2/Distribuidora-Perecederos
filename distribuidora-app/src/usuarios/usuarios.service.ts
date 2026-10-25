import { Inject, Injectable } from '@nestjs/common';
import type { UsuarioRepository } from './dominio/usuario.repository';
import type { Usuario } from './dominio/entidades';
import {
  UsuarioInactivoError,
  UsuarioNoEncontradoError,
} from './dominio/errores';
import { USUARIO_REPOSITORY } from './usuarios.tokens';

@Injectable()
export class UsuariosService {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly repo: UsuarioRepository,
  ) {}
  listar(): Promise<Usuario[]> {
    return this.repo.listar();
  }
  async buscarClienteActivo(id: number): Promise<Usuario> {
    const usuario = await this.repo.buscarPorId(id);
    if (!usuario || usuario.rol !== 'cliente')
      throw new UsuarioNoEncontradoError(id);
    if (!usuario.activo) throw new UsuarioInactivoError(id);
    return usuario;
  }
}
