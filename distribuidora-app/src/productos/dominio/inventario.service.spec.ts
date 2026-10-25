import { describe, it, expect } from '@jest/globals';
import { InMemoryInventarioRepository } from '../infraestructura/in-memory-inventario.repository';
import { escenarios, preparar } from '../../escenarios';
import {
  CantidadInvalidaError,
  FechaInvalidaError,
  LoteNoEncontradoError,
  PedidoNoEncontradoError,
  ProductoCaducadoError,
  ProductoNoEncontradoError,
} from './errores';
import { InMemoryUsuarioRepository } from '../../usuarios/infraestructura/in-memory-usuario.repository';
import { InventarioService } from './inventario.service';

describe('Reglas de inventario', () => {
  for (const escenario of escenarios) it(escenario.nombre, escenario.ejecutar);

  it('permite alcanzar exactamente el mínimo y agrupa líneas repetidas', async () => {
    const { servicio, repo } = preparar();
    const pedido = await servicio.crearPedido({ clienteId: 1 });
    await servicio.surtirPedido(pedido.id, [
      { productoId: 1, cantidad: 10 },
      { productoId: 1, cantidad: 5 },
    ]);
    expect((await repo.buscarLote(1))?.cantidadDisponible).toBe(5);
  });

  it('serializa surtidos concurrentes incluso entre servicios', async () => {
    const { servicio, repo, ahora } = preparar();
    const otro = new InventarioService(repo, ahora);
    const pedido = await servicio.crearPedido({ clienteId: 1 });
    const resultados = await Promise.allSettled([
      servicio.surtirPedido(pedido.id, [{ productoId: 1, cantidad: 5 }]),
      otro.surtirPedido(pedido.id, [{ productoId: 1, cantidad: 5 }]),
    ]);
    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await repo.listarSurtidos()).toHaveLength(1);
  });

  it('valida referencias y cantidades antes de confirmar', async () => {
    const { servicio } = preparar();
    await expect(
      servicio.surtirPedido(99, [{ productoId: 1, cantidad: 1 }]),
    ).rejects.toBeInstanceOf(PedidoNoEncontradoError);
    const pedido = await servicio.crearPedido({ clienteId: 1 });
    await expect(servicio.surtirPedido(pedido.id, [])).rejects.toBeInstanceOf(
      CantidadInvalidaError,
    );
    await expect(
      servicio.surtirPedido(pedido.id, [{ productoId: 99, cantidad: 1 }]),
    ).rejects.toBeInstanceOf(ProductoNoEncontradoError);
    await expect(
      servicio.registrarMerma({ loteId: 99, cantidad: 1, motivo: 'daño' }),
    ).rejects.toBeInstanceOf(LoteNoEncontradoError);
  });

  it('rechaza lotes caducados o con fechas inválidas y registra uno válido', async () => {
    const { servicio, ahora } = preparar();
    const datos = {
      productoId: 1,
      proveedor: 'Local',
      cantidadDisponible: 5,
      fechaIngreso: new Date('2026-10-01'),
      fechaCaducidad: ahora(),
    };
    await expect(servicio.registrarLote(datos)).rejects.toBeInstanceOf(
      ProductoCaducadoError,
    );
    await expect(
      servicio.registrarLote({
        ...datos,
        fechaCaducidad: new Date('inválida'),
      }),
    ).rejects.toBeInstanceOf(FechaInvalidaError);
    expect(
      (
        await servicio.registrarLote({
          ...datos,
          fechaCaducidad: new Date('2026-11-01'),
        })
      ).id,
    ).toBe(4);
  });

  it('aísla los datos del repositorio y cumple el contrato de usuarios', async () => {
    const repo = new InMemoryUsuarioRepository();
    const usuario = await repo.crear({
      nombre: 'Cliente',
      correo: 'cliente@example.com',
    });
    usuario.nombre = 'Cambio externo';
    expect((await repo.buscarPorId(usuario.id))?.nombre).toBe('Cliente');
    expect(
      (await repo.actualizar(usuario.id, { nombre: 'Restaurante' }))?.nombre,
    ).toBe('Restaurante');
    expect(await repo.listar()).toHaveLength(1);
    expect(await repo.eliminar(usuario.id)).not.toBeNull();
    expect(await repo.buscarPorId(usuario.id)).toBeNull();
    expect(await repo.actualizar(99, {})).toBeNull();
    expect(await repo.eliminar(99)).toBeNull();
  });
});

describe('Precisión de cantidades', () => {
  function decimal() {
    const ahora = () => new Date('2026-10-25T12:00:00Z');
    const repo = new InMemoryInventarioRepository(
      [
        {
          id: 1,
          nombre: 'Res',
          presentacion: 'Granel',
          unidadMedida: 'kg',
          precioBase: 180,
          stockMinimo: 5,
        },
      ],
      [
        {
          id: 1,
          productoId: 1,
          proveedor: 'Prueba',
          cantidadDisponible: 5.3,
          fechaIngreso: new Date('2026-10-01'),
          fechaCaducidad: new Date('2026-12-01'),
        },
      ],
      ahora,
    );
    return { repo, servicio: new InventarioService(repo, ahora) };
  }
  it('permite llegar al mínimo al sumar 0.1 y 0.2 sin error binario', async () => {
    const { repo, servicio } = decimal();
    const pedido = await servicio.crearPedido({ clienteId: 1 });
    const resultado = await servicio.surtirPedido(pedido.id, [
      { productoId: 1, cantidad: 0.1 },
      { productoId: 1, cantidad: 0.2 },
    ]);
    expect(resultado[0].lotes).toEqual([{ loteId: 1, cantidad: 0.3 }]);
    expect((await repo.buscarLote(1))?.cantidadDisponible).toBe(5);
  });
  it('descuenta mermas decimales sin acumular residuos', async () => {
    const { repo, servicio } = decimal();
    await servicio.registrarMerma({ loteId: 1, cantidad: 0.1, motivo: 'daño' });
    await servicio.registrarMerma({
      loteId: 1,
      cantidad: 0.2,
      motivo: 'faltante',
    });
    expect((await repo.buscarLote(1))?.cantidadDisponible).toBe(5);
  });
  it('rechaza cantidades más pequeñas que la precisión almacenada', async () => {
    const { servicio } = decimal();
    for (const cantidad of [0.0001, 0.00000001, 1.0001, 1000000000]) {
      await expect(
        servicio.registrarMerma({ loteId: 1, cantidad, motivo: 'daño' }),
      ).rejects.toBeInstanceOf(CantidadInvalidaError);
    }
  });
});
