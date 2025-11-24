export interface Pago {
  idPago: number;
  monto: number;
  fechaPago: string;
  referencia: string;
  venta: number;      // ID de venta
  metodoPago: number; // ID de metodoPago
}