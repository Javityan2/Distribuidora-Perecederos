import { Injectable, Logger } from '@nestjs/common';
import type { NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

export interface PeticionHttp extends Request {
  peticionId?: string;
  inicio?: number;
}

/** Identificación y registro de todas las peticiones, incluidos los rechazos de guards. */
@Injectable()
export class PeticionIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');
  use(req: PeticionHttp, res: Response, next: NextFunction) {
    const recibido = req.headers['x-request-id'];
    req.peticionId =
      typeof recibido === 'string' && /^[a-zA-Z0-9._-]{1,100}$/.test(recibido)
        ? recibido
        : randomUUID();
    req.inicio = performance.now();
    res.setHeader('X-Request-Id', req.peticionId);
    res.once('finish', () =>
      this.logger.log(
        `${req.peticionId} ${req.method} ${req.path} ${res.statusCode} ${(performance.now() - req.inicio!).toFixed(1)}ms`,
      ),
    );
    next();
  }
}
