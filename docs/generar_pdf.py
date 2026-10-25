from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Flowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from pathlib import Path
import json
root=Path.cwd()
styles=getSampleStyleSheet()
styles['Normal'].fontName='Helvetica'
styles['Normal'].fontSize=10.5
styles['Normal'].leading=15
styles['Normal'].spaceAfter=9
styles['Heading1'].textColor=colors.HexColor('#173c44')
styles['Heading2'].textColor=colors.HexColor('#235962')
styles.add(ParagraphStyle(name='Cover',parent=styles['Title'],fontSize=27,leading=33,textColor=colors.HexColor('#173c44'),spaceAfter=22))
styles.add(ParagraphStyle(name='SmallText',parent=styles['Normal'],fontSize=9,leading=12))
story=[]
source=[]
def p(text,style='Normal'):
    story.append(Paragraph(text, styles[style])); source.append(text)
def h(text): p(text,'Heading1')
def page(): story.append(PageBreak())
class Diagram(Flowable):
    def __init__(self,kind): Flowable.__init__(self); self.kind=kind; self.width=480; self.height=405 if kind=='clases' else 290
    def draw(self):
        c=self.canv
        def box(x,y,w,hh,title,lines):
            c.setFillColor(colors.HexColor('#eff5f5')); c.setStrokeColor(colors.HexColor('#235962')); c.roundRect(x,y,w,hh,5,fill=1)
            c.setFillColor(colors.HexColor('#173c44')); c.setFont('Helvetica-Bold',10); c.drawString(x+8,y+hh-17,title)
            c.line(x,y+hh-25,x+w,y+hh-25); c.setFont('Helvetica',8)
            for i,line in enumerate(lines): c.drawString(x+8,y+hh-40-12*i,line)
        def arrow(x,y,xx,yy,label=''):
            c.setStrokeColor(colors.HexColor('#235962')); c.line(x,y,xx,yy)
            import math
            a=math.atan2(yy-y,xx-x)
            for d in [-.45,.45]: c.line(xx,yy,xx-7*math.cos(a+d),yy-7*math.sin(a+d))
            if label: c.setFont('Helvetica',8); c.drawString((x+xx)/2+4,(y+yy)/2+5,label)
        if self.kind=='clases':
            box(0,280,140,115,'Usuario',['id, nombre, correo','rol, activo','clienteId referencia Usuario'])
            box(180,280,135,115,'Pedido',['id, clienteId, fecha','estado: EstadoPedido','recibido -> surtido','-> en ruta -> entregado'])
            box(350,280,130,115,'MovimientoSurtido',['pedidoId, productoId','lotes: SurtidoLote[]','SurtidoLote: loteId,','cantidad'])
            box(180,95,135,145,'Producto',['id, nombre, presentacion','unidadMedida','precioBase, stockMinimo'])
            box(0,95,140,145,'Lote',['id, productoId, proveedor','cantidadDisponible','fechaIngreso','fechaCaducidad'])
            box(0,0,140,65,'Merma',['id, loteId, cantidad','motivo, fecha'])
            box(350,95,130,145,'InventarioService',['crearPedido()','registrarLote()','surtirPedido()','registrarMerma()','usa InventarioRepository'])
            arrow(140,340,180,340,'1 : N'); arrow(315,340,350,340,'1 : N')
            arrow(180,170,140,170,'1 : N'); arrow(70,95,70,65,'1 : N')
            arrow(415,240,415,280,'crea'); arrow(350,170,315,170,'usa')
        else:
            box(65,225,350,60,'Frontend web (previsto)',['Vistas: catalogo, pedidos, lotes y mermas'])
            box(65,145,350,60,'Backend NestJS',['Controllers HTTP (pendientes) -> InventarioService (implementado)'])
            box(65,65,350,60,'Contratos de repositorio',['InventarioRepository y UsuarioRepository'])
            box(0,0,225,45,'En memoria (implementado)',['Escenarios y pruebas; no persiste al cerrar'])
            box(255,0,225,45,'MySQL (previsto)',['Adaptador y transacciones SQL pendientes'])
            arrow(240,225,240,205,'HTTP / JSON'); arrow(240,145,240,125,'invoca')
            arrow(160,65,110,45); arrow(320,65,365,45)

def footer(c,doc):
    c.setStrokeColor(colors.HexColor('#c4d7d9')); c.line(48,43,547,43)
    c.setFont('Helvetica',8); c.setFillColor(colors.HexColor('#52696f')); c.drawString(48,30,'Equipo 4 | Avance 01 corregido | 19 de octubre de 2026'); c.drawRightString(547,30,str(doc.page))
p('INSTITUTO TECNOLÓGICO DE SONORA','Heading2'); story.append(Spacer(1,55))
p('Distribuidora de perecederos','Cover')
p('Avance 01 - El dominio y la arquitectura','Heading1')
p('Versión corregida a partir de la revisión de la primera entrega.','Normal')
story.append(Spacer(1,30))
p('<b>Materia:</b> Frontend Web: Temas Emergentes')
p('<b>Profesor:</b> Carlos Alberto Ruiz Castrejón')
p('<b>Equipo 4</b><br/>Daniel Alejandro Arce Galván - 00000262142<br/>Jesus Armando Arce Baldenebro - 00000206661<br/>Ana Isabel González Mendivil - 00000244319<br/>Javi - 00000164512')
p('<b>Entrega original:</b> 29 de septiembre de 2026<br/><b>Revisión:</b> 19 de octubre de 2026')
p('Repositorio: https://github.com/Arc-Dan/Proyecto-Distribuidora-Carne','SmallText')
page(); h('1. Objetivo y vocabulario del dominio')
p('Administrar la operación de una distribuidora de carnes que abastece a restaurantes, reduciendo las pérdidas por caducidad mediante el control del inventario por lotes y la rotación de mercancía según su vencimiento.')
p('La elección responde a una necesidad práctica de pequeños comercios locales. El proyecto permite aplicar el control de existencias, la trazabilidad y la separación de reglas de negocio en una situación cercana al entorno del equipo.')
p('Glosario','Heading2')
terms=[('Producto','Tipo de carne comercializado, con presentación, unidad de medida, precio base y stock mínimo.'),('Lote','Entrada de un producto con proveedor, cantidad disponible y fechas de ingreso y caducidad propias.'),('Pedido','Solicitud de un restaurante. Su estado permite distinguir recibido, surtido, en ruta y entregado.'),('Cliente (restaurante)','Restaurante que solicita productos. En el código se referencia mediante clienteId; los usuarios con rol cliente representan este actor.'),('Merma','Pérdida real de mercancía por caducidad, daño o faltante. Descuenta existencias y conserva el motivo y la fecha.'),('Stock mínimo','Reserva de producto vigente que debe quedar después de surtir un pedido. No bloquea el registro de pérdidas reales.'),('Proveedor','Origen de la mercancía de un lote. En este avance se registra como texto, sin entidad propia.'),('Surtido','Asignación y descuento de lotes para atender un pedido completo. Genera movimientos que permiten rastrear lo entregado.'),('FEFO','First Expired, First Out: primero se utiliza el lote vigente cuya caducidad sea más próxima.'),('Existencia disponible','Suma de cantidades positivas de lotes ya ingresados y aún vigentes de un producto.'),('Movimiento de surtido','Registro que relaciona un pedido, un producto y las cantidades tomadas de cada lote.')]
for term,definition in terms: p('<b>'+term+':</b> '+definition)
page(); h('2. Reglas de negocio')
rules=[
'No puede surtirse un lote cuya fecha de caducidad sea igual o anterior al instante de la operación, porque el producto ya no es apto para la venta. Los lotes caducados se excluyen de la existencia disponible.',
'No puede surtirse una cantidad que deje la existencia vigente por debajo del stock mínimo, porque se comprometería la reserva operativa. Sí se permite dejar exactamente el mínimo.',
'No puede surtirse nuevamente un pedido que ya esté surtido, en ruta o entregado, porque se duplicarían la salida de inventario y los movimientos del mismo pedido.',
'No puede surtirse una cantidad superior a la existencia vigente disponible, porque no se puede comprometer mercancía inexistente o caducada.',
'No puede surtirse un pedido vacío ni registrar cantidades cero, negativas o no finitas, porque no representan una cantidad operativa válida. Las cantidades de líneas repetidas se suman antes de validar el producto.',
'No puede registrarse una merma mayor que la cantidad disponible del lote, porque produciría una existencia negativa. Una merma real sí puede dejar el inventario por debajo del mínimo.',
'No puede operarse sobre un producto, lote o pedido inexistente, porque se perdería la trazabilidad de las operaciones.',
'No puede ingresarse un lote con fechas inválidas, con caducidad anterior o igual al ingreso, o ya caducado, porque no representa mercancía vigente. Un lote con ingreso futuro no participa en el surtido actual.',
'No puede elegirse un lote de vencimiento posterior mientras exista uno vigente de vencimiento más próximo, porque se aumentaría el riesgo de merma. Se aplica FEFO y, en empate, el menor identificador.',
'No puede confirmarse parcialmente un surtido de varios productos, porque el pedido quedaría inconsistente. Todos los descuentos, movimientos y el cambio de estado se confirman juntos o se revierten.'
]
for i,rule in enumerate(rules,1): p('<b>RN%02d.</b> %s'%(i,rule))
p('Criterio temporal','Heading2')
p('Las fechas se comparan como instantes Date. La caducidad es un límite exclusivo: fechaCaducidad > ahora. Si el negocio captura solo fechas de calendario, la capa de entrada deberá acordar su conversión al instante de vencimiento y la zona horaria antes de habilitar la interfaz.')
page(); h('3. Arquitectura y contrato entre capas')
p('La arquitectura propuesta es cliente-servidor. La vista permite consultar y capturar información; el backend aplica las reglas del negocio; los repositorios aíslan el dominio del mecanismo de almacenamiento. MySQL sigue siendo la persistencia prevista por sus relaciones y soporte transaccional.')
story.append(Diagram('arquitectura'))
p('Estado real de este avance','Heading2')
p('Se implementaron InventarioService, InMemoryInventarioRepository e InMemoryUsuarioRepository. El dominio se ejecuta directamente con escenarios, sin depender de HTTP ni de una base de datos. El frontend, los endpoints del negocio y el adaptador MySQL corresponden a trabajo posterior.')
p('Contrato propuesto','Heading2')
p('La vista enviará identificadores y datos de captura. Para surtir se recibe un pedidoId y una lista de líneas {productoId, cantidad}; para merma, {loteId, cantidad, motivo}. El servicio devuelve movimientos de surtido o la merma creada; ante una restricción lanza un error de dominio específico. La traducción a respuestas HTTP corresponde a los futuros controllers.')
p('El repositorio expone operaciones asíncronas y enTransaccion(). La implementación en memoria serializa las operaciones del servicio y restaura el estado ante errores; el futuro adaptador MySQL deberá cumplir el mismo contrato mediante transacciones y bloqueo apropiado. Los datos en memoria se pierden al finalizar el proceso.')
page(); h('4. Componentes y relaciones')
p('Diagrama de clases y contratos principales. Las interfaces TypeScript representan entidades; el servicio concentra el comportamiento y depende del contrato del repositorio.')
story.append(Diagram('clases'))
p('Tipos y alcance','Heading2')
p('EstadoPedido: recibido, surtido, en ruta, entregado. MotivoMerma: caducidad, daño, faltante. NuevoLote se define como Omit&lt;Lote, \'id\'&gt;: conserva producto, proveedor, cantidad y ambas fechas.')
p('Las líneas se entregan al caso de uso de surtido; este avance no guarda un detalle solicitado antes de surtir. Los movimientos sí conservan las cantidades efectivamente tomadas. La validación de que clienteId corresponda a un restaurante activo y las transiciones de reparto quedan pendientes de la siguiente entrega.')
p('Los repositorios devuelven copias de las entidades para evitar cambios accidentales desde fuera del almacenamiento. El repositorio de usuarios implementa listado, consulta, creación, actualización y eliminación; la creación usa rol cliente y activo verdadero como valores por defecto.')
page(); h('5. Escenarios reproducibles y correcciones')
p('Desde distribuidora-app ejecutar npm ci y luego npm run escenarios. El programa termina con código distinto de cero ante una aserción fallida. No requiere MySQL.')
for title,body in [
('Escenario 1. Surtido válido y duplicado','Con 20 kg vigentes y 50 kg caducados, se solicitan 12 kg. Se toman 10 kg del lote que vence primero y 2 kg del siguiente. El lote caducado no cambia; el pedido pasa a surtido y un segundo intento se rechaza sin otro movimiento.'),
('Escenario 2. Restricciones de inventario','Solicitar 21 kg vigentes se rechaza por insuficiencia; solicitar 16 kg se rechaza porque dejaría menos de la reserva de 5 kg. Un pedido de varios productos cuyo segundo producto no tenga existencias se revierte completo.'),
('Escenario 3. Mermas','Se rechazan cantidades cero, negativas, NaN, infinitas y mayores a la existencia. Una merma por los 50 kg del lote caducado descuenta su saldo a cero y registra una sola pérdida.')]:
    p(title,'Heading2'); p(body)
p('Verificación adicional','Heading2')
p('npm test -- --runInBand ejecuta los escenarios y pruebas de límites del stock mínimo, referencias inexistentes, fechas, aislamiento de datos, contrato de usuarios y surtidos concurrentes. npm run build comprueba la compilación. npm run test:e2e valida el endpoint inicial existente de NestJS.')
p('Correcciones atendidas','Heading2')
p('Glosario ampliado; reglas restrictivas documentadas; ambos diagramas incorporados en este PDF; servicio de inventario implementado; repositorios en memoria operables; tres escenarios con aserciones; tipo NuevoLote corregido.')
SimpleDocTemplate(str(root/'output/pdf/avance-01-corregido.pdf'),pagesize=(595.28,841.89),rightMargin=48,leftMargin=48,topMargin=48,bottomMargin=58,title='Distribuidora de perecederos - Avance 01 corregido',author='Equipo 4').build(story,onFirstPage=footer,onLaterPages=footer)
(root/'docs/avance-01-contenido.md').write_text('\n\n'.join(source),encoding='utf-8')

