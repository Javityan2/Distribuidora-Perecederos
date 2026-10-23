# Distribuidora de perecederos

Desarrollé este proyecto para administrar el inventario y la distribución de carnes a restaurantes. El sistema organiza las existencias por lotes, utiliza la fecha de caducidad para decidir el orden de surtido y registra las pérdidas por merma.

El código del avance 2 está en la rama `feat-servicio` de [Distribuidora-Perecederos](https://github.com/Javityan2/Distribuidora-Perecederos).

## Arquitectura

Separé las reglas del negocio de la entrada HTTP y del almacenamiento. `InventarioService` trabaja con el contrato `InventarioRepository`; la implementación MySQL se selecciona en `ProductosModule`. Los repositorios en memoria se conservan para ejecutar los escenarios del dominio.

La aplicación utiliza NestJS 11, TypeScript, TypeORM y MySQL 8. La autenticación utiliza JWT con vencimiento de 15 minutos y las contraseñas se almacenan mediante Argon2id.

## Funcionalidades

- Consulta de productos y creación de productos por el administrador.
- Registro de lotes con proveedor, cantidad y fechas de ingreso y caducidad.
- Creación y consulta de pedidos con acceso limitado al cliente propietario.
- Surtido FEFO: primero se utiliza el lote vigente que caduca antes.
- Protección del stock mínimo y rechazo de surtidos duplicados.
- Registro de mermas por caducidad, daño o faltante.
- Registro de usuarios, inicio de sesión y permisos por rol.

## Organización

| Carpeta | Contenido |
|---|---|
| `distribuidora-app/src/productos` | Dominio, persistencia y rutas del inventario |
| `distribuidora-app/src/usuarios` | Usuarios, autenticación y autorización |
| `distribuidora-app/src/database` | Conexión, migraciones y datos iniciales |
| `distribuidora-app/src/common` | Configuración HTTP y manejo de errores |
| `distribuidora-app/test` | Pruebas HTTP y de integración con MySQL |
| `docs` | Fuentes de la documentación |
| `output/pdf` | Documentos de los avances |

## Entorno y ejecución

El proyecto se verificó con Node.js 26.8.1 y MySQL Server 8.0.41. La configuración local reside en `distribuidora-app/.env`, excluido del control de versiones. `.env.example` contiene los nombres de las variables y valores de referencia.

La preparación de una copia nueva corresponde a la siguiente secuencia:

```powershell
git clone https://github.com/Javityan2/Distribuidora-Perecederos.git
cd Distribuidora-Perecederos
git switch feat-servicio
cd distribuidora-app
npm ci
Copy-Item .env.example .env
```

La base de datos se crea en MySQL con:

```sql
CREATE DATABASE distribuidora_perecederos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Las variables `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` y `DB_DATABASE` definen la conexión. `JWT_SECRET` corresponde a una clave aleatoria local; su generación utiliza:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Las variables `SEED_ADMIN_PASSWORD`, `SEED_ALMACEN_PASSWORD` y `SEED_CLIENTE_PASSWORD` contienen contraseñas locales de al menos 12 caracteres. Los valores `REEMPLAZAR` del ejemplo no son credenciales válidas. Ninguna contraseña real ni clave JWT forma parte del repositorio.

Con los valores locales configurados, la estructura, los datos iniciales y el servidor se preparan con:

```powershell
npm run migration:run
npm run migration:show
npm run seed
npm run build
npm run start:dev
```

La API utiliza el puerto 3000 por defecto. La documentación interactiva está disponible en [localhost:3000/docs](http://localhost:3000/docs) y el contrato OpenAPI en `/docs-json`.

## Datos iniciales

| Cuenta | Rol | Variable de contraseña |
|---|---|---|
| `admin@distribuidora.local` | administrador | `SEED_ADMIN_PASSWORD` |
| `almacen@distribuidora.local` | almacenista | `SEED_ALMACEN_PASSWORD` |
| `restaurante@distribuidora.local` | cliente | `SEED_CLIENTE_PASSWORD` |

El seed crea los registros faltantes sin sobrescribir contraseñas ni saldos. Incluye un producto, dos lotes vigentes de 10 kg, un lote caducado de 50 kg y un pedido recibido. Las fechas son relativas a la primera ejecución y las existencias cambian con las operaciones posteriores.

## Roles y puntos de entrada

| Método y ruta | Acceso |
|---|---|
| `GET /` | Público |
| `GET /productos`, `GET /productos/:id` | Público |
| `POST /productos` | Administrador |
| `POST /auth/registro`, `POST /auth/login` | Público |
| `GET /auth/perfil` | Usuario autenticado y activo |
| `GET /usuarios` | Administrador |
| `GET /productos/:id/lotes`, `POST /lotes` | Administrador y almacenista |
| `GET /pedidos`, `GET /pedidos/:id`, `POST /pedidos` | Cliente: propios; personal: todos |
| `POST /pedidos/:id/surtidos` | Administrador y almacenista |
| `GET /mermas`, `POST /mermas` | Administrador y almacenista |

El registro público asigna el rol cliente. Las credenciales se envían mediante `Authorization: Bearer <token>`. El guard verifica la firma, el vencimiento y el estado del usuario; los permisos se comprueban con el rol actual en MySQL.

## Contrato HTTP

Las respuestas exitosas tienen la forma `{ "data": ... }`. Los errores tienen la forma `{ "data": null, "error": { "codigo": "...", "mensaje": "..." }, "meta": { "statusCode": 409, "path": "/..." } }`.

| Estado | Significado |
|---|---|
| 200 | Consulta o inicio de sesión correcto |
| 201 | Recurso creado |
| 400 | Datos de entrada mal formados |
| 401 | Credencial ausente, inválida o vencida |
| 403 | Rol o propietario sin permiso |
| 404 | Recurso inexistente |
| 409 | Restricción del negocio o conflicto con los datos |

Una cantidad numérica cero o negativa llega al dominio y genera un conflicto; un texto en un campo numérico genera una petición inválida. Los detalles SQL y las credenciales no aparecen en las respuestas.

## Persistencia y configuración

El historial contiene dos migraciones: creación del inventario e incorporación de `password_hash`. `synchronize` está desactivado. Los descuentos, movimientos y cambios de estado se agrupan en transacciones SERIALIZABLE; un error revierte la operación completa. Los conflictos concurrentes generan 409 y no confirman salidas duplicadas.

Las fechas HTTP incluyen zona horaria y la conexión utiliza UTC. Las cantidades admiten tres decimales y los precios dos. `CORS_ORIGINS` define los orígenes exactos permitidos, inicialmente `http://localhost:4200` y `http://localhost:5173`. El registro HTTP conserva método, ruta, estado y duración, sin cuerpos ni tokens.

`MysqlUsuarioRepository` mantiene el contrato original de perfiles. La creación de un perfil mediante ese contrato genera una credencial aleatoria no recuperable; las cuentas con contraseña elegida se crean mediante registro o seed.

## Pruebas

```powershell
npm run build
npm test -- --runInBand
npm run escenarios
npm run test:mysql
npm run test:e2e -- --runInBand
```

Las pruebas de integración requieren permiso para crear y eliminar una base temporal `distribuidora_test_<timestamp>`. Esa base está separada de la base de trabajo y se elimina al finalizar. Las comprobaciones incluyen migraciones, autenticación, permisos, FEFO, mermas, rollback, concurrencia, Swagger y CORS. La evidencia se encuentra en `output/pruebas-avance2.json`.

La prueba HTTP básica utiliza un módulo aislado. Los escenarios originales ejecutan el dominio en memoria. Swagger 11 mantiene la compatibilidad con NestJS 11; el override de `js-yaml` resuelve la dependencia con la versión corregida.

## Alcance del avance

Las líneas del pedido se reciben al surtir y los movimientos conservan los lotes utilizados. El proveedor permanece como texto del lote. Los estados de reparto están definidos en el modelo, pero sus operaciones todavía no forman parte de esta entrega.

El documento del avance se encuentra en [Avance 02 - Servicio y seguridad](output/pdf/avance-02-servicio-seguridad.pdf).
