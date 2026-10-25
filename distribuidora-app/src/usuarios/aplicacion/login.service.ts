import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { LoginDto } from '../dto/login.dto';
import type { CredencialesRepository } from '../dominio/credenciales.repository';
import { CREDENCIALES_REPOSITORY } from '../usuarios.tokens';
import { PasswordService } from '../infraestructura/password.service';

@Injectable()
export class LoginService {
  constructor(
    @Inject(CREDENCIALES_REPOSITORY)
    private readonly repo: CredencialesRepository,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
  ) {}
  async iniciarSesion(datos: LoginDto) {
    const usuario = await this.repo.buscarPorCorreo(
      datos.correo.trim().toLowerCase(),
    );
    const coincide = await this.passwords.verificarCredencial(
      usuario?.passwordHash,
      datos.password,
    );
    if (!usuario || !coincide || !usuario.activo)
      throw new UnauthorizedException('Credenciales incorrectas');
    return {
      accessToken: await this.jwt.signAsync({
        sub: usuario.id,
        rol: usuario.rol,
      }),
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }
}
