import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    Unique,
  } from 'typeorm';
  
  @Entity('movimientos_surtido')
  @Unique('uq_surtido_pedido_producto', ['pedidoId', 'productoId'])
  export class MovimientoSurtidoOrmEntity {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id!: number;
  
    @Column({ name: 'pedido_id', type: 'int', unsigned: true })
    pedidoId!: number;
  
    @Column({ name: 'producto_id', type: 'int', unsigned: true })
    productoId!: number;
  }