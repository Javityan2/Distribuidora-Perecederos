import assert from 'node:assert/strict';
import { InventarioService } from './productos/dominio/inventario.service';
import { InMemoryInventarioRepository } from './productos/infraestructura/in-memory-inventario.repository';
import { InMemoryUsuarioRepository } from './usuarios/infraestructura/in-memory-usuario.repository';
import {
  CantidadInvalidaError,
  InventarioInsuficienteError,
  PedidoYaSurtidoError,
  StockMinimoComprometidoError,
} from './productos/dominio/errores';

export function preparar() {
  const ahora = () => new Date('2026-10-19T12:00:00Z');
  const repo = new InMemoryInventarioRepository(
    [
      {
        id: 1,
        nombre: 'Carne de res',
        presentacion: 'A granel',
        unidadMedida: 'kg',
        precioBase: 180,
        stockMinimo: 5,
      },
      {
        id: 2,
        nombre: 'Pollo',
        presentacion: 'A granel',
        unidadMedida: 'kg',
        precioBase: 90,
        stockMinimo: 0,
      },
    ],
    [
      {
        id: 1,
        productoId: 1,
        proveedor: 'Proveedor local',
        cantidadDisponible: 10,
        fechaIngreso: new Date('2026-10-01'),
        fechaCaducidad: new Date('2026-10-25'),
      },
      {
        id: 2,
        productoId: 1,
        proveedor: 'Proveedor local',
        cantidadDisponible: 10,
        fechaIngreso: new Date('2026-10-02'),
        fechaCaducidad: new Date('2026-10-22'),
      },
      {
        id: 3,
        productoId: 1,
        proveedor: 'Proveedor local',
        cantidadDisponible: 50,
        fechaIngreso: new Date('2026-10-01'),
        fechaCaducidad: ahora(),
      },
    ],
    ahora,
  );
  return { repo, servicio: new InventarioService(repo, ahora), ahora };
}

export const escenarios = [
  {
    nombre: 'Surtido FEFO válido y rechazo de surtido duplicado',
    ejecutar: async () => {
      const { repo, servicio } = preparar();
      const usuarios = new InMemoryUsuarioRepository();
      const cliente = await usuarios.crear({
        nombre: 'Restaurante Centro',
        correo: 'centro@example.com',
      });
      const pedido = await servicio.crearPedido({ clienteId: cliente.id });
      const movimientos = await servicio.surtirPedido(pedido.id, [
        { productoId: 1, cantidad: 12 },
      ]);
      assert.deepEqual(movimientos[0].lotes, [
        { loteId: 2, cantidad: 10 },
        { loteId: 1, cantidad: 2 },
      ]);
      assert.equal((await repo.buscarLote(3))?.cantidadDisponible, 50);
      assert.equal((await repo.buscarPedido(pedido.id))?.estado, 'surtido');
      await assert.rejects(
        servicio.surtirPedido(pedido.id, [{ productoId: 1, cantidad: 1 }]),
        PedidoYaSurtidoError,
      );
      assert.equal((await repo.listarSurtidos()).length, 1);
    },
  },
  {
    nombre:
      'Rechazo por inventario insuficiente y stock mínimo sin cambios parciales',
    ejecutar: async () => {
      const { repo, servicio } = preparar();
      const pedido = await servicio.crearPedido({ clienteId: 1 });
      await assert.rejects(
        servicio.surtirPedido(pedido.id, [{ productoId: 1, cantidad: 21 }]),
        InventarioInsuficienteError,
      );
      await assert.rejects(
        servicio.surtirPedido(pedido.id, [{ productoId: 1, cantidad: 16 }]),
        StockMinimoComprometidoError,
      );
      await assert.rejects(
        servicio.surtirPedido(pedido.id, [
          { productoId: 1, cantidad: 2 },
          { productoId: 2, cantidad: 1 },
        ]),
        InventarioInsuficienteError,
      );
      assert.equal((await repo.buscarLote(2))?.cantidadDisponible, 10);
      assert.equal((await repo.buscarPedido(pedido.id))?.estado, 'recibido');
      assert.equal((await repo.listarSurtidos()).length, 0);
    },
  },
  {
    nombre:
      'Merma válida y rechazo de cantidades inválidas o mayores a la existencia',
    ejecutar: async () => {
      const { repo, servicio } = preparar();
      for (const cantidad of [0, -1, NaN, Infinity]) {
        await assert.rejects(
          servicio.registrarMerma({ loteId: 3, cantidad, motivo: 'caducidad' }),
          CantidadInvalidaError,
        );
      }
      await assert.rejects(
        servicio.registrarMerma({
          loteId: 3,
          cantidad: 51,
          motivo: 'caducidad',
        }),
        InventarioInsuficienteError,
      );
      await servicio.registrarMerma({
        loteId: 3,
        cantidad: 50,
        motivo: 'caducidad',
      });
      assert.equal((await repo.buscarLote(3))?.cantidadDisponible, 0);
      assert.equal((await repo.listarMermas()).length, 1);
    },
  },
];

if (require.main === module) {
  void (async () => {
    for (const escenario of escenarios) {
      await escenario.ejecutar();
      console.log(`OK: ${escenario.nombre}`);
    }
    console.log('3 escenarios completados correctamente.');
  })().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
