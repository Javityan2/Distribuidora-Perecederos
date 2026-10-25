# Distribuidora de perecederos

## Objetivo

En este proyecto se desarrolló un servicio para administrar una distribuidora de carnes que abastece a restaurantes. Para ello, se organizó el inventario por lotes y se implementó el surtido según la fecha de caducidad, con el fin de reducir las pérdidas de mercancía.

También se agregó persistencia en MySQL, validación de datos, autenticación mediante JWT y permisos según el rol del usuario. El avance del servicio se encuentra en la rama `feat-servicio`.

## Organización del proyecto

- `distribuidora-app/`: aplicación desarrollada con NestJS y TypeScript.
- `distribuidora-app/src/productos/`: catálogo, lotes, pedidos, surtidos y mermas.
- `distribuidora-app/src/usuarios/`: perfiles, registro, inicio de sesión y permisos.
- `distribuidora-app/src/comun/`: filtro HTTP, interceptor de respuestas, middleware de peticiones y validación de identificadores.
- `distribuidora-app/src/database/`: conexión, migraciones y datos iniciales.
- `distribuidora-app/peticiones.http`: peticiones reproducibles para REST Client.
- `docs/`: fuentes de la documentación e imágenes institucionales.
- `docs/entregas/`: documentos PDF de los avances.
- `docs/evidencias/`: resultados de las pruebas de integración.

## Separación de responsabilidades

Los controladores reciben las peticiones, utilizan los DTO y llaman a los servicios. No realizan consultas SQL ni acceden a las entidades ORM.

Los servicios de aplicación coordinan las consultas, la identidad del usuario y la propiedad de los pedidos. `InventarioService` conserva las reglas de surtido, stock mínimo, caducidad y merma, sin depender de NestJS ni de HTTP.

Los contratos de repositorio describen las operaciones de persistencia. Los módulos conectan esos contratos con las implementaciones mediante tokens de inyección. El catálogo y el inventario comparten la misma instancia de repositorio y el servicio de dominio se construye con esa dependencia.

Se mantuvo TypeORM para conservar el modelo MySQL, las migraciones y los datos existentes. Los repositorios en memoria permiten ejecutar el dominio sin una base de datos y comprobar la separación entre las capas.

## Funcionamiento del inventario

Un producto define la presentación, la unidad de medida, el precio base y el stock mínimo. Cada ingreso de mercancía genera un lote con su proveedor, cantidad disponible y fechas de ingreso y caducidad.

El surtido utiliza FEFO: toma primero el lote vigente que caduca antes. Los lotes caducados o con ingreso futuro no se incluyen en la existencia disponible. Cuando las fechas de caducidad coinciden, se utiliza primero el menor identificador.

Antes de descontar existencias se comprueba que el pedido siga recibido, que las cantidades sean válidas y que quede al menos el stock mínimo. Las líneas repetidas de un producto se agrupan. Los cálculos utilizan milésimas enteras para evitar residuos de punto flotante.

La merma registra una pérdida real y descuenta el saldo del lote. Su cantidad debe ser positiva y no puede superar la existencia del lote. Puede dejar menos del stock mínimo porque representa mercancía que ya no está disponible.

Los descuentos, movimientos y cambios de estado pertenecen a una misma transacción. Si una operación falla, se revierten todos sus cambios. La implementación MySQL utiliza aislamiento SERIALIZABLE y mantiene el manager de cada transacción mediante AsyncLocalStorage.

## Autenticación y permisos

El registro público crea clientes activos. Las contraseñas se transforman con Argon2id y el hash no se incluye en las respuestas. La autenticación utiliza un contrato de credenciales separado del contrato de perfiles.

El login devuelve una credencial JWT HS256 con vencimiento de 15 minutos. El guard global revisa la firma, el vencimiento y el usuario activo en MySQL. Los permisos utilizan el rol actual de la base de datos. Las rutas públicas se identifican con `@Publico()` y las demás requieren autenticación por defecto.

| Rol | Operaciones |
|---|---|
| Administrador | Crear productos, consultar usuarios y administrar el inventario y los pedidos |
| Almacenista | Consultar lotes, registrar ingresos, surtir pedidos y registrar mermas |
| Cliente | Consultar el catálogo, crear pedidos propios y consultar su perfil y sus pedidos |

## Rutas

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/` | Público |
| GET | `/productos`, `/productos/:id` | Público |
| POST | `/productos` | Administrador |
| POST | `/auth/registro`, `/auth/login` | Público |
| GET | `/auth/perfil` | Usuario autenticado |
| GET | `/usuarios` | Administrador |
| GET | `/productos/:id/lotes` | Administrador y almacenista |
| POST | `/lotes` | Administrador y almacenista |
| GET, POST | `/pedidos` | Cliente: propios; personal: todos |
| GET | `/pedidos/:id` | Cliente propietario o personal |
| POST | `/pedidos/:id/surtidos` | Administrador y almacenista |
| GET, POST | `/mermas` | Administrador y almacenista |

La creación de productos y pedidos incluye la cabecera `Location` con la ruta del recurso creado.

## Respuestas y validación

El interceptor agrega un sobre uniforme a las respuestas exitosas:

```json
{
  "data": {},
  "meta": {
    "ruta": "/productos/1",
    "duracionMs": 2.5,
    "timestamp": "2026-10-25T12:00:00.000Z",
    "requestId": "identificador-de-peticion"
  }
}
```

El middleware asigna o conserva un `X-Request-Id` válido y registra método, ruta, estado y duración, incluyendo los rechazos de autenticación. El identificador se devuelve en la cabecera y en los metadatos.

Los DTO son clases con decoradores de validación. Los campos adicionales se rechazan y los identificadores deben ser enteros positivos dentro del rango de MySQL. Los errores de dominio heredan de `ErrorDeDominio` y se traducen en el filtro, sin introducir códigos HTTP en las reglas del inventario.

| Estado | Resultado |
|---|---|
| 200 | Consulta o login correcto |
| 201 | Recurso creado |
| 400 | Entrada mal formada o identificador inválido |
| 401 | Credencial ausente, alterada o vencida, o usuario no disponible |
| 403 | Rol o propietario sin permiso |
| 404 | Recurso inexistente |
| 409 | Conflicto con una regla de negocio o con los datos |

Los errores contienen `data: null`, `error: { codigo, mensaje }` y `meta` con estado, ruta, fecha e identificador. Una cantidad numérica cero o negativa se rechaza como regla del negocio; un texto en un campo numérico se rechaza como entrada inválida.

CORS se limita a los orígenes definidos en `CORS_ORIGINS`. Las cabeceras `Location` y `X-Request-Id` están expuestas para los clientes permitidos. CORS es una restricción aplicada por el navegador y no sustituye la autenticación.

## Entorno y ejecución

El proyecto se verificó con Node.js 26.8.1 y MySQL Server 8.0.41. Las versiones corregidas de dependencias indirectas se fijan mediante el archivo de bloqueo y los overrides de Swagger y del adaptador Express. La instalación de una copia nueva utiliza:

```powershell
git clone https://github.com/Javityan2/Distribuidora-Perecederos.git
cd Distribuidora-Perecederos
git switch feat-servicio
cd distribuidora-app
npm ci
Copy-Item .env.example .env
```

La base de datos se prepara en MySQL con:

```sql
CREATE DATABASE distribuidora_perecederos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

La configuración local se encuentra en `.env`, excluido del repositorio. `.env.example` contiene los nombres de las variables con valores de referencia. `DB_*` define la conexión; `JWT_SECRET` contiene una clave aleatoria de al menos 32 caracteres; `CORS_ORIGINS` define los orígenes HTTP exactos permitidos.

La generación de una clave local utiliza:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Las variables `SEED_ADMIN_PASSWORD`, `SEED_ALMACEN_PASSWORD` y `SEED_CLIENTE_PASSWORD` contienen contraseñas locales de al menos 12 caracteres. Las claves y contraseñas reales no forman parte del repositorio.

Con la configuración local disponible, los comandos de preparación y arranque son:

```powershell
npm run migration:run
npm run migration:show
npm run seed
npm run build
npm run start:dev
```

La API utiliza `http://localhost:3000` por defecto. Swagger está disponible en `/docs` y el contrato OpenAPI en `/docs-json`.

## Migraciones y datos iniciales

Se conservan dos migraciones históricas: la creación del inventario y la incorporación de `password_hash`. `synchronize` permanece desactivado; los cambios estructurales se registran mediante nuevas migraciones.

El seed crea administrador, almacenista, cliente, un producto, dos lotes vigentes de 10 kg, un lote caducado de 50 kg y un pedido recibido. Conserva los registros existentes, sus contraseñas y sus saldos. Las fechas se calculan respecto a la primera ejecución.

| Cuenta | Rol | Variable de contraseña |
|---|---|---|
| `admin@distribuidora.local` | administrador | `SEED_ADMIN_PASSWORD` |
| `almacen@distribuidora.local` | almacenista | `SEED_ALMACEN_PASSWORD` |
| `restaurante@distribuidora.local` | cliente | `SEED_CLIENTE_PASSWORD` |

## Verificación

```powershell
npm run typecheck
npm run build
npm run lint
npm test -- --runInBand
npm run escenarios
npm run test:mysql
npm run test:e2e -- --runInBand
```

Las pruebas unitarias cubren las reglas, la precisión decimal, el hash, los identificadores y el uso de los mismos servicios con repositorios en memoria. La prueba HTTP básica utiliza un módulo aislado.

La integración MySQL crea una base temporal separada, aplica las dos migraciones y prueba registro, login, permisos, propiedad de pedidos, surtido FEFO, mermas, rollback, concurrencia, metadatos, Swagger y CORS. Esa prueba requiere permisos para crear y eliminar su propia base `distribuidora_test_<timestamp>`. La base de trabajo no se modifica.

Los resultados se encuentran en `docs/evidencias/pruebas-avance2.json`. Las peticiones de REST Client complementan las pruebas automatizadas y utilizan las credenciales locales del seed.

## Alcance actual

El proyecto corresponde al servicio central del avance 2. Las líneas se reciben al surtir y los movimientos conservan los lotes utilizados. El proveedor se registra como texto. Los estados de reparto forman parte del modelo, aunque sus operaciones no están expuestas.

La interfaz de usuario de los avances posteriores consumirá esta API. El catálogo público, el contrato de respuesta y el control de acceso constituyen la conexión con esa capa.

Los documentos se encuentran en [Avance 01](docs/entregas/avance-01-corregido.pdf) y [Avance 02](docs/entregas/avance-02-servicio-seguridad.pdf).
