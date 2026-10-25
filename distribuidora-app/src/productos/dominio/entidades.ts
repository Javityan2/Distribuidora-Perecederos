// Productos que vende la distribuidora
export interface Producto {
  id: number;
  nombre: string;
  presentacion: string; // Caja (10kg), pieza
  unidadMedida: 'kg' | 'pieza' | 'caja';
  precioBase: number;
  stockMinimo: number;
}

// Cada entrada de mercancía debe generar un lote.
export interface Lote {
  id: number;
  productoId: number;
  proveedor: string;
  cantidadDisponible: number;
  fechaIngreso: Date;
  fechaCaducidad: Date;
}

// Pedido
export type EstadoPedido = 'recibido' | 'surtido' | 'en ruta' | 'entregado';

export interface Pedido {
  id: number;
  clienteId: number;
  fecha: Date;
  estado: EstadoPedido;
}

// Resultado de surtir
export interface SurtidoLote {
  loteId: number;
  cantidad: number;
}

export interface MovimientoSurtido {
  pedidoId: number;
  productoId: number;
  lotes: SurtidoLote[];
}

// Mermas
export type MotivoMerma = 'caducidad' | 'daño' | 'faltante';

export interface Merma {
  id: number;
  loteId: number;
  cantidad: number;
  motivo: MotivoMerma;
  fecha: Date;
}

// Datos de creación: el almacenamiento asigna el ID y el pedido inicia recibido.
export type NuevoProducto = Omit<Producto, 'id'>;
export type NuevoPedido = Omit<Pedido, 'id' | 'fecha' | 'estado'>;
export type NuevoLote = Omit<Lote, 'id'>;

export interface LineaPedido {
  productoId: number;
  cantidad: number;
}
