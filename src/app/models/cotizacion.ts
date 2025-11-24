export interface Cotizacion {
  idCotizacion: number;
  numCotizacion: string;
  totalPagar: number;
  validez: string;
  precio: number;
  cantidad: number;
  importe: number;
  
  // IDs de relaciones
  producto: number;
  cliente: number;
  botica: number;
  usuario: number;
}