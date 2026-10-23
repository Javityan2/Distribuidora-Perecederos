import { Usuario, NuevoUsuario } from './entidades';

// La interfaz que el Service conoce. No sabe si detras hay un Map en
// memoria o MySQL: ese es el punto de la Sesion 7.
//
// Todos los metodos devuelven Promise aunque hoy el Map no lo necesite:
// el contrato se disena para el caso mas lento.
export interface UsuarioRepository {
  listar(): Promise<Usuario[]>;
  buscarPorId(id: number): Promise<Usuario | null>;
  crear(datos: NuevoUsuario): Promise<Usuario>;
  actualizar(id: number, datos: Partial<NuevoUsuario>): Promise<Usuario | null>;
  eliminar(id: number): Promise<Usuario | null>;
}
