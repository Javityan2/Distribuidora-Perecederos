import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioOrmEntity } from './infraestructura/usuario.orm-entity';
import { PasswordService } from './infraestructura/password.service';
import { RegistroUsuarioService } from './aplicacion/registro-usuario.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UsuarioOrmEntity])],
  providers: [
    PasswordService,
    RegistroUsuarioService,
  ],
  controllers: [AuthController],
})
export class UsuariosModule {}