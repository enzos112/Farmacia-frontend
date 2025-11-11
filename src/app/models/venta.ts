export interface Venta {
  id?: number;
  numeroVenta: string;
  fechaVenta: Date;
  clienteId?: number;
  clienteNombre?: string;
  clienteDni?: string;
  vendedorId?: number;
  vendedorNombre?: string;
  subtotal: number;
  igv: number;
  descuento?: number;
  total: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
  estado: 'pendiente' | 'completada' | 'cancelada' | 'devuelta';
  observaciones?: string;
  detalles: DetalleVenta[];
}

export interface DetalleVenta {
  id?: number;
  ventaId?: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  subtotal: number;
}

export interface VentaStats {
  totalVentas: number;
  ventasHoy: number;
  ventasMes: number;
  promedioVenta: number;
  ventasPendientes: number;
  ingresosTotales: number;
}

export interface VentaResumen {
  fecha: string;
  numeroVentas: number;
  totalVentas: number;
}

export interface ProductoVenta {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  descripcion?: string;
}

export interface ClienteVenta {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  telefono?: string;
  email?: string;
}