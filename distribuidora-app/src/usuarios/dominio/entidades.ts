// Sistema de roles: administrador almacenista y cliente
export type RolUsuario = 'administrador' | 'almacenista' | 'cliente';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  activo: boolean;
}

// El registro asigna el identificador, el rol inicial y el estado activo.
export type NuevoUsuario = Omit<Usuario, 'id' | 'rol' | 'activo'>;
