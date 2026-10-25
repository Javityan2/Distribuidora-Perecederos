import { configurarApi } from '../src/comun/configurar-api';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

describe('AppController HTTP aislado (integración MySQL en test:mysql)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    configurarApi(app);
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect((res.body as { data: unknown }).data).toEqual({
          servicio: 'Distribuidora de perecederos',
          estado: 'disponible',
        });
        expect(
          (res.body as { meta: { requestId: string } }).meta.requestId,
        ).toBeDefined();
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
