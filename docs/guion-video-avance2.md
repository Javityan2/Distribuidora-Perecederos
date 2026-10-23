# Guion del video - duración sugerida 7 a 9 minutos

1. 0:00-0:45: presentar el repositorio individual y la rama feat-servicio. Explicar que InventarioService conserva las reglas y que se sustituyó el repositorio en memoria por MySQL mediante la fábrica del módulo.
2. 0:45-1:45: mostrar el diagrama del PDF, las siete tablas y SELECT * FROM migrations. Mostrar .env.example, nunca .env ni contraseñas reales.
3. 1:45-2:30: abrir /docs. Mostrar catálogo y el formulario de registro; un registro inválido devuelve 400 y correo duplicado 409.
4. 2:30-3:30: iniciar sesión con el cliente usando la contraseña local. Authorize con data.accessToken. Consultar /auth/perfil. No ampliar ni leer el token en voz alta.
5. 3:30-5:00: mostrar GET /usuarios sin Authorize (401), con cliente (403) y con administrador (200). Explicar autenticación frente a autorización. Quitar Authorize antes de cambiar de cuenta.
6. 5:00-6:45: con administrador/almacenista listar lotes, crear un pedido para el cliente del seed y surtir 12 kg del producto de demostración si conserva sus 20 kg vigentes. Mostrar lotes 10+2 FEFO y saldo. Repetir surtido: 409. En otro pedido solicitar más existencia o comprometer la reserva: 409. Usar IDs reales obtenidos de las respuestas.
7. 6:45-7:45: registrar merma cero (409) y una merma válida del lote caducado. Mostrar el motivo y el saldo.
8. 7:45-8:30: mostrar npm run test:mysql y el reporte, incluyendo token alterado/vencido, rollback y concurrencia. Mostrar los tiempos de peticiones en la terminal, sin imprimir cuerpos ni encabezados de autorización.
9. 8:30-9:00: explicar README: instalar, configurar, migrar, seed e iniciar en otra computadora. Cerrar indicando que /docs se genera desde el código.

Preparación: mantener MySQL activo, crear las cuentas mediante npm run seed, tener los valores SEED_* disponibles de forma privada y practicar con datos nuevos. Si ya consumiste existencias, registra nuevos lotes vigentes en lugar de alterar saldos para la grabación. Grabar pantalla y voz; no grabar el .env.
