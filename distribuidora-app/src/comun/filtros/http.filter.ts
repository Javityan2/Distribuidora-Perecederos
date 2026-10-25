import { Catch, HttpException, Logger } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ErrorDeDominio } from '../../dominio/error-de-dominio';
import {
  ProductoNoEncontradoError,
  PedidoNoEncontradoError,
  LoteNoEncontradoError,
} from '../../productos/dominio/errores';
import { UsuarioNoEncontradoError } from '../../usuarios/dominio/errores';
import type { PeticionHttp } from '../middleware/peticion-id.middleware';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('Errores');
  catch(error: unknown, host: ArgumentsHost) {
    const contexto = host.switchToHttp();
    const req = contexto.getRequest<PeticionHttp>();
    const res = contexto.getResponse<Response>();
    let status = 500;
    let mensaje: string | string[] = 'Error interno del servicio';
    let codigo = 'ERROR_INTERNO';
    if (error instanceof HttpException) {
      status = error.getStatus();
      const cuerpo = error.getResponse();
      mensaje =
        typeof cuerpo === 'string'
          ? cuerpo
          : ((cuerpo as { message?: string | string[] }).message ??
            error.message);
      codigo = `HTTP_${status}`;
    } else if (error instanceof ErrorDeDominio) {
      const noExiste =
        error instanceof ProductoNoEncontradoError ||
        error instanceof PedidoNoEncontradoError ||
        error instanceof LoteNoEncontradoError ||
        error instanceof UsuarioNoEncontradoError;
      status = noExiste ? 404 : 409;
      mensaje = error.message;
      codigo = error.name;
    } else if (error instanceof QueryFailedError) {
      const code = (error.driverError as { code?: string }).code;
      if (code === 'ER_DUP_ENTRY') {
        status = 409;
        codigo = 'REGISTRO_DUPLICADO';
        mensaje = 'Ya existe un registro con esos datos únicos';
      } else if (
        [
          'ER_LOCK_DEADLOCK',
          'ER_LOCK_WAIT_TIMEOUT',
          'ER_ROW_IS_REFERENCED_2',
          'ER_NO_REFERENCED_ROW_2',
          'ER_CHECK_CONSTRAINT_VIOLATED',
        ].includes(code ?? '')
      ) {
        status = 409;
        codigo = 'CONFLICTO_DATOS';
        mensaje =
          'La operación entra en conflicto con el estado actual de los datos';
      }
    }
    if (status === 500)
      this.logger.error(
        `${req.peticionId ?? '-'} Fallo interno al procesar la solicitud`,
      );
    res.status(status).json({
      data: null,
      error: { codigo, mensaje },
      meta: {
        statusCode: status,
        path: req.path,
        requestId: req.peticionId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
