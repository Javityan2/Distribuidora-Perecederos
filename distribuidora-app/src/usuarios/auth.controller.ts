import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegistroUsuarioService } from './aplicacion/registro-usuario.service';
import { LoginService } from './aplicacion/login.service';
import { RegistroUsuarioDto } from './dto/registro-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { Publico } from './decoradores/publico.decorator';
import { UsuarioActual } from './decoradores/usuario-actual.decorator';
import type { Usuario } from './dominio/entidades';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registro: RegistroUsuarioService,
    private readonly login: LoginService,
  ) {}
  @Publico()
  @Post('registro')
  @ApiOperation({ summary: 'Registrar un cliente' })
  registrar(@Body() datos: RegistroUsuarioDto) {
    return this.registro.registrar(datos);
  }
  @Publico()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Iniciar sesión y emitir una credencial de 15 minutos',
  })
  iniciarSesion(@Body() datos: LoginDto) {
    return this.login.iniciarSesion(datos);
  }
  @ApiBearerAuth()
  @Get('perfil')
  @ApiOperation({ summary: 'Consultar el usuario autenticado' })
  obtenerPerfil(@UsuarioActual() usuario: Usuario) {
    return usuario;
  }
}
