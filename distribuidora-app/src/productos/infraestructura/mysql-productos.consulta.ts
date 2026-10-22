import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from '../dominio/entidades';
import { ProductoOrmEntity } from './producto.orm-entity';

@Injectable()
export class MysqlProductosConsulta {
  constructor(
    @InjectRepository(ProductoOrmEntity)
    private readonly productos: Repository<ProductoOrmEntity>,
  ) {}

  async listar(): Promise<Producto[]> {
    const registros = await this.productos.find({
      order: { id: 'ASC' },
    });

    return registros.map((registro) => ({
      id: registro.id,
      nombre: registro.nombre,
      presentacion: registro.presentacion,
      unidadMedida: registro.unidadMedida,
      precioBase: Number(registro.precioBase),
      stockMinimo: Number(registro.stockMinimo),
    }));
  }
  async buscarPorId(id: number): Promise<Producto | null> {
    const registro = await this.productos.findOneBy({ id });
  
    if (!registro) {
      return null;
    }
  
    return {
      id: registro.id,
      nombre: registro.nombre,
      presentacion: registro.presentacion,
      unidadMedida: registro.unidadMedida,
      precioBase: Number(registro.precioBase),
      stockMinimo: Number(registro.stockMinimo),
    };
  }
}
