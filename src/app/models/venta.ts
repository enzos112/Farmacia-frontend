import { Cliente } from './cliente';
import { Producto } from './producto';
import { Usuario } from './usuario'; // Asegúrate de importar Usuario si tienes el modelo, sino usa any

export interface Venta {
  idVenta?: number;
  id?: number; // Compatibilidad con componentes
  numComprobante: string;
  numeroVenta?: string; // Compatibilidad con componentes
  fechaVenta: string;
  condicionPago?: string;
  total: number;
  impuesto?: number;
  igv?: number; // Para totales
  estado: 'REGISTRADA' | 'ANULADA' | 'completada' | 'pendiente' | 'oculta' | string;
  cliente?: Cliente;
  usuario?: Usuario;
  detalleVenta?: DetalleVenta[];
  detalles?: DetalleVenta[]; // Compatibilidad con componentes
  clienteNombre?: string;
  clienteDni?: string;
  vendedorNombre?: string;
  metodoPago?: string;
  observaciones?: string;
  clienteId?: number;
  vendedorId?: number;
  subtotal?: number;
}

// ... (El resto del archivo DetalleVenta, VentaDTO, etc. déjalo igual)
export interface DetalleVenta {
  idDetalleVenta?: number;
  producto?: Producto; 
  productoId?: number;
  productoNombre?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentaDTO {
  idCliente: number;
  items: DetalleVentaDTO[];
}

export interface DetalleVentaDTO {
  idProducto?: number;
  cantidad: number;
}

export interface VentaStats {
  totalVentas: number;
  ventasHoy: number; // conteo de ventas hoy
  ventasHoyMonto: number; // monto total vendido hoy
  ventasMes: number;
  promedioVenta: number;
  ventasPendientes: number;
  ingresosTotales: number;
}

export interface ProductoVenta {
  id: number;
  idProducto: number;
  nombre: string;
  precio: number;
  stock: number;
  cantidadSeleccionada?: number;
  // Agrega campos opcionales para evitar conflictos de tipos
  descripcion?: string;
  precioVenta?: number;
}

export interface ClienteVenta {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  telefono?: string;
  email?: string;
}