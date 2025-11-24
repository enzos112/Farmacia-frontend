import { Cliente } from './cliente';
import { Producto } from './producto';
import { Usuario } from './usuario'; // Asegúrate de importar Usuario si tienes el modelo, sino usa any

export interface Venta {
  idVenta?: number;
  numComprobante: string;
  fechaVenta: string;
  condicionPago: string;
  total: number;
  impuesto: number;
  estado: 'REGISTRADA' | 'ANULADA' | string;
  
  cliente?: Cliente;      
  
  // --- CORRECCIÓN 1: Agregamos el usuario (vendedor) ---
  usuario?: Usuario;  // O usa 'any' si no quieres importar el modelo Usuario

  detalleVenta: DetalleVenta[]; 

  // Campos opcionales de compatibilidad
  clienteNombre?: string;
  clienteDni?: string;
  vendedorNombre?: string;
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
  idProducto: number;
  cantidad: number;
}

export interface VentaStats {
  totalVentas: number;
  ventasHoy: number;
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