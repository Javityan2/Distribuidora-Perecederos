import { MigrationInterface, QueryRunner } from "typeorm";

export class AgregarPasswordHash1792709127226 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE usuarios
            ADD COLUMN password_hash VARCHAR(255) NOT NULL
          `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE usuarios
            DROP COLUMN password_hash
          `);
    }

}
