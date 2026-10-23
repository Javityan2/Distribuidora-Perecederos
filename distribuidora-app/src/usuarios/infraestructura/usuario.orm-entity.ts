import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { RolUsuario } from '../dominio/entidades';

@Entity('usuarios')
export class UsuarioOrmEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @Column({ type: 'varchar', length: 254, unique: true })
  correo!: string;

  @Column({
    type: 'enum',
    enum: ['administrador', 'almacenista', 'cliente'],
    default: 'cliente',
  })
  rol!: RolUsuario;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    select: false,
  })
  passwordHash!: string;
}
