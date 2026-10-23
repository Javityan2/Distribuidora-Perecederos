import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { NuevoUsuario, Usuario } from '../dominio/entidades';
import { UsuarioOrmEntity } from '../infraestructura/usuario.orm-entity';
import { PasswordService } from '../infraestructura/password.service';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class RegistroUsuarioService {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarios: Repository<UsuarioOrmEntity>,
    private readonly passwords: PasswordService,
  ) {}

  async registrar(
    datos: NuevoUsuario & { password: string },
  ): Promise<Usuario> {
    const passwordHash = await this.passwords.transformar(
      datos.password,
    );

    const registro = this.usuarios.create({
      nombre: datos.nombre,
      correo: datos.correo.trim().toLowerCase(),
      passwordHash,
      rol: 'cliente',
      activo: true,
    });

    const guardado = await this.usuarios.save(registro).catch(
        (error: unknown) => {
          if (error instanceof QueryFailedError) {
            const detalle = error.driverError as { code?: string };
      
            if (detalle.code === 'ER_DUP_ENTRY') {
              throw new ConflictException(
                'Ya existe un usuario con ese correo',
              );
            }
          }
      
          throw error;
        },
      );

    return {
      id: guardado.id,
      nombre: guardado.nombre,
      correo: guardado.correo,
      rol: guardado.rol,
      activo: guardado.activo,
    };
  }
}