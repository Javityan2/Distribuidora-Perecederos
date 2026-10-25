import type { NuevoUsuario, Usuario } from './entidades';

export interface UsuarioConCredencial extends Usuario {
  passwordHash: string;
}

/** La credencial se mantiene fuera de las entidades públicas de usuario. */
export interface CredencialesRepository {
  buscarPorCorreo(correo: string): Promise<UsuarioConCredencial | null>;
  crearConCredencial(
    datos: NuevoUsuario & { passwordHash: string },
  ): Promise<Usuario>;
}
