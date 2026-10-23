import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('lotes')
export class LoteOrmEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number;

  @Column({
    name: 'producto_id',
    type: 'int',
    unsigned: true,
  })
  productoId!: number;

  @Column({ type: 'varchar', length: 150 })
  proveedor!: string;

  @Column({
    name: 'cantidad_disponible',
    type: 'decimal',
    precision: 12,
    scale: 3,
  })
  cantidadDisponible!: string;

  @Column({ name: 'fecha_ingreso', type: 'datetime', precision: 3 })
  fechaIngreso!: Date;

  @Column({ name: 'fecha_caducidad', type: 'datetime', precision: 3 })
  fechaCaducidad!: Date;
}