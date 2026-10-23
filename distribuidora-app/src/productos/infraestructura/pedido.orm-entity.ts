import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { EstadoPedido } from '../dominio/entidades';

@Entity('pedidos')
export class PedidoOrmEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number;

  @Column({
    name: 'cliente_id',
    type: 'int',
    unsigned: true,
  })
  clienteId!: number;

  @Column({ type: 'datetime', precision: 3 })
  fecha!: Date;

  @Column({
    type: 'enum',
    enum: ['recibido', 'surtido', 'en ruta', 'entregado'],
    default: 'recibido',
  })
  estado!: EstadoPedido;
}
