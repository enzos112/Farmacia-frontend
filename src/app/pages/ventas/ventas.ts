import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; 

import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

import { Venta, DetalleVenta, VentaStats, ProductoVenta, ClienteVenta, VentaDTO } from '../../models/venta';
import { VentaService } from '../../services/venta.service';
import { ClienteService } from '../../services/cliente.service';
// import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog'; // Descomenta si lo usas

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatIconModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatInputModule, 
    MatFormFieldModule,
    MatSnackBarModule,
    BaseChartDirective
  ],
  templateUrl: './ventas.html',
  styleUrls: ['./ventas.css']
})
export class VentasComponent implements OnInit {

  // Servicio de notificaciones (SnackBar)
  private snackBar = inject(MatSnackBar);

  constructor(
    private ventaService: VentaService, 
    private clienteService: ClienteService, 
    private dialog: MatDialog
  ) {}

  // --- VARIABLES GLOBALES ---
  today: string = new Date().toDateString();
  yesterday: string = new Date(Date.now() - 86400000).toDateString();

  // --- DATOS PRINCIPALES ---
  ventas: Venta[] = [];
  ventasFiltradas: Venta[] = [];
  ventaStats: VentaStats = { totalVentas: 0, ventasHoy: 0, ventasMes: 0, promedioVenta: 0, ventasPendientes: 0, ingresosTotales: 0 };

  // --- GRÁFICOS ---
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  public ingresosChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false, elements: { line: { tension: 0.4 } },
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.7)' } }, y: { display: false } }
  };
  public ingresosChartType: ChartType = 'line';
  public ingresosChartData: ChartData<'line'> = { labels: [], datasets: [{ data: [], borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.2)', fill: 'origin' }] };

  // --- FILTROS ---
  searchTerm: string = '';
  filtroEstado: string = ''; 
  
  // --- EXTRAS ---
  mesActual: string = '';
  mesSeleccionado: string = '';
  mesesDelAnio: string[] = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  mesesDisponibles: string[] = [];
  productosVendidos: any[] = [];
  maxCantidadVendida: number = 0;
  actividadReciente: any[] = [];
  
  // --- MODALES Y FORMULARIOS ---
  mostrarModalVenta = false;
  ventaEditando: Venta | null = null;
  ventaForm: any = { condicionPago: 'Contado' };
  
  // Búsqueda Cliente
  busquedaCliente: string = '';
  clientesEncontrados: ClienteVenta[] = [];
  clienteSeleccionado: ClienteVenta | null = null;

  // Búsqueda Producto
  busquedaProducto: string = '';
  productosEncontrados: ProductoVenta[] = [];
  detallesVenta: any[] = []; 
  totalesVenta = { subtotal: 0, impuesto: 0, total: 0 };

  // Otros Modales
  mostrarModalDetalle = false;
  ventaDetalle: Venta | null = null;
  mostrarModalOcultar = false;
  ventaOcultar: Venta | null = null;
  
  // --- LOGICA DE ALERTA PERSONALIZADA (NUEVO) ---
  mostrarAlertaCarrito: boolean = false;

  ngOnInit() {
    this.obtenerMesActual();
    this.mesSeleccionado = this.mesActual;
    this.cargarDatos();
  }

  obtenerMesActual() { this.mesActual = this.mesesDelAnio[new Date().getMonth()]; }

  cargarDatos() {
    this.ventaService.getVentas().subscribe({
      next: (ventas: any) => {
        this.ventas = ventas;
        this.aplicarFiltros();
        if (ventas.length > 0) {
            this.calcularTopProductos();
            this.calcularActividadReciente();
            this.calcularMesesDisponibles();
            this.actualizarGraficoIngresos();
        }
      },
      error: (e: any) => console.error('Error silencioso al cargar ventas', e)
    });
    
    this.ventaService.getVentaStats().subscribe((stats: any) => this.ventaStats = stats);
  }

  buscarVentas() { this.aplicarFiltros(); }
  filtrarPorEstado() { this.aplicarFiltros(); }

  private aplicarFiltros() {
    let resultado = [...this.ventas];
    if (this.filtroEstado) {
      resultado = resultado.filter(v => v.estado === this.filtroEstado);
    } else {
       resultado = resultado.filter(v => v.estado !== 'ANULADA'); 
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      resultado = resultado.filter(venta =>
        venta.numComprobante?.toLowerCase().includes(term) ||
        venta.cliente?.nombre.toLowerCase().includes(term) ||
        venta.cliente?.dni.includes(term)
      );
    }
    this.ventasFiltradas = resultado;
  }

  getCondicionPagoLabel(c: string) { return c; }
  getEstadoLabel(e: string) { return e === 'REGISTRADA' ? 'Registrada' : (e === 'ANULADA' ? 'Anulada' : e); }

  getProductosVenta(venta: Venta): string {
    if (!venta.detalleVenta || venta.detalleVenta.length === 0) return '-';
    return venta.detalleVenta.map(d => d.producto?.nombre || 'Desconocido').join(', ');
  }

  getTotalCantidad(venta: Venta): number {
    if (!venta.detalleVenta) return 0;
    return venta.detalleVenta.reduce((sum, d) => sum + d.cantidad, 0);
  }

  // --- GESTIÓN DEL MODAL DE VENTA ---
  abrirModalNuevaVenta() {
    this.ventaEditando = null;
    this.resetearFormularioVenta();
    this.mostrarModalVenta = true;
  }

  editarVenta(v: Venta) {
    this.ventaEditando = v;
    this.ventaForm = { condicionPago: v.condicionPago };
    if (v.cliente) {
      this.clienteSeleccionado = { 
         id: v.cliente.idCliente!, nombre: v.cliente.nombre, apellido: v.cliente.apellido, dni: v.cliente.dni,
         telefono: v.cliente.telefono, email: v.cliente.email
      } as ClienteVenta;
    }
    this.detallesVenta = v.detalleVenta.map(d => ({
        productoId: d.producto?.idProducto,
        productoNombre: d.producto?.nombre || 'Desconocido',
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        subtotal: d.subtotal
    }));
    this.calcularTotales();
    this.mostrarModalVenta = true;
  }

  cerrarModalVenta() { 
      this.mostrarModalVenta = false; 
      this.resetearFormularioVenta(); 
  }

  private resetearFormularioVenta() {
    this.ventaEditando = null;
    this.ventaForm = { condicionPago: 'Contado' };
    this.clienteSeleccionado = null;
    this.busquedaCliente = ''; this.clientesEncontrados = [];
    this.busquedaProducto = ''; this.productosEncontrados = [];
    this.detallesVenta = [];
    this.totalesVenta = { subtotal: 0, impuesto: 0, total: 0 };
    // Reseteamos alerta
    this.mostrarAlertaCarrito = false;
  }

  // --- BÚSQUEDAS ---
  buscarClientesModal() {
    if (!this.busquedaCliente.trim()) { this.clientesEncontrados = []; return; }
    this.ventaService.searchClientesVenta(this.busquedaCliente).subscribe({
        next: (c: any) => this.clientesEncontrados = c,
        error: () => { }
    });
  }
  
  buscarProductosModal() {
    if (!this.busquedaProducto.trim()) { this.productosEncontrados = []; return; }
    this.ventaService.searchProductos(this.busquedaProducto).subscribe({
        next: (p: any) => this.productosEncontrados = p,
        error: () => { }
    });
  }

  seleccionarCliente(c: any) { this.clienteSeleccionado = c; this.busquedaCliente=''; this.clientesEncontrados=[]; }
  quitarCliente() { this.clienteSeleccionado = null; }

  agregarProducto(p: ProductoVenta) {
    const ex = this.detallesVenta.find(d => d.productoId === p.id);
    if (ex) {
      ex.cantidad++;
      ex.subtotal = ex.cantidad * ex.precioUnitario;
    } else {
      this.detallesVenta.push({
        productoId: p.id, 
        productoNombre: p.nombre, 
        cantidad: 1, 
        precioUnitario: p.precio, 
        subtotal: p.precio
      });
    }
    this.busquedaProducto=''; this.productosEncontrados=[]; 
    this.calcularTotales();
    // Si había alerta, la quitamos al agregar algo
    this.mostrarAlertaCarrito = false;
  }

  actualizarSubtotal(i: number) { 
      const d = this.detallesVenta[i];
      if(d.cantidad <= 0) d.cantidad = 1;
      d.subtotal = d.cantidad * d.precioUnitario;
      this.calcularTotales();
  }
  quitarProducto(i: number) { this.detallesVenta.splice(i, 1); this.calcularTotales(); }
  private calcularTotales() { this.totalesVenta = this.ventaService.calcularTotales(this.detallesVenta); }

  // --- ALERTA PERSONALIZADA (EN EL HTML) ---
  cerrarAlerta() {
    this.mostrarAlertaCarrito = false;
  }

  // --- NOTIFICACIONES SNACKBAR (GENERALES) ---
  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'warning') {
    // Estas son las alertas flotantes normales (abajo o arriba) que cierran el modal
    this.snackBar.open(mensaje, 'CERRAR', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: tipo === 'success' ? ['alerta-success'] : ['alerta-error']
    });
  }

  // --- CONFIRMAR VENTA CON VALIDACIÓN ---
  confirmarVenta() {
     // VALIDACIÓN 1: Carrito vacío -> USA LA ALERTA DENTRO DEL MODAL
     if (this.detallesVenta.length === 0) {
        this.mostrarAlertaCarrito = true;
        
        // Auto-ocultar a los 3 segundos (opcional)
        setTimeout(() => {
            this.mostrarAlertaCarrito = false;
        }, 3000);
        
        return; // Detiene el proceso
     }

     // VALIDACIÓN 2: Condición de pago
     if (!this.ventaForm.condicionPago) {
        this.mostrarNotificacion('Seleccione una condición de pago', 'warning');
        return;
     }

     this.guardarVenta();
  }

  guardarVenta() {
    // Si no hay cliente seleccionado, usamos ID 1 (Cliente Ocasional) o null según tu backend
    const idCliente = this.clienteSeleccionado?.id || 1; 

    const dto: VentaDTO = {
      idCliente: idCliente,
      items: this.detallesVenta.map(d => ({
         idProducto: d.productoId,
         cantidad: d.cantidad
      }))
    };

    this.ventaService.createVenta(dto).subscribe({
       next: (v: any) => {
           this.cargarDatos();
           this.cerrarModalVenta();
           this.mostrarNotificacion('¡Venta registrada exitosamente!', 'success');
       },
       error: (e: any) => {
           console.error(e);
           this.mostrarNotificacion('Error al registrar la venta. Verifique stock.', 'error');
       }
    });
  }

  // --- DETALLES Y ANULACIÓN ---
  verDetalleVenta(v: Venta) { this.ventaDetalle = v; this.mostrarModalDetalle = true; }
  cerrarModalDetalle() { this.mostrarModalDetalle = false; this.ventaDetalle = null; }
  
  ocultarVenta(v: Venta) { this.ventaOcultar = v; this.mostrarModalOcultar = true; }
  
  confirmarOcultar() {
    if (!this.ventaOcultar?.idVenta) return;
    this.ventaService.anularVenta(this.ventaOcultar.idVenta).subscribe({
        next: (res: any) => { 
            this.cargarDatos(); 
            this.cerrarModalOcultar();
            this.mostrarNotificacion('Venta anulada correctamente', 'success');
        },
        error: (e: any) => this.mostrarNotificacion('Error al anular la venta', 'error')
    });
  }
  cerrarModalOcultar() { this.mostrarModalOcultar = false; this.ventaOcultar = null; }

  // --- LÓGICA DE GRÁFICOS Y ESTADÍSTICAS ---
  private calcularTopProductos() {
    const counts: any = {};
    this.ventas.filter(v => v.estado === 'REGISTRADA').forEach(venta => {
        if (venta.detalleVenta) {
            venta.detalleVenta.forEach(d => {
                const nombre = d.producto?.nombre || 'Desconocido';
                if (!counts[nombre]) counts[nombre] = { cantidad: 0, ingresos: 0 };
                counts[nombre].cantidad += d.cantidad;
                counts[nombre].ingresos += d.subtotal;
            });
        }
    });
    this.productosVendidos = Object.keys(counts).map(k => ({ nombre: k, ...counts[k] }))
        .sort((a:any, b:any) => b.cantidad - a.cantidad).slice(0, 5);
    this.maxCantidadVendida = this.productosVendidos.length > 0 ? Math.max(...this.productosVendidos.map((p:any) => p.cantidad)) : 0;
  }

  private calcularActividadReciente() {
     this.actividadReciente = this.ventas.slice(0, 5).map(v => ({
         texto: `Venta ${v.numComprobante} - S/. ${v.total.toFixed(2)}`,
         fecha: new Date(v.fechaVenta)
     }));
  }

  private calcularMesesDisponibles() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const monthsWithSales = new Set<string>();
    monthsWithSales.add(this.mesesDelAnio[currentMonth]);

    this.ventas.forEach(venta => {
      const fecha = new Date(venta.fechaVenta);
      if (fecha.getFullYear() === currentYear) {
        monthsWithSales.add(this.mesesDelAnio[fecha.getMonth()]);
      }
    });
    this.mesesDisponibles = Array.from(monthsWithSales).sort((a, b) => this.mesesDelAnio.indexOf(a) - this.mesesDelAnio.indexOf(b));
  }

  private actualizarGraficoIngresos() {
    const mesIndex = this.mesesDelAnio.indexOf(this.mesSeleccionado);
    if (mesIndex === -1) return;
    const year = new Date().getFullYear();
    const ventasMes = this.ventas.filter(venta => {
      const fecha = new Date(venta.fechaVenta);
      return fecha.getMonth() === mesIndex && fecha.getFullYear() === year && venta.estado === 'REGISTRADA';
    });
    const totalMes = ventasMes.reduce((sum, v) => sum + v.total, 0);
    this.ventaStats.ingresosTotales = totalMes;
    const semanas: number[] = [0, 0, 0, 0]; 
    ventasMes.forEach(venta => {
      const fecha = new Date(venta.fechaVenta);
      const dia = fecha.getDate();
      const semana = Math.min(Math.floor((dia - 1) / 7), 3);
      semanas[semana] += venta.total;
    });
    this.ingresosChartData = {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4+'],
      datasets: [{
          data: semanas,
          borderColor: '#ffffff', backgroundColor: 'rgba(255,255,255,0.2)',
          pointBackgroundColor: '#ffffff', pointBorderColor: '#303F9F', fill: 'origin', borderWidth: 2, tension: 0.4
      }]
    };
    if (this.chart) this.chart.update();
  }
  
  onMesChange(e:any) {
      const select = e.target as HTMLSelectElement;
      this.mesSeleccionado = select.value;
      this.actualizarGraficoIngresos();
  }
}