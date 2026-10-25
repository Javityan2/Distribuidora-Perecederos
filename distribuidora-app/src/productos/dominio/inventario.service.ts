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
    if (
      !Number.isFinite(valor) ||
      valor <= 0 ||
      valor > 999999999.999 ||
      Math.abs(valor - Math.round(valor * 1000) / 1000) >
        Number.EPSILON * Math.max(1, Math.abs(valor)) * 2
    )
      throw new CantidadInvalidaError(valor);
  }

  private milesimas(valor: number): number {
    return Math.round(valor * 1000);
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
        throw new ProductoCaducadoError(datos.productoId);
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
        const total =
          (totales.get(linea.productoId) ?? 0) + this.milesimas(linea.cantidad);
        this.cantidad(total / 1000);
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
          (total, l) => total + this.milesimas(l.cantidadDisponible),
          0,
        );
        if (cantidad > disponible)
          throw new InventarioInsuficienteError(
            productoId,
            cantidad / 1000,
            disponible / 1000,
          );
        if (disponible - cantidad < this.milesimas(producto.stockMinimo))
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
          const tomada = Math.min(
            restante,
            this.milesimas(lote.cantidadDisponible),
          );
          await this.repo.actualizarLote({
            ...lote,
            cantidadDisponible:
              (this.milesimas(lote.cantidadDisponible) - tomada) / 1000,
          });
          movimiento.lotes.push({ loteId: lote.id, cantidad: tomada / 1000 });
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
      if (
        this.milesimas(datos.cantidad) > this.milesimas(lote.cantidadDisponible)
      )
        throw new InventarioInsuficienteError(
          lote.productoId,
          datos.cantidad,
          lote.cantidadDisponible,
        );
      await this.repo.actualizarLote({
        ...lote,
        cantidadDisponible:
          (this.milesimas(lote.cantidadDisponible) -
            this.milesimas(datos.cantidad)) /
          1000,
      });
      return this.repo.registrarMerma({ ...datos, fecha: this.ahora() });
    });
  }
}
