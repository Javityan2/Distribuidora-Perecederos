import { UsuariosModule } from '../usuarios/usuarios.module';
import { InventarioController } from './inventario.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductoOrmEntity } from './infraestructura/producto.orm-entity';
import { MysqlProductosConsulta } from './infraestructura/mysql-productos.consulta';
import { ProductosController } from './productos.controller';
import { LoteOrmEntity } from './infraestructura/lote.orm-entity';
import { PedidoOrmEntity } from './infraestructura/pedido.orm-entity';
import { MermaOrmEntity } from './infraestructura/merma.orm-entity';
import { MovimientoSurtidoOrmEntity } from './infraestructura/movimiento-surtido.orm-entity';
import { SurtidoLoteOrmEntity } from './infraestructura/surtido-lote.orm-entity';
import { MysqlInventarioRepository } from './infraestructura/mysql-inventario.repository';
import { InventarioService } from './dominio/inventario.service';

@Module({
  imports: [
    UsuariosModule,
    TypeOrmModule.forFeature([
      ProductoOrmEntity,
      LoteOrmEntity,
      PedidoOrmEntity,
      MermaOrmEntity,
      MovimientoSurtidoOrmEntity,
      SurtidoLoteOrmEntity,
    ]),
  ],
  providers: [
    MysqlProductosConsulta,
    MysqlInventarioRepository,
    {
      provide: InventarioService,
      inject: [MysqlInventarioRepository],
      useFactory: (repositorio: MysqlInventarioRepository) =>
        new InventarioService(repositorio),
    },
  ],
  controllers: [ProductosController, InventarioController],
})
export class ProductosModule {}
