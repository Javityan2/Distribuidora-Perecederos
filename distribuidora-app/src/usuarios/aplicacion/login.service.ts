import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { LoginDto } from '../dto/login.dto';
import { UsuarioOrmEntity } from '../infraestructura/usuario.orm-entity';
import { PasswordService } from '../infraestructura/password.service';

@Injectable()
export class LoginService {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarios: Repository<UsuarioOrmEntity>,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
  ) {}

  async iniciarSesion(datos: LoginDto) {
    const usuario = await this.usuarios
      .createQueryBuilder('usuario')
      .addSelect('usuario.passwordHash')
      .where('usuario.correo = :correo', {
        correo: datos.correo.trim().toLowerCase(),
      })
      .getOne();

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const coincide = await this.passwords.verificar(
      usuario.passwordHash,
      datos.password,
    );

    if (!coincide || !usuario.activo) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const accessToken = await this.jwt.signAsync({
      sub: usuario.id,
      rol: usuario.rol,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }
}
