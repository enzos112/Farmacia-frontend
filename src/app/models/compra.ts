// Definimos también el detalle aquí para no crear un archivo extra pequeño
export interface DetalleCompra {
  idProducto: number;
  cantidad: number;
  precioCompra: number;
}

export interface Compra {
  idProveedor: number;
  items: DetalleCompra[];
}