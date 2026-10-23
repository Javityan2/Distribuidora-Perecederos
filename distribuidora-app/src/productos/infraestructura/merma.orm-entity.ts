import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { MotivoMerma } from '../dominio/entidades';

@Entity('mermas')
export class MermaOrmEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number;

  @Column({
    name: 'lote_id',
    type: 'int',
    unsigned: true,
  })
  loteId!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
  })
  cantidad!: string;

  @Column({
    type: 'enum',
    enum: ['caducidad', 'daño', 'faltante'],
  })
  motivo!: MotivoMerma;

  @Column({ type: 'datetime', precision: 3 })
  fecha!: Date;
}