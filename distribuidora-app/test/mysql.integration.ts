import type { OpenAPIObject } from '@nestjs/swagger';
import type { Usuario } from '../src/usuarios/dominio/entidades';
import type {
  Producto,
  Pedido,
  Lote,
  MovimientoSurtido,
} from '../src/productos/dominio/entidades';
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createConnection } from 'mysql2/promise';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { writeFileSync, mkdirSync } from 'node:fs';
import { CrearInventario1792703804844 } from '../src/database/migrations/1792703804844-CrearInventario';
import { AgregarPasswordHash1792709127226 } from '../src/database/migrations/1792709127226-AgregarPasswordHash';
import { configurarApi } from '../src/comun/configurar-api';
import { PasswordService } from '../src/usuarios/infraestructura/password.service';
import { UsuarioOrmEntity } from '../src/usuarios/infraestructura/usuario.orm-entity';
import { LoteOrmEntity } from '../src/productos/infraestructura/lote.orm-entity';
import { PedidoOrmEntity } from '../src/productos/infraestructura/pedido.orm-entity';
import { MovimientoSurtidoOrmEntity } from '../src/productos/infraestructura/movimiento-surtido.orm-entity';
import { MysqlInventarioRepository } from '../src/productos/infraestructura/mysql-inventario.repository';
import { MysqlUsuarioRepository } from '../src/usuarios/infraestructura/mysql-usuario.repository';
const resultados: { caso: string; resultado: string }[] = [];
function ok(caso: string) {
  resultados.push({ caso, resultado: 'OK' });
  console.log(`OK: ${caso}`);
}
async function ejecutar() {
  const nombre = `distribuidora_test_${Date.now()}`;
  assert.match(nombre, /^distribuidora_test_\d+$/);
  const conexion = await createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });
  let app: INestApplication | undefined;
  let migrador: DataSource | undefined;
  try {
    await conexion.query(
      `CREATE DATABASE ${nombre} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    migrador = new DataSource({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: nombre,
      timezone: 'Z',
      entities: [],
      migrations: [
        CrearInventario1792703804844,
        AgregarPasswordHash1792709127226,
      ],
      synchronize: false,
    });
    await migrador.initialize();
    assert.equal((await migrador.runMigrations()).length, 2);
    assert.equal((await migrador.runMigrations()).length, 0);
    ok('Dos migraciones desde cero; segunda ejecución sin cambios');
    process.env.DB_DATABASE = nombre;
    // La configuración del módulo utiliza la base temporal seleccionada.
    const { AppModule } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- Carga posterior a la selección de la base temporal.
      require('../src/app.module') as typeof import('../src/app.module');
    app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
    configurarApi(app);
    await app.listen(0, '127.0.0.1');
    const url = await app.getUrl();
    const db = app.get(DataSource);
    const password = randomBytes(24).toString('hex');
    const usuarios = db.getRepository(UsuarioOrmEntity);
    const hash = await app.get(PasswordService).transformar(password);
    const admin = await usuarios.save(
      usuarios.create({
        nombre: 'Admin prueba',
        correo: 'admin@test.local',
        rol: 'administrador',
        activo: true,
        passwordHash: hash,
      }),
    );
    const almacen = await usuarios.save(
      usuarios.create({
        nombre: 'Almacén prueba',
        correo: 'almacen@test.local',
        rol: 'almacenista',
        activo: true,
        passwordHash: hash,
      }),
    );
    async function llamada<T = unknown>(
      path: string,
      method = 'GET',
      body?: unknown,
      token?: string,
    ) {
      const r = await fetch(url + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      const cuerpo: unknown = await r.json();
      assert.ok(cuerpo && typeof cuerpo === 'object' && 'data' in cuerpo);
      return {
        status: r.status,
        body: cuerpo as { data: T; meta: { requestId: string; ruta?: string } },
        headers: r.headers,
      };
    }
    const reg = await llamada<Usuario>('/auth/registro', 'POST', {
      nombre: 'Restaurante prueba',
      correo: 'cliente@test.local',
      password,
    });
    assert.equal(reg.status, 201);
    const cliente = reg.body.data;
    assert.equal(cliente.rol, 'cliente');
    assert.equal('passwordHash' in cliente, false);
    assert.equal(
      (
        await llamada('/auth/registro', 'POST', {
          nombre: 'Restaurante prueba',
          correo: 'cliente@test.local',
          password,
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await llamada('/auth/registro', 'POST', {
          nombre: 'A',
          correo: 'malo',
          password: '123',
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await llamada('/auth/registro', 'POST', {
          nombre: 'Prueba',
          correo: 'elevar@test.local',
          password,
          rol: 'administrador',
        })
      ).status,
      400,
    );
    ok(
      'Registro 201 sin hash, duplicado 409, validación y escalamiento rechazados 400',
    );
    async function login(correo: string) {
      const r = await llamada<{ accessToken: string }>('/auth/login', 'POST', {
        correo,
        password,
      });
      assert.equal(r.status, 200);
      return r.body.data.accessToken;
    }
    const ta = await login(admin.correo);
    const tc = await login(cliente.correo);
    const tl = await login(almacen.correo);
    assert.equal(
      (
        await llamada('/auth/login', 'POST', {
          correo: cliente.correo,
          password: 'incorrecta',
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await llamada('/auth/login', 'POST', {
          correo: 'no@test.local',
          password,
        })
      ).status,
      401,
    );
    assert.equal((await llamada('/auth/perfil')).status, 401);
    assert.equal(
      (await llamada('/auth/perfil', 'GET', undefined, tc)).status,
      200,
    );
    const partes = tc.split('.');
    partes[2] = (partes[2][0] === 'A' ? 'B' : 'A') + partes[2].slice(1);
    assert.equal(
      (await llamada('/auth/perfil', 'GET', undefined, partes.join('.')))
        .status,
      401,
    );
    const vencido = await app
      .get(JwtService)
      .signAsync({ sub: cliente.id }, { expiresIn: -1 });
    assert.equal(
      (await llamada('/auth/perfil', 'GET', undefined, vencido)).status,
      401,
    );
    await usuarios.update(cliente.id, { activo: false });
    assert.equal(
      (await llamada('/auth/perfil', 'GET', undefined, tc)).status,
      401,
    );
    await usuarios.update(cliente.id, { activo: true });
    ok('Login, firma alterada, token vencido y usuario inactivo');
    assert.equal((await llamada('/usuarios')).status, 401);
    assert.equal(
      (await llamada('/usuarios', 'GET', undefined, tc)).status,
      403,
    );
    assert.equal(
      (await llamada('/usuarios', 'GET', undefined, tl)).status,
      403,
    );
    const lista = await llamada('/usuarios', 'GET', undefined, ta);
    assert.equal(lista.status, 200);
    assert.equal(JSON.stringify(lista.body).includes('passwordHash'), false);
    ok(
      'Acceso a administración: 401 sin credencial, 403 rol incorrecto, 200 administrador',
    );
    const denegada = await llamada('/usuarios', 'GET', undefined, tc);
    assert.equal(
      denegada.body.meta.requestId,
      denegada.headers.get('x-request-id'),
    );
    const perfilActual = await llamada<Usuario>(
      '/auth/perfil',
      'GET',
      undefined,
      tc,
    );
    assert.equal(
      perfilActual.body.meta.requestId,
      perfilActual.headers.get('x-request-id'),
    );
    assert.equal(perfilActual.body.data.id, cliente.id);
    await usuarios.update(admin.id, { rol: 'cliente' });
    assert.equal(
      (await llamada('/usuarios', 'GET', undefined, ta)).status,
      403,
    );
    await usuarios.update(admin.id, { rol: 'administrador' });
    const prod = await llamada<Producto>(
      '/productos',
      'POST',
      {
        nombre: 'Res test',
        presentacion: 'Granel',
        unidadMedida: 'kg',
        precioBase: 180,
        stockMinimo: 5,
      },
      ta,
    );
    assert.equal(prod.status, 201);
    const producto = prod.body.data;
    assert.equal(prod.headers.get('location'), `/productos/${producto.id}`);
    const pollo = await llamada<Producto>(
      '/productos',
      'POST',
      {
        nombre: 'Pollo test',
        presentacion: 'Granel',
        unidadMedida: 'kg',
        precioBase: 80,
        stockMinimo: 0,
      },
      ta,
    );
    assert.equal(pollo.status, 201);
    for (const id of ['abc', '0', '-1', '1.5', '4294967296'])
      assert.equal((await llamada('/productos/' + id)).status, 400);
    assert.equal((await llamada('/productos/999999')).status, 404);
    const ingreso = new Date(Date.now() - 86400000).toISOString();
    const fecha = (dias: number) =>
      new Date(Date.now() + dias * 86400000).toISOString();
    const nuevoLote = (proveedor: string, dias: number) => ({
      productoId: producto.id,
      proveedor,
      cantidadDisponible: 10,
      fechaIngreso: ingreso,
      fechaCaducidad: fecha(dias),
    });
    assert.equal(
      (await llamada('/lotes', 'POST', nuevoLote('Prohibido', 10), tc)).status,
      403,
    );
    const largo = await llamada<Lote>(
      '/lotes',
      'POST',
      nuevoLote('Tardío', 20),
      tl,
    );
    assert.equal(largo.status, 201);
    const corto = await llamada<Lote>(
      '/lotes',
      'POST',
      nuevoLote('Próximo', 10),
      tl,
    );
    assert.equal(corto.status, 201);
    const lotes = db.getRepository(LoteOrmEntity);
    const caducado = await lotes.save(
      lotes.create({
        productoId: producto.id,
        proveedor: 'Caducado test',
        cantidadDisponible: '50',
        fechaIngreso: new Date(Date.now() - 10 * 86400000),
        fechaCaducidad: new Date(Date.now() - 86400000),
      }),
    );
    assert.equal(
      (
        await llamada(
          '/lotes',
          'POST',
          { ...nuevoLote('Inválido', 10), cantidadDisponible: 0 },
          tl,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await llamada(
          '/lotes',
          'POST',
          {
            ...nuevoLote('Caducado', 10),
            fechaIngreso: new Date(Date.now() - 10 * 86400000).toISOString(),
            fechaCaducidad: ingreso,
          },
          tl,
        )
      ).status,
      409,
    );
    async function pedido() {
      const r = await llamada<Pedido>(
        '/pedidos',
        'POST',
        { clienteId: cliente.id },
        tc,
      );
      assert.equal(r.status, 201);
      assert.equal(r.headers.get('location'), `/pedidos/${r.body.data.id}`);
      return r.body.data.id;
    }
    assert.equal(
      (await llamada('/pedidos', 'POST', { clienteId: admin.id }, tc)).status,
      403,
    );
    const ajeno = await usuarios.save(
      usuarios.create({
        nombre: 'Otro restaurante',
        correo: 'otro@test.local',
        rol: 'cliente',
        activo: true,
        passwordHash: hash,
      }),
    );
    const pedidoAjeno = await db
      .getRepository(PedidoOrmEntity)
      .save({ clienteId: ajeno.id, estado: 'recibido', fecha: new Date() });
    assert.equal(
      (await llamada(`/pedidos/${pedidoAjeno.id}`, 'GET', undefined, tc))
        .status,
      403,
    );
    const propios = await llamada<Pedido[]>('/pedidos', 'GET', undefined, tc);
    assert.ok(propios.body.data.every((p) => p.clienteId === cliente.id));
    ok(
      'Metadatos, identificadores válidos, permisos actuales y propiedad de pedidos',
    );
    const p = await pedido();
    const vacio = await llamada(
      `/pedidos/${p}/surtidos`,
      'POST',
      { lineas: [] },
      tl,
    );
    assert.equal(vacio.status, 409);
    assert.equal(
      (await db.getRepository(PedidoOrmEntity).findOneByOrFail({ id: p }))
        .estado,
      'recibido',
    );

    const surtir = (id: number, cantidad: number) =>
      llamada<MovimientoSurtido[]>(
        `/pedidos/${id}/surtidos`,
        'POST',
        { lineas: [{ productoId: producto.id, cantidad }] },
        tl,
      );
    const s = await surtir(p, 12);
    assert.equal(s.status, 201);
    assert.deepEqual(s.body.data[0].lotes, [
      { loteId: corto.body.data.id, cantidad: 10 },
      { loteId: largo.body.data.id, cantidad: 2 },
    ]);
    assert.equal((await surtir(p, 1)).status, 409);
    assert.equal(
      (await lotes.findOneByOrFail({ id: caducado.id })).cantidadDisponible,
      '50.000',
    );
    ok(
      'Surtido vacío 409, FEFO, exclusión de caducados y rechazo de doble surtido',
    );
    const p2 = await pedido();
    assert.equal((await surtir(p2, 9)).status, 409);
    assert.equal((await surtir(p2, 4)).status, 409);
    const parcial = await llamada(
      `/pedidos/${p2}/surtidos`,
      'POST',
      {
        lineas: [
          { productoId: producto.id, cantidad: 1 },
          { productoId: pollo.body.data.id, cantidad: 1 },
        ],
      },
      tl,
    );
    assert.equal(parcial.status, 409);
    assert.equal(
      (await lotes.findOneByOrFail({ id: largo.body.data.id }))
        .cantidadDisponible,
      '8.000',
    );
    assert.equal(
      (await db.getRepository(PedidoOrmEntity).findOneByOrFail({ id: p2 }))
        .estado,
      'recibido',
    );
    ok(
      'Insuficiencia, stock mínimo y rollback de un surtido con varios productos',
    );
    assert.equal(
      (
        await llamada(
          '/mermas',
          'POST',
          { loteId: caducado.id, cantidad: 0, motivo: 'caducidad' },
          tl,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await llamada(
          '/mermas',
          'POST',
          { loteId: caducado.id, cantidad: 51, motivo: 'caducidad' },
          tl,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await llamada(
          '/mermas',
          'POST',
          { loteId: caducado.id, cantidad: 50, motivo: 'caducidad' },
          tl,
        )
      ).status,
      201,
    );
    ok('Merma válida y rechazo de cero y exceso de saldo');
    const concurrente = await pedido();
    const dobles = await Promise.all([
      surtir(concurrente, 1),
      surtir(concurrente, 1),
    ]);
    assert.deepEqual(dobles.map((r) => r.status).sort(), [201, 409]);
    assert.equal(
      await db
        .getRepository(MovimientoSurtidoOrmEntity)
        .countBy({ pedidoId: concurrente }),
      1,
    );
    ok('Surtidos concurrentes: una sola salida confirmada');
    const repo = app.get(MysqlInventarioRepository);
    const fallo = new Error('rollback esperado');
    let id: number | undefined;
    await assert.rejects(
      repo.enTransaccion(async () => {
        const lote = await repo.crearLote({
          ...nuevoLote('Rollback', 10),
          fechaIngreso: new Date(ingreso),
          fechaCaducidad: new Date(fecha(10)),
        });
        id = lote.id;
        throw fallo;
      }),
      (e) => e === fallo,
    );
    assert.equal(await repo.buscarLote(id!), null);
    const ur = app.get(MysqlUsuarioRepository);
    const perfil = await ur.crear({
      nombre: 'Perfil interno',
      correo: 'interno@test.local',
    });
    assert.equal((await ur.buscarPorId(perfil.id))?.rol, 'cliente');
    await ur.actualizar(perfil.id, { nombre: 'Actualizado' });
    assert.equal((await ur.buscarPorId(perfil.id))?.nombre, 'Actualizado');
    await ur.eliminar(perfil.id);
    assert.equal(await ur.buscarPorId(perfil.id), null);
    ok('Contrato de usuarios y rollback del repositorio MySQL');
    const doc = await fetch(url + '/docs-json');
    assert.equal(doc.status, 200);
    const spec = (await doc.json()) as OpenAPIObject;
    assert.ok(spec.paths['/pedidos/{id}/surtidos']);
    const esquema = spec.components?.schemas?.RegistroUsuarioDto;
    assert.ok(
      esquema && 'properties' in esquema && esquema.properties?.password,
    );
    const permitido = await fetch(url + '/productos', {
      headers: { Origin: 'http://localhost:4200' },
    });
    assert.equal(
      permitido.headers.get('access-control-allow-origin'),
      'http://localhost:4200',
    );
    const origenAjeno = await fetch(url + '/productos', {
      headers: { Origin: 'https://ajeno.example' },
    });
    assert.equal(origenAjeno.headers.get('access-control-allow-origin'), null);
    ok('Swagger generado desde código y CORS limitado a orígenes configurados');
    mkdirSync('../output', { recursive: true });
    writeFileSync(
      '../output/pruebas-avance2.json',
      JSON.stringify(
        {
          fecha: new Date().toISOString(),
          base: 'temporal aislada, eliminada al terminar',
          resultados,
        },
        null,
        2,
      ),
    );
    console.log(`${resultados.length} grupos de comprobaciones correctos.`);
  } finally {
    if (app) await app.close();
    if (migrador?.isInitialized) await migrador.destroy();
    await conexion.query(`DROP DATABASE IF EXISTS ${nombre}`);
    await conexion.end();
  }
}
void ejecutar().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Falló la integración',
  );
  process.exitCode = 1;
});
