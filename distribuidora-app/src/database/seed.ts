import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { PasswordService } from '../usuarios/infraestructura/password.service';
import { UsuarioOrmEntity } from '../usuarios/infraestructura/usuario.orm-entity';
import { ProductoOrmEntity } from '../productos/infraestructura/producto.orm-entity';
import { LoteOrmEntity } from '../productos/infraestructura/lote.orm-entity';
import { PedidoOrmEntity } from '../productos/infraestructura/pedido.orm-entity';
import type { RolUsuario } from '../usuarios/dominio/entidades';
async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const db = app.get(DataSource);
    const passwords = app.get(PasswordService);
    const cuentas: [string, RolUsuario, string][] = [
      ['admin@distribuidora.local', 'administrador', 'SEED_ADMIN_PASSWORD'],
      ['almacen@distribuidora.local', 'almacenista', 'SEED_ALMACEN_PASSWORD'],
      ['restaurante@distribuidora.local', 'cliente', 'SEED_CLIENTE_PASSWORD'],
    ];
    for (const [, , variable] of cuentas) {
      const clave = process.env[variable];
      if (!clave || clave.length < 12 || clave.includes('REEMPLAZAR'))
        throw new Error(
          `${variable} requiere una contraseña local de al menos 12 caracteres`,
        );
    }
    await db.transaction(async (manager) => {
      const usuarios = manager.getRepository(UsuarioOrmEntity);
      for (const [correo, rol, variable] of cuentas) {
        if (!(await usuarios.findOneBy({ correo }))) {
          await usuarios.save(
            usuarios.create({
              correo,
              nombre: `Demostración ${rol}`,
              rol,
              activo: true,
              passwordHash: await passwords.transformar(process.env[variable]!),
            }),
          );
        }
      }
      const productos = manager.getRepository(ProductoOrmEntity);
      let producto = await productos.findOneBy({
        nombre: 'Res de demostración',
      });
      if (!producto)
        producto = await productos.save(
          productos.create({
            nombre: 'Res de demostración',
            presentacion: 'A granel',
            unidadMedida: 'kg',
            precioBase: '180.00',
            stockMinimo: '5.000',
          }),
        );
      const lotes = manager.getRepository(LoteOrmEntity);
      const fecha = new Date();
      const dia = 86400000;
      for (const [marca, saldo, vencimiento] of [
        ['DEMO-FEFO-1', 10, 7],
        ['DEMO-FEFO-2', 10, 14],
        ['DEMO-CADUCADO', 50, -1],
      ] as const) {
        if (
          !(await lotes.findOneBy({
            proveedor: marca,
            productoId: producto.id,
          }))
        )
          await lotes.save(
            lotes.create({
              productoId: producto.id,
              proveedor: marca,
              cantidadDisponible: String(saldo),
              fechaIngreso: new Date(fecha.getTime() - 30 * dia),
              fechaCaducidad: new Date(fecha.getTime() + vencimiento * dia),
            }),
          );
      }
      const cliente = await usuarios.findOneByOrFail({
        correo: 'restaurante@distribuidora.local',
      });
      const pedidos = manager.getRepository(PedidoOrmEntity);
      if (!(await pedidos.findOneBy({ clienteId: cliente.id })))
        await pedidos.save(
          pedidos.create({ clienteId: cliente.id, fecha, estado: 'recibido' }),
        );
    });
    console.log(
      'Datos de arranque listos. No se sobrescriben usuarios ni existencias previas. Contraseñas: variables SEED_* del .env local.',
    );
  } finally {
    await app.close();
  }
}
void seed().catch(() => {
  console.error(
    'Datos de arranque no disponibles: conexión, migraciones o variables SEED_* inválidas.',
  );
  process.exitCode = 1;
});
