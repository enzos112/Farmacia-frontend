import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Venta, DetalleVenta, VentaStats, VentaResumen, ProductoVenta, ClienteVenta } from '../models/venta';

@Injectable({
  providedIn: 'root'
})
export class VentaService {

  constructor() { }

  // Datos de prueba actualizados al modelo del Backend
  private ventasMock: Venta[] = [
    {
      id: 1,
      numeroVenta: 'V-0001',
      fechaVenta: new Date('2025-11-20T10:00:00'), // Hoy
      clienteId: 1,
      clienteNombre: 'Juan Pérez',
      clienteDni: '12345678',
      vendedorId: 1,
      vendedorNombre: 'Admin',
      subtotal: 20,
      igv: 3.6,
      total: 23.6,
      metodoPago: 'efectivo',
      estado: 'completada',
      observaciones: '',
      detalles: [
        { id: 1, productoId: 1, productoNombre: 'Paracetamol', cantidad: 2, precioUnitario: 10, subtotal: 20 }
      ]
    },
    {
      id: 2,
      numeroVenta: 'V-0002',
      fechaVenta: new Date('2025-11-20T15:30:00'), // Hoy
      clienteId: 2,
      clienteNombre: 'Maria Gomez',
      clienteDni: '87654321',
      vendedorId: 1,
      vendedorNombre: 'Admin',
      subtotal: 30,
      igv: 5.4,
      total: 35.4,
      metodoPago: 'tarjeta',
      estado: 'completada',
      observaciones: '',
      detalles: [
        { id: 2, productoId: 2, productoNombre: 'Ibuprofeno', cantidad: 3, precioUnitario: 10, subtotal: 30 }
      ]
    },
    {
      id: 3,
      numeroVenta: 'V-0003',
      fechaVenta: new Date('2025-11-20T16:45:00'), // Hoy
      clienteId: 3,
      clienteNombre: 'Carlos López',
      clienteDni: '11223344',
      vendedorId: 1,
      vendedorNombre: 'Admin',
      subtotal: 45,
      igv: 8.1,
      total: 53.1,
      metodoPago: 'efectivo',
      estado: 'completada',
      observaciones: '',
      detalles: [
        { id: 3, productoId: 3, productoNombre: 'Vitamina C', cantidad: 3, precioUnitario: 15, subtotal: 45 }
      ]
    }
  ];

  getVentas(): Observable<Venta[]> {
    return of(this.ventasMock).pipe(delay(500));
  }

  getVentaStats(): Observable<VentaStats> {
    const ventas = this.ventasMock.filter(v => v.estado !== 'oculta');
    const totalVentas = ventas.length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ventasDelDiaArray = ventas.filter(v => new Date(v.fechaVenta).toDateString() === today.toDateString());
    const ventasHoy = ventasDelDiaArray.length;
    const ventasHoyMonto = ventasDelDiaArray.reduce((sum, v) => sum + v.total, 0);

    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const ventasMes = ventas.filter(v => {
      const d = new Date(v.fechaVenta);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const totalIngresos = ventas.reduce((sum, v) => sum + v.total, 0);
    const promedioVenta = totalVentas > 0 ? totalIngresos / totalVentas : 0;

    const ventasPendientes = this.ventasMock.filter(v => v.estado === 'pendiente').length;

    const stats: VentaStats = {
      totalVentas,
      ventasHoy,
      ventasHoyMonto,
      ventasMes,
      promedioVenta,
      ventasPendientes,
      ingresosTotales: totalIngresos
    };
    return of(stats).pipe(delay(500));
  }

  // ... (Tus métodos de search, create, update se deben adaptar igual)
  // Por brevedad, aquí un ejemplo del create:
  createVenta(venta: Venta): Observable<Venta> {
    venta.id = this.ventasMock.length + 1;
    venta.numeroVenta = 'V-' + venta.id.toString().padStart(4, '0');
    this.ventasMock.unshift(venta);
    return of(venta).pipe(delay(500));
  }

  updateVenta(id: number, venta: Partial<Venta>): Observable<Venta> {
    const index = this.ventasMock.findIndex(v => v.id === id);
    if (index !== -1) {
      this.ventasMock[index] = { ...this.ventasMock[index], ...venta };
      return of(this.ventasMock[index]).pipe(delay(500));
    }
    return of(venta as Venta);
  }

  cancelarVenta(id: number, motivo: string): Observable<boolean> {
    const index = this.ventasMock.findIndex(v => v.id === id);
    if (index !== -1) {
      this.ventasMock[index].estado = 'cancelada';
      this.ventasMock[index].observaciones = (this.ventasMock[index].observaciones || '') + ' (Cancelada: ' + motivo + ')';
      return of(true).pipe(delay(500));
    }
    return of(false).pipe(delay(500));
  }

  // Métodos de búsqueda simulada
  searchClientesVenta(term: string): Observable<ClienteVenta[]> {
      const clientesMock: ClienteVenta[] = [
          { id: 1, nombre: 'Juan', apellido: 'Pérez', dni: '12345678', telefono: '987654321', email: 'juan@example.com' },
          { id: 2, nombre: 'Maria', apellido: 'Gomez', dni: '87654321', telefono: '987654322', email: 'maria@example.com' },
          { id: 3, nombre: 'Carlos', apellido: 'Lopez', dni: '11223344', telefono: '987654323', email: 'carlos@example.com' },
          { id: 4, nombre: 'Ana', apellido: 'Martinez', dni: '44332211', telefono: '987654324', email: 'ana@example.com' }
      ];
      const filtered = clientesMock.filter(c =>
          `${c.nombre} ${c.apellido}`.toLowerCase().includes(term.toLowerCase()) ||
          c.dni.includes(term)
      );
      return of(filtered).pipe(delay(300));
  }
  searchProductos(term: string): Observable<ProductoVenta[]> {
      const productosMock: ProductoVenta[] = [
          { id: 1, nombre: 'Paracetamol 500mg', precio: 10, stock: 100, descripcion: 'Analgésico' },
          { id: 2, nombre: 'Ibuprofeno 400mg', precio: 15, stock: 80, descripcion: 'Antiinflamatorio' },
          { id: 3, nombre: 'Vitamina C 1g', precio: 20, stock: 50, descripcion: 'Suplemento vitamínico' },
          { id: 4, nombre: 'Omeprazol 20mg', precio: 25, stock: 30, descripcion: 'Antácido' },
          { id: 5, nombre: 'Amoxicilina 500mg', precio: 12, stock: 60, descripcion: 'Antibiótico' }
      ];
      const filtered = productosMock.filter(p =>
          p.nombre.toLowerCase().includes(term.toLowerCase()) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(term.toLowerCase()))
      );
      return of(filtered).pipe(delay(300));
  }
  
  calcularTotales(detalles: DetalleVenta[]) {
    const subtotal = detalles.reduce((acc, d) => acc + d.subtotal, 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    return { subtotal, igv, total };
  }
}