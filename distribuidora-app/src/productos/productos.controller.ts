import {
    Controller,
    Get,
    NotFoundException,
    Param,
    ParseIntPipe,
  } from '@nestjs/common';
import { MysqlProductosConsulta } from './infraestructura/mysql-productos.consulta';

@Controller('productos')
export class ProductosController {
  constructor(
    private readonly productos: MysqlProductosConsulta,
  ) {}

  @Get()
  async listar() {
    const productos = await this.productos.listar();

    return { data: productos };
  }

  @Get(':id')
async buscarPorId(
  @Param('id', ParseIntPipe) id: number,
) {
  const producto = await this.productos.buscarPorId(id);

  if (!producto) {
    throw new NotFoundException('Producto no encontrado');
  }

  return { data: producto };
}
}