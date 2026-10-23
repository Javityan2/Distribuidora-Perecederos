import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { MysqlInventarioRepository } from './infraestructura/mysql-inventario.repository';
import { ProductoOrmEntity } from './infraestructura/producto.orm-entity';
import { ProductoDto } from './dto/inventario.dto';
import { JwtAuthGuard } from '../usuarios/jwt-auth.guard';
import { Roles, RolesGuard } from '../usuarios/roles.guard';
@ApiTags('Productos')
@Controller('productos')
export class ProductosController {
  constructor(
    private readonly productos: MysqlInventarioRepository,
    private readonly db: DataSource,
  ) {}
  @Get() async listar() {
    return { data: await this.productos.listarProductos() };
  }
  @Get(':id') async buscarPorId(@Param('id', ParseIntPipe) id: number) {
    const producto = await this.productos.buscarProducto(id);
    if (!producto) throw new NotFoundException('Producto no encontrado');
    return { data: producto };
  }
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrador')
  async crear(@Body() datos: ProductoDto) {
    const repo = this.db.getRepository(ProductoOrmEntity);
    const guardado = await repo.save(
      repo.create({
        ...datos,
        precioBase: String(datos.precioBase),
        stockMinimo: String(datos.stockMinimo),
      }),
    );
    return { data: await this.productos.buscarProducto(guardado.id) };
  }
}
