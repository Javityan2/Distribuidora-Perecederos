import { createParamDecorator, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { RequestAutenticada } from '../jwt-auth.guard';

export const UsuarioActual = createParamDecorator(
  (_datos: unknown, contexto: ExecutionContext) => {
    const usuario = contexto
      .switchToHttp()
      .getRequest<RequestAutenticada>().usuario;
    if (!usuario) throw new UnauthorizedException('Credencial requerida');
    return usuario;
  },
);
