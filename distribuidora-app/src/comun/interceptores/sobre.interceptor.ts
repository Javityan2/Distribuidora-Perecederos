import { Injectable } from '@nestjs/common';
import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { PeticionHttp } from '../middleware/peticion-id.middleware';

export interface Sobre<T> {
  data: T;
  meta: {
    ruta: string;
    duracionMs: number;
    timestamp: string;
    requestId?: string;
  };
}

@Injectable()
export class SobreInterceptor implements NestInterceptor {
  intercept(
    contexto: ExecutionContext,
    siguiente: CallHandler,
  ): Observable<Sobre<unknown>> {
    const req = contexto.switchToHttp().getRequest<PeticionHttp>();
    const inicio = req.inicio ?? performance.now();
    return siguiente.handle().pipe(
      map((data: unknown) => ({
        data,
        meta: {
          ruta: req.path,
          duracionMs: Math.round((performance.now() - inicio) * 100) / 100,
          timestamp: new Date().toISOString(),
          requestId: req.peticionId,
        },
      })),
    );
  }
}
