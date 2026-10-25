import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InventarioService } from './dominio/inventario.service';
import { ProductosService } from './productos.service';
import { CrearMermaDto } from './dto/crear-merma.dto';
import { Roles } from '../usuarios/roles.guard';

@ApiTags('Mermas')
@ApiBearerAuth()
@Roles('administrador', 'almacenista')
@Controller('mermas')
export class MermasController {
  constructor(
    private readonly inventario: InventarioService,
    private readonly productos: ProductosService,
  ) {}
  @Get()
  @ApiOperation({ summary: 'Consultar pérdidas registradas' })
  listar() {
    return this.productos.listarMermas();
  }
  @Post()
  @ApiOperation({ summary: 'Registrar una pérdida y descontar el lote' })
  crear(@Body() datos: CrearMermaDto) {
    return this.inventario.registrarMerma(datos);
  }
}
