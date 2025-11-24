export interface Gasto {
  idGasto: number;
  descripcion: string;
  monto: number;
  fechaGasto: string;
  usuario: number;  // ID Usuario
  apertura: number; // ID Apertura
}