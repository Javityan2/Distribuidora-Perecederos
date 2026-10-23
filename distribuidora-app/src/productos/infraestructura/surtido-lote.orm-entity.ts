import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('surtidos_lote')
export class SurtidoLoteOrmEntity {
  @PrimaryColumn({
    name: 'movimiento_id',
    type: 'int',
    unsigned: true,
  })
  movimientoId!: number;

  @PrimaryColumn({
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
}