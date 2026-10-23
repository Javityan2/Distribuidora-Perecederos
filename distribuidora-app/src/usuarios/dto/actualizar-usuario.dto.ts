import { RolUsuario } from '../dominio/entidades';

// Lo que NO esta aqui es la parte importante: nada de id, creadaEn,
// y sobre todo nada de estado. Eso lo decide el Service, no quien
// manda la peticion.
export interface ActualizarUsuarioDto {
  nombre: string;
  correo: string;
  rol: RolUsuario;
  activo: boolean;
}
