import { InventarioRepository } from './inventario.repository';
import {
  LineaPedido,
  MovimientoSurtido,
  NuevoLote,
  NuevoPedido,
  Merma,
} from './entidades';
import {
  CantidadInvalidaError,
  FechaInvalidaError,
  InventarioInsuficienteError,
  LoteNoEncontradoError,
  PedidoNoEncontradoError,
  PedidoYaSurtidoError,
  ProductoCaducadoError,
  ProductoNoEncontradoError,
  StockMinimoComprometidoError,
} from './errores';

// Independiente de Nest y HTTP. El reloj se inyecta para reproducir escenarios.
export class InventarioService {
  constructor(
    private readonly repo: InventarioRepository,
    private readonly ahora = () => new Date(),
  ) {}

  private cantidad(valor: number) {
    if (!Number.isFinite(valor) || valor <= 0)
      throw new CantidadInvalidaError(valor);
  }

  crearPedido(datos: NuevoPedido) {
    return this.repo.enTransaccion(() => this.repo.crearPedido(datos));
  }

  registrarLote(datos: NuevoLote) {
    return this.repo.enTransaccion(async () => {
      this.cantidad(datos.cantidadDisponible);
      if (!(await this.repo.buscarProducto(datos.productoId)))
        throw new ProductoNoEncontradoError(datos.productoId);
      if (
        !Number.isFinite(datos.fechaIngreso.getTime()) ||
        !Number.isFinite(datos.fechaCaducidad.getTime()) ||
        datos.fechaCaducidad <= datos.fechaIngreso
      )
        throw new FechaInvalidaError();
      if (datos.fechaCaducidad <= this.ahora())
        throw new ProductoCaducadoError(datos.productoId, 0);
      return this.repo.crearLote(datos);
    });
  }

  surtirPedido(
    pedidoId: number,
    lineas: LineaPedido[],
  ): Promise<MovimientoSurtido[]> {
    return this.repo.enTransaccion(async () => {
      const pedido = await this.repo.buscarPedido(pedidoId);
      if (!pedido) throw new PedidoNoEncontradoError(pedidoId);
      if (pedido.estado !== 'recibido')
        throw new PedidoYaSurtidoError(pedidoId);
      if (!lineas.length) throw new CantidadInvalidaError(0);
      const totales = new Map<number, number>();
      for (const linea of lineas) {
        this.cantidad(linea.cantidad);
        const total = (totales.get(linea.productoId) ?? 0) + linea.cantidad;
        this.cantidad(total);
        totales.set(linea.productoId, total);
      }
      const fecha = this.ahora();
      const movimientos: MovimientoSurtido[] = [];
      for (const [productoId, cantidad] of totales) {
        const producto = await this.repo.buscarProducto(productoId);
        if (!producto) throw new ProductoNoEncontradoError(productoId);
        const lotes = (await this.repo.listarLotesProducto(productoId))
          .filter(
            (l) =>
              l.fechaIngreso <= fecha &&
              l.fechaCaducidad > fecha &&
              l.cantidadDisponible > 0,
          )
          .sort(
            (a, b) =>
              a.fechaCaducidad.getTime() - b.fechaCaducidad.getTime() ||
              a.id - b.id,
          );
        const disponible = lotes.reduce(
          (total, l) => total + l.cantidadDisponible,
          0,
        );
        if (cantidad > disponible)
          throw new InventarioInsuficienteError(
            productoId,
            cantidad,
            disponible,
          );
        if (disponible - cantidad < producto.stockMinimo)
          throw new StockMinimoComprometidoError(
            productoId,
            producto.stockMinimo,
          );
        const movimiento: MovimientoSurtido = {
          pedidoId,
          productoId,
          lotes: [],
        };
        let restante = cantidad;
        for (const lote of lotes) {
          if (restante <= 0) break;
          const tomada = Math.min(restante, lote.cantidadDisponible);
          await this.repo.actualizarLote({
            ...lote,
            cantidadDisponible: lote.cantidadDisponible - tomada,
          });
          movimiento.lotes.push({ loteId: lote.id, cantidad: tomada });
          restante -= tomada;
        }
        await this.repo.registrarSurtido(movimiento);
        movimientos.push(movimiento);
      }
      await this.repo.actualizarPedido({ ...pedido, estado: 'surtido' });
      return movimientos;
    });
  }

  registrarMerma(datos: Omit<Merma, 'id' | 'fecha'>) {
    return this.repo.enTransaccion(async () => {
      this.cantidad(datos.cantidad);
      const lote = await this.repo.buscarLote(datos.loteId);
      if (!lote) throw new LoteNoEncontradoError(datos.loteId);
      if (datos.cantidad > lote.cantidadDisponible)
        throw new InventarioInsuficienteError(
          lote.productoId,
          datos.cantidad,
          lote.cantidadDisponible,
        );
      await this.repo.actualizarLote({
        ...lote,
        cantidadDisponible: lote.cantidadDisponible - datos.cantidad,
      });
      return this.repo.registrarMerma({ ...datos, fecha: this.ahora() });
    });
  }
}
