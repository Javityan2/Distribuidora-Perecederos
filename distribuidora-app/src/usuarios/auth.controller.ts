import { Body, Controller, Post } from '@nestjs/common';
import { RegistroUsuarioService } from './aplicacion/registro-usuario.service';
import { RegistroUsuarioDto } from './dto/registro-usuario.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registro: RegistroUsuarioService,
  ) {}

  @Post('registro')
  async registrar(@Body() datos: RegistroUsuarioDto) {
    const usuario = await this.registro.registrar(datos);

    return { data: usuario };
  }
}