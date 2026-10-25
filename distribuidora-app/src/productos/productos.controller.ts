import type { Response } from 'express';
import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { Roles } from '../usuarios/roles.guard';
import { Publico } from '../usuarios/decoradores/publico.decorator';
import { IdPositivoPipe } from '../comun/pipes/id-positivo.pipe';

@ApiTags('Productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productos: ProductosService) {}
  @Publico()
  @Get()
  @ApiOperation({ summary: 'Consultar el catálogo público' })
  listar() {
    return this.productos.listar();
  }
  @Publico()
  @Get(':id')
  @ApiOperation({ summary: 'Buscar un producto por identificador' })
  buscar(@Param('id', IdPositivoPipe) id: number) {
    return this.productos.buscar(id);
  }
  @Post()
  @ApiBearerAuth()
  @Roles('administrador')
  @ApiOperation({ summary: 'Registrar un producto' })
  async crear(
    @Body() datos: CrearProductoDto,
    @Res({ passthrough: true }) respuesta: Response,
  ) {
    const producto = await this.productos.crear(datos);
    respuesta.setHeader('Location', `/productos/${producto.id}`);
    return producto;
  }
  @Get(':id/lotes')
  @ApiBearerAuth()
  @Roles('administrador', 'almacenista')
  @ApiOperation({ summary: 'Consultar los lotes de un producto' })
  listarLotes(@Param('id', IdPositivoPipe) id: number) {
    return this.productos.listarLotes(id);
  }
}
