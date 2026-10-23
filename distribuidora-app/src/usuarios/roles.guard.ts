import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RolUsuario } from './dominio/entidades';
import type { RequestAutenticada } from './jwt-auth.guard';
export const Roles = (...roles: RolUsuario[]) => SetMetadata('roles', roles);
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(contexto: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<RolUsuario[]>('roles', [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    const usuario = contexto
      .switchToHttp()
      .getRequest<RequestAutenticada>().usuario;
    if (roles && (!usuario || !roles.includes(usuario.rol)))
      throw new ForbiddenException('Tu rol no permite esta operación');
    return true;
  }
}
