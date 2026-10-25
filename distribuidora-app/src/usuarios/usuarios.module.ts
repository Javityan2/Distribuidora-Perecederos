import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsuarioOrmEntity } from './infraestructura/usuario.orm-entity';
import { MysqlUsuarioRepository } from './infraestructura/mysql-usuario.repository';
import { PasswordService } from './infraestructura/password.service';
import { RegistroUsuarioService } from './aplicacion/registro-usuario.service';
import { LoginService } from './aplicacion/login.service';
import { UsuariosService } from './usuarios.service';
import { AuthController } from './auth.controller';
import { UsuariosController } from './usuarios.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { USUARIO_REPOSITORY, CREDENCIALES_REPOSITORY } from './usuarios.tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsuarioOrmEntity]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.getOrThrow<string>('JWT_SECRET');
        if (secret.length < 32 || /REEMPLAZAR|GENERAR_CON/.test(secret))
          throw new Error('JWT_SECRET no cumple la configuración de seguridad');
        return {
          secret,
          signOptions: {
            algorithm: 'HS256' as const,
            expiresIn: '15m' as const,
          },
          verifyOptions: { algorithms: ['HS256' as const] },
        };
      },
    }),
  ],
  controllers: [AuthController, UsuariosController],
  providers: [
    PasswordService,
    MysqlUsuarioRepository,
    { provide: USUARIO_REPOSITORY, useExisting: MysqlUsuarioRepository },
    { provide: CREDENCIALES_REPOSITORY, useExisting: MysqlUsuarioRepository },
    RegistroUsuarioService,
    LoginService,
    UsuariosService,
    JwtAuthGuard,
    RolesGuard,
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_GUARD, useExisting: RolesGuard },
  ],
  exports: [UsuariosService, PasswordService],
})
export class UsuariosModule {}
