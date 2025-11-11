export interface Cliente {
  id?: number;
  nombre: string;
  apellido: string;
  dni: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  fechaRegistro?: Date;
  totalCompras?: number;
  ultimaCompra?: Date;
  estado?: 'activo' | 'inactivo';
}

export interface ClienteStats {
  totalClientes: number;
  clientesNuevos: number;
  clientesActivos: number;
  ventasTotales: number;
}