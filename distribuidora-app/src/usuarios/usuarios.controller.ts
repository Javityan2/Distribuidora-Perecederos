import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from './roles.guard';
import { UsuariosService } from './usuarios.service';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}
  @Get()
  @Roles('administrador')
  @ApiOperation({ summary: 'Listar perfiles sin credenciales' })
  listar() {
    return this.usuarios.listar();
  }
}
