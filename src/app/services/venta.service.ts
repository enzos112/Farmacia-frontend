import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Venta, VentaDTO, VentaStats, ProductoVenta, ClienteVenta } from '../models/venta';
import { Cliente } from '../models/cliente';
import { Producto } from '../models/producto';

@Injectable({
  providedIn: 'root'
})
export class VentaService {

  private http = inject(HttpClient);
  private url = `${environment.BASE_URL}/ventas`; 

  constructor() { }

  // --- LEER (GET) ---
  getVentas(): Observable<Venta[]> {
    return this.http.get<any>(this.url).pipe(
      map(response => {
        const data = response.content ? response.content : response;
        return Array.isArray(data) ? data : [];
      })
    );
  }

  // --- CREAR (POST) ---
  createVenta(venta: VentaDTO): Observable<any> {
    return this.http.post(this.url, venta);
  }

  // --- ANULAR (POST) ---
  anularVenta(id: number): Observable<any> {
    return this.http.post(`${this.url}/anular/${id}`, {});
  }
  
  // Compatibilidad update
  updateVenta(id: number, venta: any): Observable<any> {
      return of(null); 
  }

  // --- ESTADÍSTICAS ---
  getVentaStats(): Observable<VentaStats> {
    return this.getVentas().pipe(
      map(ventas => {
        const validas = ventas.filter(v => v.estado === 'REGISTRADA');
        const total = validas.reduce((acc, v) => acc + v.total, 0);
        const hoy = new Date().toISOString().slice(0, 10);
        const ventasHoy = validas.filter(v => v.fechaVenta?.slice(0, 10) === hoy);
        const ventasHoyMonto = ventasHoy.reduce((acc, v) => acc + v.total, 0);
        // Ventas del mes actual
        const mesActual = hoy.slice(0, 7);
        const ventasMes = validas.filter(v => v.fechaVenta?.slice(0, 7) === mesActual).length;
        // Promedio de venta
        const promedioVenta = validas.length > 0 ? total / validas.length : 0;
        // Ventas pendientes
        const ventasPendientes = ventas.filter(v => v.estado === 'pendiente').length;
        return {
          totalVentas: validas.length,
          ventasHoy: ventasHoy.length,
          ventasHoyMonto: ventasHoyMonto,
          ventasMes: ventasMes,
          promedioVenta: promedioVenta,
          ventasPendientes: ventasPendientes,
          ingresosTotales: total
        };
      })
    );
  }

  // --- BÚSQUEDAS (SOLUCIÓN ERROR TS2322) ---
  searchClientesVenta(term: string): Observable<ClienteVenta[]> {
    return this.http.get<any[]>(`${environment.BASE_URL}/cliente`).pipe(
      map(clientes => 
        clientes
          .filter(c => (c.nombre + ' ' + c.apellido).toLowerCase().includes(term.toLowerCase()) || c.dni.includes(term))
          .slice(0, 10)
          .map(c => ({
            id: c.idCliente,
            nombre: c.nombre,
            apellido: c.apellido,
            dni: c.dni,
            telefono: c.telefono,
            email: c.email
          }))
      )
    );
  }

  searchProductos(term: string): Observable<ProductoVenta[]> {
    // Usamos <any[]> para el GET para evitar conflictos con el modelo Producto estricto del backend
    return this.http.get<any[]>(`${environment.BASE_URL}/productos`).pipe(
      map(productos => 
        productos
          .filter(p => p.nombre.toLowerCase().includes(term.toLowerCase()))
          .map(p => ({
            id: p.idProducto,
            idProducto: p.idProducto,
            nombre: p.nombre,
            precio: p.precioVenta, // Mapeamos precioVenta a precio
            stock: p.stock,
            
            // PROPIEDADES QUE FALTABAN PARA CUMPLIR LA INTERFAZ:
            // Aunque no las uses en el modal, la interfaz ProductoVenta (si extiende de Producto) las exige.
            // Las llenamos con valores por defecto o del objeto original.
            descripcion: p.descripcion || '',
            precioVenta: p.precioVenta, // Por si la interfaz lo pide con este nombre
            laboratorio: p.laboratorio || '',
            precioMenor: p.precioMenor || 0,
            precioMayor: p.precioMayor || 0,
            stockminimo: p.stockminimo || 0,
            fechaVencimiento: p.fechaVencimiento,
            idCategoria: p.idCategoria,
            idUnidadMedida: p.idUnidadMedida,
            categoria: p.categoria,
            unidadMedida: p.unidadMedida
          } as ProductoVenta)) // Forzamos el tipo final
      )
    );
  }
  
  calcularTotales(detalles: any[]) {
    const subtotal = detalles.reduce((acc, d) => acc + (d.cantidad * d.precioUnitario), 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    return { subtotal, igv, total };
  }
}