import { Inject, Injectable } from '@nestjs/common';
import type { NuevoUsuario, Usuario } from '../dominio/entidades';
import type { CredencialesRepository } from '../dominio/credenciales.repository';
import { CREDENCIALES_REPOSITORY } from '../usuarios.tokens';
import { PasswordService } from '../infraestructura/password.service';

@Injectable()
export class RegistroUsuarioService {
  constructor(
    @Inject(CREDENCIALES_REPOSITORY)
    private readonly repo: CredencialesRepository,
    private readonly passwords: PasswordService,
  ) {}
  async registrar(
    datos: NuevoUsuario & { password: string },
  ): Promise<Usuario> {
    return this.repo.crearConCredencial({
      nombre: datos.nombre.trim(),
      correo: datos.correo.trim().toLowerCase(),
      passwordHash: await this.passwords.transformar(datos.password),
    });
  }
}
