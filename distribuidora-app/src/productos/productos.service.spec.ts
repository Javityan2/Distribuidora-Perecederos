import { describe, it, expect } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { PedidosService } from './pedidos.service';
import { InventarioService } from './dominio/inventario.service';
import { InMemoryInventarioRepository } from './infraestructura/in-memory-inventario.repository';
import type { InventarioRepository } from './dominio/inventario.repository';
import { INVENTARIO_REPOSITORY, CATALOGO_REPOSITORY } from './productos.tokens';
import { InMemoryUsuarioRepository } from '../usuarios/infraestructura/in-memory-usuario.repository';
import { USUARIO_REPOSITORY } from '../usuarios/usuarios.tokens';
import { UsuariosService } from '../usuarios/usuarios.service';

describe('Servicios con repositorios intercambiables', () => {
  it('crea catálogo y pedidos usando memoria mediante los mismos tokens', async () => {
    const perfiles = new InMemoryUsuarioRepository();
    const cliente = await perfiles.crear({
      nombre: 'Restaurante',
      correo: 'restaurante@test.local',
    });
    const otro = await perfiles.crear({
      nombre: 'Otro restaurante',
      correo: 'otro@test.local',
    });
    const modulo = await Test.createTestingModule({
      providers: [
        {
          provide: INVENTARIO_REPOSITORY,
          useClass: InMemoryInventarioRepository,
        },
        { provide: CATALOGO_REPOSITORY, useExisting: INVENTARIO_REPOSITORY },
        { provide: USUARIO_REPOSITORY, useValue: perfiles },
        {
          provide: InventarioService,
          inject: [INVENTARIO_REPOSITORY],
          useFactory: (repo: InventarioRepository) =>
            new InventarioService(repo),
        },
        ProductosService,
        PedidosService,
        UsuariosService,
      ],
    }).compile();
    try {
      const productos = modulo.get(ProductosService);
      const pedidos = modulo.get(PedidosService);
      const producto = await productos.crear({
        nombre: 'Res',
        presentacion: 'Granel',
        unidadMedida: 'kg',
        precioBase: 180,
        stockMinimo: 5,
      });
      expect(await productos.buscar(producto.id)).toEqual(producto);
      expect(await productos.listar()).toHaveLength(1);
      const propio = await pedidos.crear({ clienteId: cliente.id }, cliente);
      await pedidos.crear({ clienteId: otro.id }, otro);
      expect(await pedidos.listar(cliente)).toEqual([propio]);
      await expect(
        pedidos.crear({ clienteId: otro.id }, cliente),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(pedidos.buscar(propio.id, otro)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    } finally {
      await modulo.close();
    }
  });
});
