# Distribuidora de perecederos - Equipo 4

Sistema de distribución de carnes a restaurantes con inventario por lotes, rotación FEFO y registro de mermas.

## Primera entrega corregida

- Documento autónomo: [Avance 01 corregido](output/pdf/avance-01-corregido.pdf).
- Contenido editable: [documentación](docs/avance-01-contenido.md).
- Generación del PDF: `python docs/generar_pdf.py` desde esta carpeta, con ReportLab instalado.
- Aplicación NestJS y dominio: `distribuidora-app/`.

## Ejecutar y verificar

Desde `distribuidora-app`:

```sh
npm ci
npm run escenarios
npm test -- --runInBand
npm run build
npm run test:e2e -- --runInBand
```

Los tres escenarios tienen aserciones y usan una fecha fija para reproducir resultados. Se ejecutan sin MySQL. El servicio es independiente de NestJS y puede instanciarse con `InMemoryInventarioRepository`.

## Decisiones del dominio

- Solo se surten pedidos recibidos. Las líneas repetidas se agrupan por producto.
- FEFO toma primero el lote vigente de vencimiento más próximo; en empate, el menor ID.
- Un lote es vigente si ya ingresó y `fechaCaducidad > ahora`. Las fechas representan instantes; antes de capturar fechas de calendario en una interfaz debe acordarse su zona horaria y conversión.
- El surtido puede dejar exactamente el stock mínimo, pero nunca menos.
- La merma registra una pérdida real y puede dejar menos que el mínimo; nunca puede superar el saldo del lote.
- Todas las cantidades operativas deben ser finitas y mayores que cero.
- `enTransaccion()` serializa operaciones del servicio y revierte descuentos, movimientos y estados ante un error. No anidar transacciones. Las llamadas directas de escritura al repositorio son primitivas internas; los casos de uso pasan por el servicio.
- El repositorio entrega copias; los datos en memoria desaparecen al cerrar el proceso.

## Alcance pendiente

Frontend, endpoints HTTP del negocio, adaptador MySQL, autenticación, validación de clientes activos y transiciones de reparto. El pedido conserva cabecera y estado; las líneas se reciben al surtir y el movimiento conserva los lotes y cantidades utilizados. El futuro adaptador MySQL deberá garantizar la misma atomicidad con transacciones y bloqueo en base de datos.

No se agregaron requisitos de la siguiente entrega, todavía no proporcionados.
