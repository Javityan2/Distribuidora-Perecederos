import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { InventarioService } from './dominio/inventario.service';
import { MysqlInventarioRepository } from './infraestructura/mysql-inventario.repository';
import { LoteDto, MermaDto, PedidoDto, SurtidoDto } from './dto/inventario.dto';
import { JwtAuthGuard } from '../usuarios/jwt-auth.guard';
import type { RequestAutenticada } from '../usuarios/jwt-auth.guard';
import { Roles, RolesGuard } from '../usuarios/roles.guard';
import { UsuarioOrmEntity } from '../usuarios/infraestructura/usuario.orm-entity';
import { PedidoOrmEntity } from './infraestructura/pedido.orm-entity';
import { MermaOrmEntity } from './infraestructura/merma.orm-entity';
@ApiTags('Inventario y pedidos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class InventarioController {
  constructor(
    private readonly servicio: InventarioService,
    private readonly repo: MysqlInventarioRepository,
    private readonly db: DataSource,
  ) {}
  @Get('productos/:id/lotes')
  @Roles('administrador', 'almacenista')
  async lotes(@Param('id', ParseIntPipe) id: number) {
    if (!(await this.repo.buscarProducto(id)))
      throw new NotFoundException('Producto no encontrado');
    return { data: await this.repo.listarLotesProducto(id) };
  }
  @Post('lotes')
  @Roles('administrador', 'almacenista')
  async lote(@Body() datos: LoteDto) {
    return {
      data: await this.servicio.registrarLote({
        ...datos,
        fechaIngreso: new Date(datos.fechaIngreso),
        fechaCaducidad: new Date(datos.fechaCaducidad),
      }),
    };
  }
  @Get('pedidos')
  async pedidos(@Req() req: RequestAutenticada) {
    return {
      data: await this.db.getRepository(PedidoOrmEntity).find({
        where:
          req.usuario!.rol === 'cliente' ? { clienteId: req.usuario!.id } : {},
        order: { id: 'DESC' },
      }),
    };
  }
  @Post('pedidos')
  async pedido(@Body() datos: PedidoDto, @Req() req: RequestAutenticada) {
    if (req.usuario!.rol === 'cliente' && datos.clienteId !== req.usuario!.id)
      throw new ForbiddenException('Solo puedes crear tus propios pedidos');
    const cliente = await this.db
      .getRepository(UsuarioOrmEntity)
      .findOneBy({ id: datos.clienteId, rol: 'cliente', activo: true });
    if (!cliente) throw new NotFoundException('Cliente activo no encontrado');
    return { data: await this.servicio.crearPedido(datos) };
  }
  @Get('pedidos/:id')
  async consultar(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestAutenticada,
  ) {
    const pedido = await this.repo.buscarPedido(id);
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (req.usuario!.rol === 'cliente' && pedido.clienteId !== req.usuario!.id)
      throw new ForbiddenException('El pedido pertenece a otro cliente');
    return { data: pedido };
  }
  @Post('pedidos/:id/surtidos')
  @Roles('administrador', 'almacenista')
  async surtir(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: SurtidoDto,
  ) {
    return { data: await this.servicio.surtirPedido(id, datos.lineas) };
  }
  @Get('mermas')
  @Roles('administrador', 'almacenista')
  async mermas() {
    return {
      data: (
        await this.db
          .getRepository(MermaOrmEntity)
          .find({ order: { id: 'DESC' } })
      ).map((m) => ({ ...m, cantidad: Number(m.cantidad) })),
    };
  }
  @Post('mermas')
  @Roles('administrador', 'almacenista')
  async merma(@Body() datos: MermaDto) {
    return { data: await this.servicio.registrarMerma(datos) };
  }
}
