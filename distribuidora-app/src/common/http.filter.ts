import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import * as dominio from '../productos/dominio/errores';
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');
  catch(error: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    let status = 500;
    let mensaje: string | string[] = 'Error interno del servicio';
    let codigo = 'ERROR_INTERNO';
    if (error instanceof HttpException) {
      status = error.getStatus();
      const body = error.getResponse();
      mensaje =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message ??
            error.message);
      codigo = `HTTP_${status}`;
    } else if (Object.values(dominio).some((Tipo) => error instanceof Tipo)) {
      const e = error as Error;
      status = /NoEncontradoError$/.test(e.constructor.name) ? 404 : 409;
      mensaje = e.message;
      codigo = e.constructor.name;
    } else if (error instanceof QueryFailedError) {
      const code = (error.driverError as { code?: string }).code;
      if (
        [
          'ER_LOCK_DEADLOCK',
          'ER_LOCK_WAIT_TIMEOUT',
          'ER_DUP_ENTRY',
          'ER_ROW_IS_REFERENCED_2',
          'ER_NO_REFERENCED_ROW_2',
          'ER_CHECK_CONSTRAINT_VIOLATED',
        ].includes(code ?? '')
      ) {
        status = 409;
        codigo = 'CONFLICTO_DATOS';
        mensaje =
          'La operación entra en conflicto con los datos actuales; consulta el estado antes de reintentar';
      }
    }
    if (status === 500)
      this.logger.error('Fallo interno al procesar la solicitud');
    res.status(status).json({
      data: null,
      error: { codigo, mensaje },
      meta: { statusCode: status, path: req.path },
    });
  }
}
