import { MigrationInterface, QueryRunner } from "typeorm";

export class CrearInventario1792703804844 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE usuarios (
              id INT UNSIGNED NOT NULL AUTO_INCREMENT,
              nombre VARCHAR(150) NOT NULL,
              correo VARCHAR(254) NOT NULL,
              rol ENUM('administrador', 'almacenista', 'cliente')
                NOT NULL DEFAULT 'cliente',
              activo BOOLEAN NOT NULL DEFAULT TRUE,
              PRIMARY KEY (id),
              UNIQUE KEY uq_usuarios_correo (correo)
            ) ENGINE=InnoDB;
          `);
          await queryRunner.query(`
            CREATE TABLE productos (
              id INT UNSIGNED NOT NULL AUTO_INCREMENT,
              nombre VARCHAR(120) NOT NULL,
              presentacion VARCHAR(100) NOT NULL,
              unidad_medida ENUM('kg', 'pieza', 'caja') NOT NULL,
              precio_base DECIMAL(12,2) NOT NULL,
              stock_minimo DECIMAL(12,3) NOT NULL DEFAULT 0,
              PRIMARY KEY (id),
              CHECK (precio_base >= 0),
              CHECK (stock_minimo >= 0)
            ) ENGINE=InnoDB;
          `);
          
          await queryRunner.query(`
            CREATE TABLE lotes (
              id INT UNSIGNED NOT NULL AUTO_INCREMENT,
              producto_id INT UNSIGNED NOT NULL,
              proveedor VARCHAR(150) NOT NULL,
              cantidad_disponible DECIMAL(12,3) NOT NULL,
              fecha_ingreso DATETIME(3) NOT NULL,
              fecha_caducidad DATETIME(3) NOT NULL,
              PRIMARY KEY (id),
              CONSTRAINT fk_lotes_producto
                FOREIGN KEY (producto_id) REFERENCES productos(id),
              CHECK (cantidad_disponible >= 0),
              CHECK (fecha_caducidad > fecha_ingreso)
            ) ENGINE=InnoDB;
          `);
          await queryRunner.query(`
            CREATE TABLE pedidos (
              id INT UNSIGNED NOT NULL AUTO_INCREMENT,
              cliente_id INT UNSIGNED NOT NULL,
              fecha DATETIME(3) NOT NULL,
              estado ENUM('recibido', 'surtido', 'en ruta', 'entregado')
                NOT NULL DEFAULT 'recibido',
              PRIMARY KEY (id),
              CONSTRAINT fk_pedidos_cliente
                FOREIGN KEY (cliente_id) REFERENCES usuarios(id)
            ) ENGINE=InnoDB;
          `);
          
          await queryRunner.query(`
            CREATE TABLE movimientos_surtido (
              id INT UNSIGNED NOT NULL AUTO_INCREMENT,
              pedido_id INT UNSIGNED NOT NULL,
              producto_id INT UNSIGNED NOT NULL,
              PRIMARY KEY (id),
              UNIQUE KEY uq_surtido_pedido_producto (pedido_id, producto_id),
              CONSTRAINT fk_movimientos_pedido
                FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
              CONSTRAINT fk_movimientos_producto
                FOREIGN KEY (producto_id) REFERENCES productos(id)
            ) ENGINE=InnoDB;
          `);
          
          await queryRunner.query(`
            CREATE TABLE surtidos_lote (
              movimiento_id INT UNSIGNED NOT NULL,
              lote_id INT UNSIGNED NOT NULL,
              cantidad DECIMAL(12,3) NOT NULL,
              PRIMARY KEY (movimiento_id, lote_id),
              CONSTRAINT fk_surtidos_movimiento
                FOREIGN KEY (movimiento_id) REFERENCES movimientos_surtido(id),
              CONSTRAINT fk_surtidos_lote
                FOREIGN KEY (lote_id) REFERENCES lotes(id),
              CHECK (cantidad > 0)
            ) ENGINE=InnoDB;
          `);
          await queryRunner.query(`
            CREATE TABLE mermas (
              id INT UNSIGNED NOT NULL AUTO_INCREMENT,
              lote_id INT UNSIGNED NOT NULL,
              cantidad DECIMAL(12,3) NOT NULL,
              motivo ENUM('caducidad', 'daño', 'faltante') NOT NULL,
              fecha DATETIME(3) NOT NULL,
              PRIMARY KEY (id),
              CONSTRAINT fk_mermas_lote
                FOREIGN KEY (lote_id) REFERENCES lotes(id),
              CHECK (cantidad > 0)
            ) ENGINE=InnoDB;
          `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE mermas');
        await queryRunner.query('DROP TABLE surtidos_lote');
        await queryRunner.query('DROP TABLE movimientos_surtido');
        await queryRunner.query('DROP TABLE pedidos');
        await queryRunner.query('DROP TABLE lotes');
        await queryRunner.query('DROP TABLE productos');
        await queryRunner.query('DROP TABLE usuarios');
    }

}
