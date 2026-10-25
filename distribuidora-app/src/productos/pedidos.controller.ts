import type { Response } from 'express';
import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InventarioService } from './dominio/inventario.service';
import { PedidosService } from './pedidos.service';
import { CrearPedidoDto } from './dto/crear-pedido.dto';
import { CrearSurtidoDto } from './dto/crear-surtido.dto';
import { Roles } from '../usuarios/roles.guard';
import { UsuarioActual } from '../usuarios/decoradores/usuario-actual.decorator';
import type { Usuario } from '../usuarios/dominio/entidades';
import { IdPositivoPipe } from '../comun/pipes/id-positivo.pipe';

@ApiTags('Pedidos')
@ApiBearerAuth()
@Controller('pedidos')
export class PedidosController {
  constructor(
    private readonly pedidos: PedidosService,
    private readonly inventario: InventarioService,
  ) {}
  @Get()
  @ApiOperation({ summary: 'Consultar pedidos visibles para el usuario' })
  listar(@UsuarioActual() usuario: Usuario) {
    return this.pedidos.listar(usuario);
  }
  @Post()
  @ApiOperation({ summary: 'Crear un pedido recibido' })
  async crear(
    @Body() datos: CrearPedidoDto,
    @UsuarioActual() usuario: Usuario,
    @Res({ passthrough: true }) respuesta: Response,
  ) {
    const pedido = await this.pedidos.crear(datos, usuario);
    respuesta.setHeader('Location', `/pedidos/${pedido.id}`);
    return pedido;
  }
  @Get(':id')
  @ApiOperation({ summary: 'Consultar un pedido y comprobar su propietario' })
  buscar(
    @Param('id', IdPositivoPipe) id: number,
    @UsuarioActual() usuario: Usuario,
  ) {
    return this.pedidos.buscar(id, usuario);
  }
  @Post(':id/surtidos')
  @Roles('administrador', 'almacenista')
  @ApiOperation({ summary: 'Surtir el pedido mediante rotación FEFO' })
  surtir(
    @Param('id', IdPositivoPipe) id: number,
    @Body() datos: CrearSurtidoDto,
  ) {
    return this.inventario.surtirPedido(id, datos.lineas);
  }
}
