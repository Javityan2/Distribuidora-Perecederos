import 'dotenv/config';
import { DataSource } from 'typeorm';

function variable(nombre: string): string {
  const valor = process.env[nombre];

  if (valor === undefined) {
    throw new Error(`Falta configurar ${nombre}`);
  }

  return valor;
}

export default new DataSource({
  type: 'mysql',
  host: variable('DB_HOST'),
  port: Number(variable('DB_PORT')),
  username: variable('DB_USERNAME'),
  password: variable('DB_PASSWORD'),
  database: variable('DB_DATABASE'),
  entities: [],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});