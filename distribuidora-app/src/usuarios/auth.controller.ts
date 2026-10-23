import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Body, Controller, Post } from '@nestjs/common';
import { RegistroUsuarioService } from './aplicacion/registro-usuario.service';
import { RegistroUsuarioDto } from './dto/registro-usuario.dto';
import { HttpCode } from '@nestjs/common';
import { LoginService } from './aplicacion/login.service';
import { LoginDto } from './dto/login.dto';
import { Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { RequestAutenticada } from './jwt-auth.guard';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registro: RegistroUsuarioService,
    private readonly login: LoginService,
  ) {}

  @Post('registro')
  async registrar(@Body() datos: RegistroUsuarioDto) {
    const usuario = await this.registro.registrar(datos);

    return { data: usuario };
  }

  @Post('login')
  @HttpCode(200)
  async iniciarSesion(@Body() datos: LoginDto) {
    const resultado = await this.login.iniciarSesion(datos);

    return { data: resultado };
  }
  @ApiBearerAuth()
  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  obtenerPerfil(@Req() request: RequestAutenticada) {
    return { data: request.usuario };
  }
}
