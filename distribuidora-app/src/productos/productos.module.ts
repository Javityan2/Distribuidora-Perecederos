import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { ProductosController } from './productos.controller';
import { LotesController } from './lotes.controller';
import { PedidosController } from './pedidos.controller';
import { MermasController } from './mermas.controller';
import { ProductosService } from './productos.service';
import { PedidosService } from './pedidos.service';
import { InventarioService } from './dominio/inventario.service';
import type { InventarioRepository } from './dominio/inventario.repository';
import { INVENTARIO_REPOSITORY, CATALOGO_REPOSITORY } from './productos.tokens';
import { MysqlInventarioRepository } from './infraestructura/mysql-inventario.repository';
import { ProductoOrmEntity } from './infraestructura/producto.orm-entity';
import { LoteOrmEntity } from './infraestructura/lote.orm-entity';
import { PedidoOrmEntity } from './infraestructura/pedido.orm-entity';
import { MermaOrmEntity } from './infraestructura/merma.orm-entity';
import { MovimientoSurtidoOrmEntity } from './infraestructura/movimiento-surtido.orm-entity';
import { SurtidoLoteOrmEntity } from './infraestructura/surtido-lote.orm-entity';

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
  controllers: [
    ProductosController,
    LotesController,
    PedidosController,
    MermasController,
  ],
  providers: [
    MysqlInventarioRepository,
    { provide: INVENTARIO_REPOSITORY, useExisting: MysqlInventarioRepository },
    { provide: CATALOGO_REPOSITORY, useExisting: INVENTARIO_REPOSITORY },
    {
      provide: InventarioService,
      inject: [INVENTARIO_REPOSITORY],
      useFactory: (repo: InventarioRepository) => new InventarioService(repo),
    },
    ProductosService,
    PedidosService,
  ],
})
export class ProductosModule {}
