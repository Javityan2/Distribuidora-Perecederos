import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response, NextFunction } from 'express';
import { HttpErrorFilter } from './http.filter';
export function configurarApi(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpErrorFilter());
  const origins = (
    process.env.CORS_ORIGINS ?? 'http://localhost:4200,http://localhost:5173'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (origins.includes('*'))
    throw new Error('CORS_ORIGINS requiere orígenes explícitos');
  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  const logger = new Logger('Peticiones');
  app.use((req: Request, res: Response, next: NextFunction) => {
    const inicio = performance.now();
    res.on('finish', () =>
      logger.log(
        `${req.method} ${req.path} ${res.statusCode} ${(performance.now() - inicio).toFixed(1)}ms`,
      ),
    );
    next();
  });
  const config = new DocumentBuilder()
    .setTitle('Distribuidora de perecederos')
    .setDescription(
      'Avance 02. Respuestas exitosas: {data}. Errores: {data:null,error:{codigo,mensaje},meta:{statusCode,path}}. Administrador y almacenista gestionan inventario; cliente consulta y crea sus pedidos.',
    )
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  const documento = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documento, {
    swaggerOptions: { persistAuthorization: false },
  });
  return documento;
}
