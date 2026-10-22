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
