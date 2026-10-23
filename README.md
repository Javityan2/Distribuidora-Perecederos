# Distribuidora de perecederos

Proyecto individual: https://github.com/Javityan2/Distribuidora-Perecederos

Entrega 2 en la rama `feat-servicio`. Backend NestJS + MySQL, dominio independiente de HTTP, repositorios intercambiables, JWT y permisos por rol.

## Instalación desde cero (PowerShell)

1. Instalar Node.js (verificado con 26.8.1), npm y MySQL Server 8 (verificado con 8.0.41). Workbench es opcional. El usuario de MySQL debe poder crear tablas en la base elegida.
2. Clonar y seleccionar la rama:

```powershell
git clone https://github.com/Javityan2/Distribuidora-Perecederos.git
cd Distribuidora-Perecederos
git switch feat-servicio
cd distribuidora-app
npm ci
Copy-Item .env.example .env
```

3. En MySQL ejecutar:

```sql
CREATE DATABASE distribuidora_perecederos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. Editar `.env` con los datos reales de conexión. Para `JWT_SECRET`, generar una clave local:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Generar también tres contraseñas locales de al menos 12 caracteres para `SEED_ADMIN_PASSWORD`, `SEED_ALMACEN_PASSWORD` y `SEED_CLIENTE_PASSWORD`. No usar los valores de relleno. No publicar `.env`, tokens ni contraseñas. `CORS_ORIGINS` contiene los orígenes exactos de los futuros clientes, separados por comas; inicialmente localhost:4200 y localhost:5173. Cambiarlos a las direcciones reales de los avances 3 y 4 cuando se conozcan.

5. Crear estructura y datos:

```powershell
npm run migration:run
npm run migration:show
npm run seed
npm run build
npm run start:dev
```

6. Abrir http://localhost:3000/docs. El contrato OpenAPI se consulta en http://localhost:3000/docs-json. En Swagger, iniciar sesión, copiar solo `data.accessToken` al botón Authorize y probar las rutas protegidas. Los tokens vencen en 15 minutos.

## Cuentas de demostración

| Correo | Rol | Contraseña local |
|---|---|---|
| admin@distribuidora.local | administrador | SEED_ADMIN_PASSWORD |
| almacen@distribuidora.local | almacenista | SEED_ALMACEN_PASSWORD |
| restaurante@distribuidora.local | cliente | SEED_CLIENTE_PASSWORD |

El seed crea lo que falte sin cambiar contraseñas ni reponer saldos de registros existentes. Crea un producto de demostración, dos lotes vigentes de 10 kg, un lote caducado de 50 kg y un pedido recibido. Las fechas se calculan respecto al día del primer seed; para una demostración posterior, registrar lotes nuevos desde la API. El seed no se ejecuta en cada arranque.

## Puntos de entrada y permisos

| Método y ruta | Acceso |
|---|---|
| GET / | Público; estado básico |
| GET /productos; GET /productos/:id | Público; catálogo |
| POST /productos | Administrador |
| POST /auth/registro; POST /auth/login | Público |
| GET /auth/perfil | Usuario autenticado y activo |
| GET /usuarios | Administrador |
| GET /productos/:id/lotes; POST /lotes | Administrador y almacenista |
| GET /pedidos; GET /pedidos/:id; POST /pedidos | Cliente sobre sus propios pedidos; personal sobre todos |
| POST /pedidos/:id/surtidos | Administrador y almacenista |
| GET /mermas; POST /mermas | Administrador y almacenista |

Las líneas se reciben al surtir, según el modelo del avance 1; no se almacena un detalle previo del pedido. Reparto y entrega son estados del modelo, sin operaciones implementadas en esta entrega. Proveedor sigue siendo texto del lote. No se anuncia CRUD de casos de uso que no existen en el dominio.

## Contrato HTTP

Éxito: `{ "data": ... }`. Error: `{ "data": null, "error": { "codigo": "...", "mensaje": "..." }, "meta": { "statusCode": 409, "path": "/..." } }`.

200 consulta/login, 201 creación, 400 entrada mal formada, 401 falta/alteración/vencimiento de credencial, 403 rol o propietario incorrecto, 404 recurso inexistente, 409 restricción del negocio o conflicto de datos. Una cantidad numérica cero o negativa llega al dominio y genera 409; un campo que debería ser número y contiene texto genera 400. Los mensajes SQL y secretos no se devuelven al cliente.

## Reglas y persistencia

InventarioService conserva las reglas del avance 1. La fábrica de `ProductosModule` elige `MysqlInventarioRepository`; para ejecutar el dominio en memoria están los escenarios originales. Ambos cumplen el mismo contrato. `MysqlUsuarioRepository` cumple el contrato original de perfiles; su método crear genera una credencial aleatoria no recuperable porque ese contrato no recibe contraseña. Para usuarios que deban iniciar sesión se utiliza el registro público o el seed.

FEFO excluye lotes caducados y futuros; protege stock mínimo; impide doble surtido y cantidades inválidas. Los cambios del caso de uso comparten una transacción SERIALIZABLE mediante AsyncLocalStorage. Un conflicto concurrente se revierte y responde 409; consultar el estado antes de reintentar. Merma y descuento se confirman juntos. Las fechas HTTP requieren zona horaria; conexión y migraciones usan UTC. Las cantidades HTTP aceptan hasta tres decimales y los precios dos, de acuerdo con MySQL.

`src/database/migrations` conserva los dos cambios históricos. `synchronize` permanece desactivado. No editar migraciones ya aplicadas: crear otra para cambios futuros. Las entidades ORM describen tablas y las interfaces de dominio describen el negocio.

## Verificación

```powershell
npm run build
npm test -- --runInBand
npm run escenarios
npm run test:mysql
npm run test:e2e -- --runInBand
```

`test:mysql` requiere permisos para crear y eliminar una base temporal `distribuidora_test_<timestamp>`; nunca usa la base de trabajo para sus operaciones. Aplica las dos migraciones, prueba API real, reglas, rollback, permisos 401/403/200, tokens, concurrencia, Swagger y CORS. Elimina únicamente su base temporal al terminar. Guarda evidencia en `output/pruebas-avance2.json` desde la raíz del repositorio. La prueba HTTP básica usa un módulo aislado sin MySQL; la integración completa con MySQL y los permisos es test:mysql. El escenario de rollback requiere MySQL configurado.

Swagger 11 se usa por compatibilidad con NestJS 11. La resolución de js-yaml se fija a una versión corregida mediante overrides; conservar package-lock.json y usar npm ci.

## Entregables

- `output/pdf/avance-02-servicio-seguridad.pdf`: modelo de datos, endpoints y roles.
- `docs/guion-video-avance2.md`: recorrido de 5 a 10 minutos.
- `output/pruebas-avance2.json`: evidencia automatizada sin credenciales.
- `.env.example`, seed y migraciones dentro de distribuidora-app.

El video debe grabarse y adjuntarse a la entrega; el repositorio incluye el guion, no una grabación.
