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
  total: number;
  
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia' | string;
  
  // Incluimos 'oculta' para que TypeScript no se queje
  estado: 'REGISTRADA' | 'ANULADA' | 'completada' | 'pendiente' | 'cancelada' | 'devuelta' | 'oculta';
  
  observaciones?: string;
  detalles: DetalleVenta[];
}

export interface DetalleVenta {
  id?: number; // Agregamos ID opcional para datos mock
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
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

// Esta interfaz faltaba y causaba el error TS2305
export interface VentaResumen {
  fecha: string;
  total: number;
}

export interface ProductoVenta {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  descripcion?: string; // Agregamos descripción opcional
  cantidadSeleccionada?: number; // Para selección en modal
}

export interface ClienteVenta {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  telefono?: string;
  email?: string;
}