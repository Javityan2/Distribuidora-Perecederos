import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApi } from './comun/configurar-api';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configurarApi(app);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
