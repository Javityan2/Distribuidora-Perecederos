import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { InventarioService } from './productos/dominio/inventario.service';
import { MysqlInventarioRepository } from './productos/infraestructura/mysql-inventario.repository';

async function ejecutar() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const servicio = app.get(InventarioService);
    const repositorio = app.get(MysqlInventarioRepository);

    const productos = await repositorio.listarProductos();
    const producto = productos[0];

    assert.ok(producto, 'Necesitamos un producto de ejemplo');

    const falloEsperado = new Error('Fallo provocado para probar rollback');
    let loteId: number | undefined;

    try {
      await repositorio.enTransaccion(async () => {
        const ingreso = new Date();
        const caducidad = new Date(ingreso.getTime() + 7 * 24 * 60 * 60 * 1000);

        const lote = await servicio.registrarLote({
          productoId: producto.id,
          proveedor: 'Prueba de transacción',
          cantidadDisponible: 10,
          fechaIngreso: ingreso,
          fechaCaducidad: caducidad,
        });

        loteId = lote.id;

        assert.ok(await repositorio.buscarLote(lote.id));
        console.log('OK: el lote existe dentro de la transacción');

        throw falloEsperado;
      });
    } catch (error) {
      if (error !== falloEsperado) {
        throw error;
      }
    }

    assert.ok(loteId !== undefined);
    assert.equal(await repositorio.buscarLote(loteId), null);

    console.log('OK: MySQL revirtió la creación del lote');
  } finally {
    await app.close();
  }
}

void ejecutar().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
