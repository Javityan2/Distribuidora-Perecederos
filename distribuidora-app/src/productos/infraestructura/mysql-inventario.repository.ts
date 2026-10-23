import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { Producto } from '../dominio/entidades';
import { ProductoOrmEntity } from './producto.orm-entity';
import type { Lote, NuevoLote } from '../dominio/entidades';
import { LoteNoEncontradoError } from '../dominio/errores';
import { LoteOrmEntity } from './lote.orm-entity';
import type { Pedido, NuevoPedido } from '../dominio/entidades';
import { PedidoNoEncontradoError } from '../dominio/errores';
import { PedidoOrmEntity } from './pedido.orm-entity';
import type { Merma, MovimientoSurtido } from '../dominio/entidades';
import { MermaOrmEntity } from './merma.orm-entity';
import { MovimientoSurtidoOrmEntity } from './movimiento-surtido.orm-entity';
import { SurtidoLoteOrmEntity } from './surtido-lote.orm-entity';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { EntityManager } from 'typeorm';
import type { InventarioRepository } from '../dominio/inventario.repository';

@Injectable()
export class MysqlInventarioRepository implements InventarioRepository {
  constructor(private readonly dataSource: DataSource) {}

  private get manager(): EntityManager {
    return this.contexto.getStore() ?? this.dataSource.manager;
  }

  private readonly contexto = new AsyncLocalStorage<EntityManager>();

  private convertirProducto(registro: ProductoOrmEntity): Producto {
    return {
      id: registro.id,
      nombre: registro.nombre,
      presentacion: registro.presentacion,
      unidadMedida: registro.unidadMedida,
      precioBase: Number(registro.precioBase),
      stockMinimo: Number(registro.stockMinimo),
    };
  }

  async listarProductos(): Promise<Producto[]> {
    const registros = await this.manager
      .getRepository(ProductoOrmEntity)
      .find({ order: { id: 'ASC' } });

    return registros.map((registro) => this.convertirProducto(registro));
  }

  async buscarProducto(productoId: number): Promise<Producto | null> {
    const registro = await this.manager
      .getRepository(ProductoOrmEntity)
      .findOneBy({ id: productoId });

    return registro ? this.convertirProducto(registro) : null;
  }

  private convertirLote(registro: LoteOrmEntity): Lote {
    return {
      id: registro.id,
      productoId: registro.productoId,
      proveedor: registro.proveedor,
      cantidadDisponible: Number(registro.cantidadDisponible),
      fechaIngreso: registro.fechaIngreso,
      fechaCaducidad: registro.fechaCaducidad,
    };
  }

  async listarLotesProducto(productoId: number): Promise<Lote[]> {
    const registros = await this.manager.getRepository(LoteOrmEntity).find({
      where: { productoId },
      order: { fechaCaducidad: 'ASC', id: 'ASC' },
    });

    return registros.map((registro) => this.convertirLote(registro));
  }

  async buscarLote(loteId: number): Promise<Lote | null> {
    const registro = await this.manager
      .getRepository(LoteOrmEntity)
      .findOneBy({ id: loteId });

    return registro ? this.convertirLote(registro) : null;
  }

  async crearLote(datos: NuevoLote): Promise<Lote> {
    const repositorio = this.manager.getRepository(LoteOrmEntity);

    const registro = repositorio.create({
      ...datos,
      cantidadDisponible: String(datos.cantidadDisponible),
    });

    const guardado = await repositorio.save(registro);

    return this.convertirLote(guardado);
  }

  async actualizarLote(lote: Lote): Promise<Lote> {
    const repositorio = this.manager.getRepository(LoteOrmEntity);

    const registro = await repositorio.findOneBy({ id: lote.id });

    if (!registro) {
      throw new LoteNoEncontradoError(lote.id);
    }

    repositorio.merge(registro, {
      ...lote,
      cantidadDisponible: String(lote.cantidadDisponible),
    });

    const guardado = await repositorio.save(registro);

    return this.convertirLote(guardado);
  }

  private convertirPedido(registro: PedidoOrmEntity): Pedido {
    return {
      id: registro.id,
      clienteId: registro.clienteId,
      fecha: registro.fecha,
      estado: registro.estado,
    };
  }

  async crearPedido(datos: NuevoPedido): Promise<Pedido> {
    const repositorio = this.manager.getRepository(PedidoOrmEntity);

    const registro = repositorio.create({
      clienteId: datos.clienteId,
      fecha: new Date(),
      estado: 'recibido',
    });

    const guardado = await repositorio.save(registro);

    return this.convertirPedido(guardado);
  }

  async buscarPedido(pedidoId: number): Promise<Pedido | null> {
    const registro = await this.manager
      .getRepository(PedidoOrmEntity)
      .findOneBy({ id: pedidoId });

    return registro ? this.convertirPedido(registro) : null;
  }

  async actualizarPedido(pedido: Pedido): Promise<Pedido> {
    const repositorio = this.manager.getRepository(PedidoOrmEntity);

    const registro = await repositorio.findOneBy({ id: pedido.id });

    if (!registro) {
      throw new PedidoNoEncontradoError(pedido.id);
    }

    repositorio.merge(registro, pedido);

    const guardado = await repositorio.save(registro);

    return this.convertirPedido(guardado);
  }

  async registrarMerma(datos: Omit<Merma, 'id'>): Promise<Merma> {
    const repositorio = this.manager.getRepository(MermaOrmEntity);

    const registro = repositorio.create({
      ...datos,
      cantidad: String(datos.cantidad),
    });

    const guardado = await repositorio.save(registro);

    return {
      id: guardado.id,
      loteId: guardado.loteId,
      cantidad: Number(guardado.cantidad),
      motivo: guardado.motivo,
      fecha: guardado.fecha,
    };
  }

  async registrarSurtido(movimiento: MovimientoSurtido): Promise<void> {
    const movimientos = this.manager.getRepository(MovimientoSurtidoOrmEntity);

    const registro = movimientos.create({
      pedidoId: movimiento.pedidoId,
      productoId: movimiento.productoId,
    });

    const guardado = await movimientos.save(registro);

    const detalles = this.manager.getRepository(SurtidoLoteOrmEntity);

    const registros = movimiento.lotes.map((lote) =>
      detalles.create({
        movimientoId: guardado.id,
        loteId: lote.loteId,
        cantidad: String(lote.cantidad),
      }),
    );

    await detalles.save(registros);
  }
  async enTransaccion<T>(operacion: () => Promise<T>): Promise<T> {
    if (this.contexto.getStore()) {
      return operacion();
    }

    return this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      return this.contexto.run(manager, operacion);
    });
  }
}
