// Interfaces para las relaciones
export interface Categoria {
  idCategoria: number;
  nombre: string;
}

export interface UnidadMedida {
  idUnidadMedida: number;
  nombre: string;
  simbolo?: string;
}

// Modelo principal de Producto (coincide con el backend ProductoDTO)
export interface Producto {
  idProducto?: number;
  nombre: string;
  descripcion: string;
  codBarras: string;
  laboratorio: string;
  precioCompra: number;
  precioMenor: number;
  precioMayor: number;
  stock: number;
  stockminimo: number;
  fechaVencimiento: string; // formato ISO: "YYYY-MM-DD"
  idCategoria: number;
  idUnidadMedida: number;
  // Campos opcionales que vienen en las respuestas GET
  categoria?: Categoria;
  unidadMedida?: UnidadMedida;
}