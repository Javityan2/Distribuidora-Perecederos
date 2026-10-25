import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InventarioService } from './dominio/inventario.service';
import { CrearLoteDto } from './dto/crear-lote.dto';
import { Roles } from '../usuarios/roles.guard';

@ApiTags('Lotes')
@ApiBearerAuth()
@Roles('administrador', 'almacenista')
@Controller('lotes')
export class LotesController {
  constructor(private readonly inventario: InventarioService) {}
  @Post()
  @ApiOperation({ summary: 'Registrar un ingreso de mercancía vigente' })
  crear(@Body() datos: CrearLoteDto) {
    return this.inventario.registrarLote({
      ...datos,
      fechaIngreso: new Date(datos.fechaIngreso),
      fechaCaducidad: new Date(datos.fechaCaducidad),
    });
  }
}
