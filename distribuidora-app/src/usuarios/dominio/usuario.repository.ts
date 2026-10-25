import type { Usuario, NuevoUsuario } from './entidades';

/** Contrato de persistencia de perfiles, independiente de credenciales y HTTP. */
export interface UsuarioRepository {
  listar(): Promise<Usuario[]>;
  buscarPorId(id: number): Promise<Usuario | null>;
  crear(datos: NuevoUsuario): Promise<Usuario>;
  actualizar(id: number, datos: Partial<NuevoUsuario>): Promise<Usuario | null>;
  eliminar(id: number): Promise<Usuario | null>;
}
