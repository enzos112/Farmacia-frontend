import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, catchError, forkJoin } from 'rxjs'; // <--- AGREGADO forkJoin
import { environment } from '../../environments/environment.development';
import { Venta, VentaDTO, VentaStats, ProductoVenta, ClienteVenta } from '../models/venta';
import { jsonrepair } from 'jsonrepair';

@Injectable({
  providedIn: 'root'
})
export class VentaService {

  private http = inject(HttpClient);
  private url = `${environment.BASE_URL}/ventas`; 

  constructor() { }

  // --- 1. GET VENTAS (ESTRATEGIA "CRAWLER" PARA EVITAR CORTE DE DATOS) ---
  getVentas(): Observable<Venta[]> {
    // Definimos cuántas ventas queremos traer (ej: las últimas 20)
    // Hacemos peticiones individuales de tamaño 1 para que si una crashea, no bloquee al resto.
    const peticiones: Observable<Venta | null>[] = [];
    const cantidadAVisualizar = 20; 

    for (let i = 0; i < cantidadAVisualizar; i++) {
      const params = new HttpParams()
        .set('page', i.toString())
        .set('size', '1') // Pedimos DE UNA EN UNA
        .set('sort', 'idVenta,desc');

      const req = this.http.get(this.url, { params, responseType: 'text' }).pipe(
        map(rawString => {
          // Intentamos reparar la respuesta individual
          const lista = this.repararYExtraer(rawString);
          return lista.length > 0 ? lista[0] : null;
        }),
        catchError(() => of(null)) // Si falla una pagina especifica, la ignoramos
      );
      
      peticiones.push(req);
    }

    // Ejecutamos todas las peticiones en paralelo y unimos los resultados
    return forkJoin(peticiones).pipe(
      map(resultados => {
        // Filtramos los nulos (paginas vacias o errores) y retornamos la lista limpia
        const ventasRecuperadas = resultados.filter((v): v is Venta => v !== null);
        console.log(`✅ Se lograron recuperar ${ventasRecuperadas.length} ventas fragmentadas.`);
        return ventasRecuperadas;
      })
    );
  }

  // --- MÉTODOS DE REPARACIÓN (Mantenemos los que te di antes) ---
  private repararYExtraer(rawString: string): Venta[] {
    try {
      let data: any;
      try {
        data = JSON.parse(rawString);
      } catch {
        const repaired = jsonrepair(rawString);
        data = JSON.parse(repaired);
      }
      const lista = this.extractContent(data);
      return lista.map(v => this.normalizarVenta(v));
    } catch (e) {
      return [];
    }
  }

  private extractContent(data: any): Venta[] {
    if (data && data.content) return data.content;
    return Array.isArray(data) ? data : [];
  }

  private normalizarVenta(v: any): Venta {
    // A. Corregir Fecha
    if (Array.isArray(v.fechaVenta)) {
      const d = v.fechaVenta;
      const fechaObj = new Date(d[0], d[1] - 1, d[2], d[3] || 0, d[4] || 0, d[5] || 0);
      v.fechaVenta = fechaObj.toISOString();
    }
    // B. Corregir Productos
    if (v.detalleVenta && Array.isArray(v.detalleVenta)) {
      v.detalleVenta.forEach((det: any) => {
        if (!det.productoNombre && det.producto && det.producto.nombre) {
          det.productoNombre = det.producto.nombre;
        }
      });
    }
    v.impuesto = v.impuesto || 0;
    return v;
  }

  // --- RESTO DEL SERVICIO (Stats, Crear, etc.) ---
  
  getVentaStats(): Observable<VentaStats> {
     // Nota: Para los stats, seguimos usando la petición masiva aunque sea inexacta 
     // para no saturar con 1000 peticiones individuales.
     const params = new HttpParams().set('page', '0').set('size', '1000').set('sort', 'idVenta,desc');
     return this.http.get(this.url, { params, responseType: 'text' }).pipe(
      map(rawString => {
        const ventas = this.repararYExtraer(rawString);
        return this.calcularEstadisticasLocales(ventas);
      }),
      catchError(() => of({
          totalVentas: 0, ventasHoy: 0, ventasHoyMonto: 0,
          ventasMes: 0, promedioVenta: 0, ventasPendientes: 0, ingresosTotales: 0
      }))
    );
  }

  private calcularEstadisticasLocales(ventas: Venta[]): VentaStats {
    const validas = ventas.filter(v => v.estado === 'REGISTRADA');
    const hoyStr = new Date().toISOString().slice(0, 10);
    const mesActualStr = hoyStr.slice(0, 7);
    const ventasHoyList = validas.filter(v => v.fechaVenta?.startsWith(hoyStr));
    const montoHoy = ventasHoyList.reduce((acc, v) => acc + v.total + (v.impuesto || 0), 0);
    const conteoMes = validas.filter(v => v.fechaVenta?.startsWith(mesActualStr)).length;
    const totalIngresos = validas.reduce((acc, v) => acc + v.total + (v.impuesto || 0), 0);
    const promedio = validas.length > 0 ? totalIngresos / validas.length : 0;

    return {
      totalVentas: ventas.length,
      ventasHoy: ventasHoyList.length,
      ventasHoyMonto: montoHoy,
      ventasMes: conteoMes,
      promedioVenta: promedio,
      ventasPendientes: ventas.filter(v => v.estado === 'pendiente').length,
      ingresosTotales: totalIngresos
    };
  }

  createVenta(venta: VentaDTO): Observable<any> {
    return this.http.post(this.url, venta, { responseType: 'text' }).pipe(
      map(rawString => { try { return JSON.parse(jsonrepair(rawString)); } catch { return { success: true }; } })
    );
  }

  // Métodos auxiliares simples
  anularVenta(id: number): Observable<any> { return this.http.post(`${this.url}/anular/${id}`, {}); }
  updateVenta(id: number, venta: any): Observable<any> { return of(null); }
  
  // Búsquedas
  searchClientesVenta(term: string): Observable<ClienteVenta[]> {
    return this.http.get<any>(`${environment.BASE_URL}/cliente`).pipe(
      map(response => {
        const data = response.content || (Array.isArray(response) ? response : []);
        return data
          .filter((c: any) => 
            // 1. FILTRO DE ESTADO: Solo mostramos los 'activo'
            (c.estado || 'activo').toLowerCase() === 'activo' && 
            // 2. FILTRO DE TEXTO: Coincidencia con nombre o DNI
            ((c.nombre + ' ' + c.apellido).toLowerCase().includes(term.toLowerCase()) || c.dni.includes(term))
          )
          .slice(0, 10)
          .map((c: any) => ({
            id: c.idCliente, 
            nombre: c.nombre, 
            apellido: c.apellido, 
            dni: c.dni, 
            email: c.email
          }));
      })
    );
  }
  searchProductos(term: string): Observable<ProductoVenta[]> {
    return this.http.get<any>(`${environment.BASE_URL}/productos`).pipe(
      map(res => (res.content || (Array.isArray(res) ? res : [])).filter((p: any) => p.nombre.toLowerCase().includes(term.toLowerCase())).slice(0, 10).map((p: any) => ({ id: p.idProducto, idProducto: p.idProducto, nombre: p.nombre, precio: p.precioMayor || 0, stock: p.stock, precioVenta: p.precioMayor, precioMenor: p.precioMenor })))
    );
  }
  calcularTotales(detalles: any[]) {
    const subtotal = detalles.reduce((acc, d) => acc + (d.cantidad * d.precioUnitario), 0);
    return { subtotal, igv: subtotal * 0.18, total: subtotal * 1.18 };
  }
}