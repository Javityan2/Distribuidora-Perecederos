import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpErrorFilter } from './filtros/http.filter';
import { SobreInterceptor } from './interceptores/sobre.interceptor';
import { PeticionIdMiddleware } from './middleware/peticion-id.middleware';

export function configurarApi(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpErrorFilter());
  app.useGlobalInterceptors(new SobreInterceptor());
  const identificacion = new PeticionIdMiddleware();
  app.use(identificacion.use.bind(identificacion));
  const origenes = (
    process.env.CORS_ORIGINS ?? 'http://localhost:4200,http://localhost:5173'
  )
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);
  if (
    !origenes.length ||
    origenes.some((origen) => {
      try {
        const url = new URL(origen);
        return (
          !['http:', 'https:'].includes(url.protocol) || url.origin !== origen
        );
      } catch {
        return true;
      }
    })
  )
    throw new Error(
      'CORS_ORIGINS debe contener orígenes HTTP válidos y explícitos',
    );
  app.enableCors({
    origin: origenes,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['Location', 'X-Request-Id'],
  });
  app.enableShutdownHooks();
  const configuracion = new DocumentBuilder()
    .setTitle('Distribuidora de perecederos')
    .setDescription(
      'Inventario por lotes, pedidos y mermas. Respuestas con data y meta; errores con data:null, error y meta. Las operaciones protegidas verifican JWT y rol actual.',
    )
    .setVersion('2.1')
    .addBearerAuth()
    .build();
  const documento = SwaggerModule.createDocument(app, configuracion);
  documento.components ??= {};
  documento.components.schemas ??= {};
  documento.components.schemas.SobreRespuesta = {
    type: 'object',
    required: ['data', 'meta'],
    properties: {
      data: {},
      meta: {
        type: 'object',
        properties: {
          ruta: { type: 'string' },
          duracionMs: { type: 'number' },
          timestamp: { type: 'string', format: 'date-time' },
          requestId: { type: 'string' },
        },
      },
    },
  };
  documento.components.schemas.ErrorHttp = {
    type: 'object',
    required: ['data', 'error', 'meta'],
    properties: {
      data: { nullable: true, enum: [null] },
      error: {
        type: 'object',
        properties: {
          codigo: { type: 'string' },
          mensaje: {
            oneOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } },
            ],
          },
        },
      },
      meta: {
        type: 'object',
        properties: {
          statusCode: { type: 'integer' },
          path: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          requestId: { type: 'string' },
        },
      },
    },
  };
  const metodos = [
    'get',
    'post',
    'put',
    'patch',
    'delete',
    'options',
    'head',
  ] as const;
  for (const ruta of Object.values(documento.paths)) {
    for (const metodo of metodos) {
      const operacion = ruta?.[metodo];
      if (!operacion) continue;
      for (const estado of ['200', '201']) {
        const respuesta = operacion.responses[estado];
        if (respuesta && !('$ref' in respuesta))
          respuesta.content = {
            'application/json': {
              schema: { $ref: '#/components/schemas/SobreRespuesta' },
            },
          };
      }

      for (const [estado, descripcion] of Object.entries({
        400: 'Entrada inválida',
        401: 'Credencial requerida, inválida o vencida',
        403: 'Acceso no permitido por rol o propietario',
        404: 'Recurso inexistente',
        409: 'Conflicto con una regla o con los datos',
      }))
        operacion.responses[estado] ??= {
          description: descripcion,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorHttp' },
            },
          },
        };
    }
  }
  SwaggerModule.setup('docs', app, documento, {
    swaggerOptions: { persistAuthorization: false },
  });
  return documento;
}
