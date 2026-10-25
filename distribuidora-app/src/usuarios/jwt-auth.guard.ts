import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { Usuario } from './dominio/entidades';
import type { UsuarioRepository } from './dominio/usuario.repository';
import { USUARIO_REPOSITORY } from './usuarios.tokens';
import { ES_PUBLICO } from './decoradores/publico.decorator';
export type RequestAutenticada = Request & { usuario?: Usuario };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepository,
  ) {}
  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(ES_PUBLICO, [
        contexto.getHandler(),
        contexto.getClass(),
      ])
    )
      return true;
    const request = contexto.switchToHttp().getRequest<RequestAutenticada>();
    const token = request.headers.authorization?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) throw new UnauthorizedException('Credencial requerida');
    let payload: { sub: number; exp: number };
    try {
      payload = await this.jwt.verifyAsync<{ sub: number; exp: number }>(token);
      if (
        !Number.isSafeInteger(payload.sub) ||
        payload.sub <= 0 ||
        !Number.isSafeInteger(payload.exp)
      )
        throw new Error('Credencial incompleta');
    } catch {
      throw new UnauthorizedException('Credencial inválida o vencida');
    }
    const usuario = await this.usuarios.buscarPorId(payload.sub);
    if (!usuario || !usuario.activo)
      throw new UnauthorizedException('Usuario no disponible');
    request.usuario = usuario;
    return true;
  }
}
