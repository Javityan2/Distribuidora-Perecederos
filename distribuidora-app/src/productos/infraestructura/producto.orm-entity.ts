import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('productos')
export class ProductoOrmEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number;

  @Column({ type: 'varchar', length: 120 })
  nombre!: string;

  @Column({ type: 'varchar', length: 100 })
  presentacion!: string;

  @Column({
    name: 'unidad_medida',
    type: 'enum',
    enum: ['kg', 'pieza', 'caja'],
  })
  unidadMedida!: 'kg' | 'pieza' | 'caja';

  @Column({
    name: 'precio_base',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  precioBase!: string;

  @Column({
    name: 'stock_minimo',
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
  })
  stockMinimo!: string;
}
