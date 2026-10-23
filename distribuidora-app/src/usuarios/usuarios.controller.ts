import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioOrmEntity } from './infraestructura/usuario.orm-entity';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles, RolesGuard } from './roles.guard';
@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarios: Repository<UsuarioOrmEntity>,
  ) {}
  @Get()
  @Roles('administrador')
  async listar() {
    return { data: await this.usuarios.find({ order: { id: 'ASC' } }) };
  }
}
