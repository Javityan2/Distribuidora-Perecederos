import { MysqlUsuarioRepository } from './infraestructura/mysql-usuario.repository';
import { RolesGuard } from './roles.guard';
import { UsuariosController } from './usuarios.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioOrmEntity } from './infraestructura/usuario.orm-entity';
import { PasswordService } from './infraestructura/password.service';
import { RegistroUsuarioService } from './aplicacion/registro-usuario.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginService } from './aplicacion/login.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsuarioOrmEntity]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: '15m',
        },
        verifyOptions: {
          algorithms: ['HS256'],
        },
      }),
    }),
  ],
  providers: [
    PasswordService,
    MysqlUsuarioRepository,
    RegistroUsuarioService,
    LoginService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    JwtModule,
    TypeOrmModule,
    JwtAuthGuard,
    RolesGuard,
    PasswordService,
  ],
  controllers: [AuthController, UsuariosController],
})
export class UsuariosModule {}
