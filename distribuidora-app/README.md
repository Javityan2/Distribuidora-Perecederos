# Servicio de la distribuidora

## Objetivo

Implementar el servicio central de una distribuidora de carnes a restaurantes, con inventario por lotes, surtido FEFO, registro de mermas y control de acceso.

## Organización

- `src/productos/dominio`: entidades, errores, contratos y reglas del inventario.
- `src/productos/infraestructura`: entidades ORM y repositorios en memoria y MySQL.
- `src/productos/*.service.ts`: servicios de aplicación para catálogo y pedidos.
- `src/productos/*.controller.ts`: rutas agrupadas por recurso.
- `src/usuarios`: autenticación, permisos y persistencia de perfiles y credenciales.
- `src/comun`: middleware de peticiones, interceptor del sobre, filtro HTTP y pipe de identificadores.
- `src/database`: conexión, migraciones y datos iniciales.
- `test`: comprobaciones HTTP y de integración con MySQL temporal.
- `peticiones.http`: casos reproducibles para REST Client.

Los servicios utilizan contratos de repositorio mediante tokens. Los controladores no dependen de TypeORM. Las reglas del inventario permanecen independientes de NestJS y el almacenamiento se selecciona en los módulos.

## Comandos

| Comando | Función |
|---|---|
| `npm ci` | Instalación reproducible de dependencias |
| `npm run typecheck` | Revisión de tipos sin generar archivos |
| `npm run migration:run` | Aplicación de migraciones pendientes |
| `npm run migration:show` | Estado del historial |
| `npm run seed` | Datos iniciales faltantes |
| `npm run start:dev` | Servidor de desarrollo |
| `npm run build` | Compilación |
| `npm run lint` | Revisión de estilo y análisis estático |
| `npm test -- --runInBand` | Pruebas unitarias |
| `npm run escenarios` | Escenarios del dominio en memoria |
| `npm run test:mysql` | API real con una base MySQL temporal |
| `npm run test:e2e -- --runInBand` | Prueba HTTP aislada |

## Configuración y documentación

`.env.example` describe las variables de conexión, JWT, CORS y cuentas iniciales. Sus valores reales se conservan únicamente en `.env`. Las fechas utilizan UTC y las cantidades admiten hasta tres decimales.

La API utiliza el puerto 3000 por defecto. La documentación navegable está en `/docs` y su contrato OpenAPI en `/docs-json`. Las respuestas contienen `data` y `meta`, y cada petición tiene un identificador `X-Request-Id`.

La preparación completa del entorno, los permisos y el modelo del proyecto se describen en el [README principal](../README.md).
