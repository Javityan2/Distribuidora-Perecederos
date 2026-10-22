import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductoOrmEntity } from './infraestructura/producto.orm-entity';
import { MysqlProductosConsulta } from './infraestructura/mysql-productos.consulta';
import { ProductosController } from './productos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductoOrmEntity])],
  providers: [MysqlProductosConsulta],
  controllers: [ProductosController],
})
export class ProductosModule {}