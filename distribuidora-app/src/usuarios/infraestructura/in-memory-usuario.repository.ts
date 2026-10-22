/* eslint-disable @typescript-eslint/require-await -- El adaptador en memoria cumple el contrato asíncrono del repositorio. */
import { UsuarioRepository } from '../dominio/usuario.repository';
import { NuevoUsuario, Usuario } from '../dominio/entidades';

export class InMemoryUsuarioRepository implements UsuarioRepository {
  private usuarios = new Map<number, Usuario>();
  private siguienteId = 1;
  async listar() {
    return structuredClone([...this.usuarios.values()]);
  }
  async buscarPorId(id: number) {
    return structuredClone(this.usuarios.get(id) ?? null);
  }
  async crear(datos: NuevoUsuario) {
    const usuario: Usuario = {
      ...datos,
      id: this.siguienteId++,
      rol: 'cliente',
      activo: true,
    };
    this.usuarios.set(usuario.id, structuredClone(usuario));
    return structuredClone(usuario);
  }
  async actualizar(id: number, datos: Partial<NuevoUsuario>) {
    const usuario = this.usuarios.get(id);
    if (!usuario) return null;
    const actualizado = { ...usuario, ...datos };
    this.usuarios.set(id, structuredClone(actualizado));
    return structuredClone(actualizado);
  }
  async eliminar(id: number) {
    const usuario = this.usuarios.get(id);
    if (!usuario) return null;
    this.usuarios.delete(id);
    return structuredClone(usuario);
  }
}
