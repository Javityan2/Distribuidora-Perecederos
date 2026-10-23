import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request } from 'express';
import type { Usuario } from './dominio/entidades';
import { UsuarioOrmEntity } from './infraestructura/usuario.orm-entity';

export type RequestAutenticada = Request & {
  usuario?: Usuario;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarios: Repository<UsuarioOrmEntity>,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const request = contexto.switchToHttp().getRequest<RequestAutenticada>();

    const coincidencia =
      request.headers.authorization?.match(/^Bearer (\S+)$/i);

    if (!coincidencia) {
      throw new UnauthorizedException('Credencial requerida');
    }

    let payload: { sub: number };

    try {
      payload = await this.jwt.verifyAsync<{ sub: number }>(coincidencia[1]);

      if (!Number.isSafeInteger(payload.sub) || payload.sub <= 0) {
        throw new Error('Identificador inválido');
      }
    } catch {
      throw new UnauthorizedException('Credencial inválida o vencida');
    }

    const usuario = await this.usuarios.findOneBy({
      id: payload.sub,
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Usuario no disponible');
    }

    request.usuario = {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      activo: usuario.activo,
    };

    return true;
  }
}
