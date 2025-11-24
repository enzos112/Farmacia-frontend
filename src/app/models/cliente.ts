export interface Cliente {
  idCliente?: number;
  id?: number;       // Mantenlo por compatibilidad si usas componentes genéricos
  nombre: string;
  apellido: string;
  dni: string;
  
  
  // --- AQUÍ ESTABA EL ERROR ---
  celular?: string;  // <--- AGREGADO (Para coincidir con tu Backend)
  telefono?: string; // Déjalo opcional por si acaso
  
  email?: string;
  direccion?: string;
  
  fechaRegistro?: string | Date;
  totalCompras?: number;
  ultimaCompra?: Date;
  
  
  // Tip: A veces Java manda string, mejor dejarlo flexible
  estado?: 'activo' | 'inactivo' | string; 
}

export interface ClienteStats {
  totalClientes: number;
  clientesNuevos: number;
  clientesActivos: number;
  ventasTotales: number;
}