import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'node:crypto';
import type { UsuarioRepository } from '../dominio/usuario.repository';
import type { Usuario, NuevoUsuario } from '../dominio/entidades';
import { UsuarioOrmEntity } from './usuario.orm-entity';
import { PasswordService } from './password.service';
@Injectable()
export class MysqlUsuarioRepository implements UsuarioRepository {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly repo: Repository<UsuarioOrmEntity>,
    private readonly passwords: PasswordService,
  ) {}
  private convertir(u: UsuarioOrmEntity): Usuario {
    return {
      id: u.id,
      nombre: u.nombre,
      correo: u.correo,
      rol: u.rol,
      activo: u.activo,
    };
  }
  async listar() {
    return (await this.repo.find({ order: { id: 'ASC' } })).map((u) =>
      this.convertir(u),
    );
  }
  async buscarPorId(id: number) {
    const u = await this.repo.findOneBy({ id });
    return u ? this.convertir(u) : null;
  }
  async crear(datos: NuevoUsuario) {
    // El contrato crea un perfil sin credencial conocida. El registro público usa RegistroUsuarioService.
    const passwordHash = await this.passwords.transformar(
      randomBytes(32).toString('hex'),
    );
    return this.convertir(
      await this.repo.save(
        this.repo.create({
          ...datos,
          passwordHash,
          rol: 'cliente',
          activo: true,
        }),
      ),
    );
  }
  async actualizar(id: number, datos: Partial<NuevoUsuario>) {
    const u = await this.repo.findOneBy({ id });
    if (!u) return null;
    if (datos.nombre !== undefined) u.nombre = datos.nombre;
    if (datos.correo !== undefined) u.correo = datos.correo;
    return this.convertir(await this.repo.save(u));
  }
  async eliminar(id: number) {
    const u = await this.repo.findOneBy({ id });
    if (!u) return null;
    const anterior = this.convertir(u);
    await this.repo.remove(u);
    return anterior;
  }
}
