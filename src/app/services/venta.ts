import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Venta, DetalleVenta, VentaStats, VentaResumen, ProductoVenta, ClienteVenta } from '../models/venta';

@Injectable({
  providedIn: 'root',
})
export class VentaService {

  private ventas: Venta[] = [
    {
      id: 1,
      numeroVenta: 'V-2024-001',
      fechaVenta: new Date('2024-11-10T09:30:00'),
      clienteId: 1,
      clienteNombre: 'María González',
      clienteDni: '12345678',
      vendedorId: 1,
      vendedorNombre: 'Admin Usuario',
      subtotal: 42.37,
      igv: 7.63,
      total: 50.00,
      metodoPago: 'efectivo',
      estado: 'completada',
      detalles: [
        {
          id: 1,
          ventaId: 1,
          productoId: 1,
          productoNombre: 'Paracetamol 500mg',
          cantidad: 2,
          precioUnitario: 15.00,
          subtotal: 30.00
        },
        {
          id: 2,
          ventaId: 1,
          productoId: 2,
          productoNombre: 'Ibuprofeno 400mg',
          cantidad: 1,
          precioUnitario: 20.00,
          subtotal: 20.00
        }
      ]
    },
    {
      id: 2,
      numeroVenta: 'V-2024-002',
      fechaVenta: new Date('2024-11-10T11:15:00'),
      clienteId: 2,
      clienteNombre: 'Carlos Rodríguez',
      clienteDni: '87654321',
      vendedorId: 1,
      vendedorNombre: 'Admin Usuario',
      subtotal: 67.80,
      igv: 12.20,
      total: 80.00,
      metodoPago: 'tarjeta',
      estado: 'completada',
      detalles: [
        {
          id: 3,
          ventaId: 2,
          productoId: 3,
          productoNombre: 'Vitamina C 1g',
          cantidad: 3,
          precioUnitario: 18.00,
          subtotal: 54.00
        },
        {
          id: 4,
          ventaId: 2,
          productoId: 4,
          productoNombre: 'Omeprazol 20mg',
          cantidad: 1,
          precioUnitario: 26.00,
          subtotal: 26.00
        }
      ]
    },
    {
      id: 3,
      numeroVenta: 'V-2024-003',
      fechaVenta: new Date('2024-11-10T14:45:00'),
      clienteId: 3,
      clienteNombre: 'Ana López',
      clienteDni: '11223344',
      vendedorId: 1,
      vendedorNombre: 'Admin Usuario',
      subtotal: 33.90,
      igv: 6.10,
      total: 40.00,
      metodoPago: 'transferencia',
      estado: 'completada',
      detalles: [
        {
          id: 5,
          ventaId: 3,
          productoId: 5,
          productoNombre: 'Amoxicilina 500mg',
          cantidad: 2,
          precioUnitario: 20.00,
          subtotal: 40.00
        }
      ]
    },
    {
      id: 4,
      numeroVenta: 'V-2024-004',
      fechaVenta: new Date('2024-11-10T16:20:00'),
      clienteNombre: 'Cliente Ocasional',
      vendedorId: 1,
      vendedorNombre: 'Admin Usuario',
      subtotal: 25.42,
      igv: 4.58,
      total: 30.00,
      metodoPago: 'efectivo',
      estado: 'pendiente',
      detalles: [
        {
          id: 6,
          ventaId: 4,
          productoId: 1,
          productoNombre: 'Paracetamol 500mg',
          cantidad: 2,
          precioUnitario: 15.00,
          subtotal: 30.00
        }
      ]
    }
  ];

  private productos: ProductoVenta[] = [
    { id: 1, nombre: 'Paracetamol 500mg', precio: 15.00, stock: 100, descripcion: 'Analgésico y antipirético' },
    { id: 2, nombre: 'Ibuprofeno 400mg', precio: 20.00, stock: 75, descripcion: 'Antiinflamatorio no esteroideo' },
    { id: 3, nombre: 'Vitamina C 1g', precio: 18.00, stock: 50, descripcion: 'Suplemento vitamínico' },
    { id: 4, nombre: 'Omeprazol 20mg', precio: 26.00, stock: 60, descripcion: 'Inhibidor de la bomba de protones' },
    { id: 5, nombre: 'Amoxicilina 500mg', precio: 20.00, stock: 40, descripcion: 'Antibiótico de amplio espectro' },
    { id: 6, nombre: 'Loratadina 10mg', precio: 12.00, stock: 80, descripcion: 'Antihistamínico' },
    { id: 7, nombre: 'Diclofenaco 50mg', precio: 22.00, stock: 45, descripcion: 'Antiinflamatorio' },
    { id: 8, nombre: 'Metformina 850mg', precio: 25.00, stock: 35, descripcion: 'Antidiabético' }
  ];

  private clientes: ClienteVenta[] = [
    { id: 1, nombre: 'María', apellido: 'González', dni: '12345678', telefono: '987654321', email: 'maria@email.com' },
    { id: 2, nombre: 'Carlos', apellido: 'Rodríguez', dni: '87654321', telefono: '912345678', email: 'carlos@email.com' },
    { id: 3, nombre: 'Ana', apellido: 'López', dni: '11223344', telefono: '998877665', email: 'ana@email.com' },
    { id: 4, nombre: 'Luis', apellido: 'Martínez', dni: '55667788', telefono: '955443322', email: 'luis@email.com' },
    { id: 5, nombre: 'Patricia', apellido: 'Vásquez', dni: '99887766', telefono: '977665544', email: 'patricia@email.com' }
  ];

  constructor() { }

  // Obtener todas las ventas
  getVentas(): Observable<Venta[]> {
    return of(this.ventas);
  }

  // Obtener venta por ID
  getVentaById(id: number): Observable<Venta | undefined> {
    const venta = this.ventas.find(v => v.id === id);
    return of(venta);
  }

  // Crear nueva venta
  createVenta(venta: Venta): Observable<Venta> {
    const newId = Math.max(...this.ventas.map(v => v.id || 0)) + 1;
    const numeroVenta = this.generarNumeroVenta();
    
    const newVenta = {
      ...venta,
      id: newId,
      numeroVenta,
      fechaVenta: new Date(),
      estado: 'completada' as const
    };
    
    this.ventas.push(newVenta);
    return of(newVenta);
  }

  // Actualizar venta
  updateVenta(id: number, venta: Partial<Venta>): Observable<Venta | null> {
    const index = this.ventas.findIndex(v => v.id === id);
    if (index !== -1) {
      this.ventas[index] = { ...this.ventas[index], ...venta };
      return of(this.ventas[index]);
    }
    return of(null);
  }

  // Eliminar venta
  deleteVenta(id: number): Observable<boolean> {
    const index = this.ventas.findIndex(v => v.id === id);
    if (index !== -1) {
      this.ventas.splice(index, 1);
      return of(true);
    }
    return of(false);
  }

  // Buscar ventas
  searchVentas(term: string): Observable<Venta[]> {
    const filtered = this.ventas.filter(venta =>
      venta.numeroVenta.toLowerCase().includes(term.toLowerCase()) ||
      (venta.clienteNombre && venta.clienteNombre.toLowerCase().includes(term.toLowerCase())) ||
      (venta.clienteDni && venta.clienteDni.includes(term)) ||
      venta.estado.toLowerCase().includes(term.toLowerCase())
    );
    return of(filtered);
  }

  // Obtener estadísticas de ventas
  getVentaStats(): Observable<VentaStats> {
    const totalVentas = this.ventas.length;
    
    // Ventas de hoy
    const hoy = new Date();
    const ventasHoy = this.ventas.filter(v => {
      const fechaVenta = new Date(v.fechaVenta);
      return fechaVenta.toDateString() === hoy.toDateString();
    }).length;

    // Ventas del mes actual
    const ventasMes = this.ventas.filter(v => {
      const fechaVenta = new Date(v.fechaVenta);
      return fechaVenta.getMonth() === hoy.getMonth() && 
             fechaVenta.getFullYear() === hoy.getFullYear();
    }).length;

    // Ventas pendientes
    const ventasPendientes = this.ventas.filter(v => v.estado === 'pendiente').length;

    // Ingresos totales
    const ingresosTotales = this.ventas
      .filter(v => v.estado === 'completada')
      .reduce((total, venta) => total + venta.total, 0);

    // Promedio de venta
    const ventasCompletadas = this.ventas.filter(v => v.estado === 'completada');
    const promedioVenta = ventasCompletadas.length > 0 
      ? ingresosTotales / ventasCompletadas.length 
      : 0;

    const stats: VentaStats = {
      totalVentas,
      ventasHoy,
      ventasMes,
      promedioVenta,
      ventasPendientes,
      ingresosTotales
    };

    return of(stats);
  }

  // Obtener resumen de ventas por fecha
  getVentasResumen(fechaInicio: Date, fechaFin: Date): Observable<VentaResumen[]> {
    const resumen: { [key: string]: VentaResumen } = {};

    this.ventas
      .filter(v => {
        const fechaVenta = new Date(v.fechaVenta);
        return fechaVenta >= fechaInicio && fechaVenta <= fechaFin && v.estado === 'completada';
      })
      .forEach(venta => {
        const fecha = new Date(venta.fechaVenta).toISOString().split('T')[0];
        
        if (!resumen[fecha]) {
          resumen[fecha] = {
            fecha,
            numeroVentas: 0,
            totalVentas: 0
          };
        }
        
        resumen[fecha].numeroVentas++;
        resumen[fecha].totalVentas += venta.total;
      });

    return of(Object.values(resumen).sort((a, b) => a.fecha.localeCompare(b.fecha)));
  }

  // Obtener productos para venta
  getProductosVenta(): Observable<ProductoVenta[]> {
    return of(this.productos.filter(p => p.stock > 0));
  }

  // Obtener clientes para venta
  getClientesVenta(): Observable<ClienteVenta[]> {
    return of(this.clientes);
  }

  // Buscar productos
  searchProductos(term: string): Observable<ProductoVenta[]> {
    const filtered = this.productos.filter(producto =>
      producto.nombre.toLowerCase().includes(term.toLowerCase()) &&
      producto.stock > 0
    );
    return of(filtered);
  }

  // Buscar clientes
  searchClientesVenta(term: string): Observable<ClienteVenta[]> {
    const filtered = this.clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(term.toLowerCase()) ||
      cliente.apellido.toLowerCase().includes(term.toLowerCase()) ||
      cliente.dni.includes(term)
    );
    return of(filtered);
  }

  // Obtener ventas por estado
  getVentasByEstado(estado: string): Observable<Venta[]> {
    const filtered = this.ventas.filter(v => v.estado === estado);
    return of(filtered);
  }

  // Cancelar venta
  cancelarVenta(id: number, motivo?: string): Observable<boolean> {
    const index = this.ventas.findIndex(v => v.id === id);
    if (index !== -1) {
      this.ventas[index].estado = 'cancelada';
      if (motivo) {
        this.ventas[index].observaciones = motivo;
      }
      return of(true);
    }
    return of(false);
  }

  // Generar número de venta
  private generarNumeroVenta(): string {
    const año = new Date().getFullYear();
    const ultimoNumero = this.ventas.length + 1;
    return `V-${año}-${ultimoNumero.toString().padStart(3, '0')}`;
  }

  // Calcular totales de venta
  calcularTotales(detalles: DetalleVenta[]): { subtotal: number; igv: number; total: number } {
    const subtotal = detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0);
    const igv = subtotal * 0.18; // IGV 18%
    const total = subtotal + igv;
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      igv: Math.round(igv * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }
}
