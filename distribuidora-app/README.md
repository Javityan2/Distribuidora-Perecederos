# Servicio de la distribuidora de perecederos

Implementé el backend con NestJS y MySQL. El servicio administra productos, lotes, pedidos, surtidos y mermas, con autenticación JWT y permisos de administrador, almacenista y cliente.

## Componentes

- `productos/dominio`: entidades, contratos, errores y reglas de inventario.
- `productos/infraestructura`: repositorios en memoria y MySQL y entidades ORM.
- `usuarios`: registro, login, transformación de contraseñas y control de acceso.
- `database`: configuración de persistencia, migraciones y datos iniciales.
- `common`: validación HTTP, documentación y formato de errores.

## Comandos

| Comando | Función |
|---|---|
| `npm ci` | Instalación reproducible de dependencias |
| `npm run migration:run` | Aplicación de migraciones pendientes |
| `npm run migration:show` | Consulta del historial de migraciones |
| `npm run seed` | Creación de datos iniciales faltantes |
| `npm run start:dev` | Servidor de desarrollo |
| `npm run build` | Compilación |
| `npm test -- --runInBand` | Pruebas unitarias |
| `npm run escenarios` | Escenarios del dominio en memoria |
| `npm run test:mysql` | Integración HTTP con MySQL temporal |
| `npm run test:e2e -- --runInBand` | Prueba HTTP básica aislada |

La configuración se define mediante las variables de `.env.example`; los valores reales permanecen en `.env`. La API está disponible en el puerto 3000 por defecto y la documentación interactiva en `/docs`.

La descripción del modelo, los permisos y la preparación completa del entorno se encuentran en el [README del proyecto](../README.md).
