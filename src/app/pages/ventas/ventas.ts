import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

// --- 1. IMPORTACIONES PARA GRÁFICOS ---
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

// Importaciones de modelos y servicios
import { Venta, DetalleVenta, VentaStats, ProductoVenta, ClienteVenta } from '../../models/venta';
import { VentaService } from '../../services/venta';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';

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
    BaseChartDirective // ¡Vital para los gráficos!
  ],
  templateUrl: './ventas.html',
  styleUrls: ['./ventas.css']
})
export class VentasComponent implements OnInit {

  constructor(private ventaService: VentaService, private dialog: MatDialog) {}

  // --- DATOS PRINCIPALES ---
  ventas: Venta[] = [];
  ventasFiltradas: Venta[] = [];
  ventaStats: VentaStats = {
    totalVentas: 0,
    ventasHoy: 0,
    ventasHoyMonto: 0,
    ventasMes: 0,
    promedioVenta: 0,
    ventasPendientes: 0,
    ingresosTotales: 0
  };

  // --- 2. CONFIGURACIÓN DEL GRÁFICO (Soluciona error 'ingresosChart...') ---
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  
  public ingresosChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: { line: { tension: 0.4 } }, // Curvas suaves
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.7)' } },
      y: { display: false }
    }
  };
  public ingresosChartType: ChartType = 'line';
  public ingresosChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        borderColor: '#ffffff',
        backgroundColor: 'rgba(255,255,255,0.2)',
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#303F9F',
        fill: 'origin',
        borderWidth: 2
      }
    ]
  };

  // --- 3. FILTROS (Soluciona error 'filtroActual', 'setFiltroRapido') ---
  searchTerm: string = '';
  filtroActual: string = 'todos'; // 'todos', 'completada', 'pendiente', 'cancelada'
  filtroEstado: string = '';

  // --- VARIABLES DE FECHA Y MES ---
  mesActual: string = 'Noviembre';
  mesSeleccionado: string = '';
  mesesDelAnio: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  mesesDisponibles: string[] = [];

  // --- DATOS CALCULADOS (Widgets) ---
  productosVendidos: any[] = [];
  maxCantidadVendida: number = 0;

  actividadReciente: any[] = [];

  // --- VARIABLES DE MODALES ---
  mostrarModalVenta: boolean = false;
  ventaEditando: Venta | null = null;
  ventaForm: any = { metodoPago: 'efectivo', observaciones: '' };
  busquedaCliente: string = '';
  clientesEncontrados: ClienteVenta[] = [];
  clienteSeleccionado: ClienteVenta | null = null;
  busquedaProducto: string = '';
  productosEncontrados: ProductoVenta[] = [];
  detallesVenta: DetalleVenta[] = [];
  totalesVenta = { subtotal: 0, igv: 0, total: 0 };
  mostrarModalDetalle: boolean = false;
  ventaDetalle: Venta | null = null;
  mostrarModalCancelar: boolean = false;
  ventaCancelar: Venta | null = null;
  motivoCancelacion: string = '';
  mostrarModalOcultar: boolean = false;
  ventaOcultar: Venta | null = null;
  mostrarModalProductos: boolean = false;
  mostrarModalActividad: boolean = false;
  mostrarModalVentas: boolean = false;
  productosCompletos: any[] = [];
  actividadCompleta: any[] = [];

  ngOnInit() {
    this.obtenerMesActual();
    this.mesSeleccionado = this.mesActual;
    this.filtroEstado = 'todos';
    this.cargarDatos();
    this.actualizarGraficoIngresos();
  }

  obtenerMesActual() {
    const fecha = new Date();
    this.mesActual = this.mesesDelAnio[fecha.getMonth()];
  }

  cargarDatos() {
    this.ventaService.getVentas().subscribe(ventas => {
      this.ventas = ventas;
      this.aplicarFiltros(); // Aplica filtros iniciales
      this.calcularTopProductos(); // Calcula productos top
      this.calcularActividadReciente(); // Calcula actividad reciente
      this.calcularMesesDisponibles(); // Calcula meses con ventas
    });
    this.ventaService.getVentaStats().subscribe(stats => {
      this.ventaStats = stats;
    });
  }

  private calcularMesesDisponibles() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const monthsWithSales = new Set<string>();

    // Incluir el mes actual siempre
    monthsWithSales.add(this.mesesDelAnio[currentMonth]);

    this.ventas.forEach(venta => {
      const fecha = new Date(venta.fechaVenta);
      if (fecha.getFullYear() === currentYear && fecha.getMonth() <= currentMonth) {
        monthsWithSales.add(this.mesesDelAnio[fecha.getMonth()]);
      }
    });

    this.mesesDisponibles = Array.from(monthsWithSales).sort((a, b) => this.mesesDelAnio.indexOf(a) - this.mesesDelAnio.indexOf(b));
  }

  private calcularTopProductos() {
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    sixDaysAgo.setHours(0, 0, 0, 0); // Inicio del día

    const ventasSemana = this.ventas.filter(venta =>
      new Date(venta.fechaVenta) >= sixDaysAgo && venta.estado !== 'oculta'
    );

    const productCounts: { [key: string]: { cantidad: number, ingresos: number } } = {};

    ventasSemana.forEach(venta => {
      venta.detalles.forEach(det => {
        if (!productCounts[det.productoNombre]) {
          productCounts[det.productoNombre] = { cantidad: 0, ingresos: 0 };
        }
        productCounts[det.productoNombre].cantidad += det.cantidad;
        productCounts[det.productoNombre].ingresos += det.subtotal;
      });
    });

    this.productosCompletos = Object.keys(productCounts).map(nombre => ({
      nombre,
      cantidad: productCounts[nombre].cantidad,
      ingresos: productCounts[nombre].ingresos
    })).sort((a, b) => b.cantidad - a.cantidad);

    this.productosVendidos = this.productosCompletos.slice(0, 10);

    this.maxCantidadVendida = this.productosVendidos.length > 0 ? Math.max(...this.productosVendidos.map(p => p.cantidad)) : 0;
  }

  private calcularActividadReciente() {
    // Filtrar ventas no ocultas, ordenar por fecha descendente
    const ventasOrdenadas = this.ventas
      .filter(venta => venta.estado !== 'oculta')
      .sort((a, b) => new Date(b.fechaVenta).getTime() - new Date(a.fechaVenta).getTime());

    this.actividadCompleta = ventasOrdenadas.map(venta => ({
      texto: `${venta.estado === 'completada' ? 'Venta' : 'Nueva venta'} ${venta.numeroVenta} por S/. ${venta.total.toFixed(2)}`,
      fecha: new Date(venta.fechaVenta)
    }));

    this.actividadReciente = this.actividadCompleta.slice(0, 10);
  }

  // --- 4. LÓGICA DE FILTROS ACTUALIZADA ---
  setFiltroRapido(filtro: string) {
    this.filtroActual = filtro;
    this.aplicarFiltros();
  }

  filtrarPorEstado() {
    this.filtroActual = this.filtroEstado === '' ? 'todos' : this.filtroEstado;
    this.aplicarFiltros();
  }

  buscarVentas() {
    this.aplicarFiltros();
  }

  private aplicarFiltros() {
    let resultado = [...this.ventas];

    // 1. Filtro por Estado (Chips)
    if (this.filtroActual === 'completada') {
      resultado = resultado.filter(v => v.estado === 'completada');
    } else if (this.filtroActual === 'pendiente') {
      resultado = resultado.filter(v => v.estado === 'pendiente');
    } else if (this.filtroActual === 'oculta') {
      resultado = resultado.filter(v => v.estado === 'oculta');
    } else {
      // Si es 'todos', por defecto ocultamos las archivadas/ocultas
      resultado = resultado.filter(v => v.estado !== 'oculta');
    }

    // 2. Filtro por Texto (Buscador)
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      resultado = resultado.filter(venta =>
        venta.numeroVenta.toLowerCase().includes(term) ||
        (venta.clienteNombre && venta.clienteNombre.toLowerCase().includes(term)) ||
        (venta.clienteDni && venta.clienteDni.includes(term))
      );
    }

    this.ventasFiltradas = resultado;
  }

  onMesChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.mesSeleccionado = select.value;
    this.mesActual = select.value;
    this.actualizarGraficoIngresos();
  }

  private actualizarGraficoIngresos() {
    const mesIndex = this.mesesDelAnio.indexOf(this.mesSeleccionado);
    if (mesIndex === -1) return;

    const year = new Date().getFullYear();
    const startOfMonth = new Date(year, mesIndex, 1);
    const endOfMonth = new Date(year, mesIndex + 1, 0);

    const ventasMes = this.ventas.filter(venta => {
      const fecha = new Date(venta.fechaVenta);
      return fecha >= startOfMonth && fecha <= endOfMonth && venta.estado !== 'oculta';
    });

    // Calcular total del mes
    const totalMes = ventasMes.reduce((sum, v) => sum + v.total, 0);
    this.ventaStats.ingresosTotales = totalMes;

    // Agrupar por semanas
    const semanas: number[] = [0, 0, 0, 0, 0]; // Hasta 5 semanas posibles
    ventasMes.forEach(venta => {
      const fecha = new Date(venta.fechaVenta);
      const dia = fecha.getDate();
      const semana = Math.floor((dia - 1) / 7);
      semanas[semana] += venta.total;
    });

    // Tomar las primeras 4 semanas, o menos si no hay
    const semanasData = semanas.slice(0, 4);
    const labels = semanasData.map((_, i) => `Sem ${i + 1}`);

    this.ingresosChartData = {
      labels,
      datasets: [
        {
          data: semanasData,
          borderColor: '#ffffff',
          backgroundColor: 'rgba(255,255,255,0.2)',
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#303F9F',
          fill: 'origin',
          borderWidth: 2
        }
      ]
    };
  }

  // --- HELPERS ---
  getMetodoPagoLabel(metodo: string): string {
    const labels: { [key: string]: string } = { 'efectivo': 'Efectivo', 'tarjeta': 'Tarjeta', 'transferencia': 'Transferencia' };
    return labels[metodo] || metodo;
  }

  getEstadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      'completada': 'Completada',
      'pendiente': 'Pendiente',
      'cancelada': 'Cancelada',
      'devuelta': 'Devuelta',
      'oculta': 'Oculta'
    };
    return labels[estado] || estado;
  }

  // --- NUEVA FUNCIÓN: OCULTAR ---
  ocultarVenta(venta: Venta) {
    if (!venta.id) return;
    this.ventaOcultar = venta;
    this.mostrarModalOcultar = true;
  }

  confirmarOcultar() {
    if (!this.ventaOcultar || !this.ventaOcultar.id) return;
    // Usamos 'as any' por si tu modelo aún no tiene 'oculta' estricto
    const ventaOculta = { ...this.ventaOcultar, estado: 'oculta' as any };

    this.ventaService.updateVenta(this.ventaOcultar.id, ventaOculta).subscribe(updated => {
      if (updated) {
        this.cargarDatos(); // Al recargar, el filtro la ocultará
        this.cerrarModalOcultar();
      }
    });
  }

  cerrarModalOcultar() {
    this.mostrarModalOcultar = false;
    this.ventaOcultar = null;
  }

  // --- MODALES ---
  abrirModalNuevaVenta() {
    this.ventaEditando = null;
    this.resetearFormularioVenta();
    this.mostrarModalVenta = true;
  }

  editarVenta(venta: Venta) {
    this.ventaEditando = venta;
    this.ventaForm = {
      metodoPago: venta.metodoPago,
      observaciones: venta.observaciones || ''
    };
    if (venta.clienteId) {
      this.clienteSeleccionado = {
        id: venta.clienteId,
        nombre: venta.clienteNombre?.split(' ')[0] || '',
        apellido: venta.clienteNombre?.split(' ').slice(1).join(' ') || '',
        dni: venta.clienteDni || '',
        telefono: '', email: ''
      };
    }
    this.detallesVenta = [...venta.detalles];
    this.calcularTotales();
    this.mostrarModalVenta = true;
  }

  cerrarModalVenta() {
    this.mostrarModalVenta = false;
    this.resetearFormularioVenta();
  }

  private resetearFormularioVenta() {
    this.ventaEditando = null;
    this.ventaForm = { metodoPago: 'efectivo', observaciones: '' };
    this.clienteSeleccionado = null;
    this.busquedaCliente = '';
    this.clientesEncontrados = [];
    this.busquedaProducto = '';
    this.productosEncontrados = [];
    this.detallesVenta = [];
    this.totalesVenta = { subtotal: 0, igv: 0, total: 0 };
  }

  buscarClientesModal() {
    if (!this.busquedaCliente.trim()) { this.clientesEncontrados = []; return; }
    this.ventaService.searchClientesVenta(this.busquedaCliente).subscribe(c => this.clientesEncontrados = c.slice(0, 5));
  }

  seleccionarCliente(c: ClienteVenta) {
    this.clienteSeleccionado = c;
    this.busquedaCliente = '';
    this.clientesEncontrados = [];
  }

  quitarCliente() {
    this.clienteSeleccionado = null;
  }

  buscarProductosModal() {
    if (!this.busquedaProducto.trim()) { this.productosEncontrados = []; return; }
    this.ventaService.searchProductos(this.busquedaProducto).subscribe(p => this.productosEncontrados = p.slice(0, 5));
  }

  agregarProducto(p: ProductoVenta) {
    const cantidad = p.cantidadSeleccionada || 1;
    const ex = this.detallesVenta.find(d => d.productoId === p.id);
    if (ex) {
      ex.cantidad += cantidad;
      ex.subtotal = ex.cantidad * ex.precioUnitario;
    } else {
      this.detallesVenta.push({
        productoId: p.id, productoNombre: p.nombre, cantidad: cantidad, precioUnitario: p.precio, subtotal: cantidad * p.precio
      });
    }
    this.busquedaProducto = '';
    this.productosEncontrados = [];
    this.calcularTotales();
  }

  actualizarSubtotal(i: number) {
    const d = this.detallesVenta[i];
    if (d.cantidad <= 0) d.cantidad = 1;
    d.subtotal = d.cantidad * d.precioUnitario;
    this.calcularTotales();
  }

  quitarProducto(i: number) {
    this.detallesVenta.splice(i, 1);
    this.calcularTotales();
  }

  private calcularTotales() {
    this.totalesVenta = this.ventaService.calcularTotales(this.detallesVenta);
  }

  confirmarVenta() {
    if (this.detallesVenta.length === 0) {
      this.dialog.open(ConfirmDialogComponent, {
        data: { message: 'Debe agregar al menos un producto para confirmar la venta.', showConfirm: false },
        panelClass: 'info-dialog'
      });
      return;
    }
    this.dialog.open(ConfirmDialogComponent, {
      data: { message: '¿Quieres confirmar esta venta?' }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.guardarVenta();
      }
    });
  }

  guardarVenta() {
    if (this.detallesVenta.length === 0) { alert('Agregue productos'); return; }

    const data: Venta = {
      clienteId: this.clienteSeleccionado?.id,
      clienteNombre: this.clienteSeleccionado ? `${this.clienteSeleccionado.nombre} ${this.clienteSeleccionado.apellido}` : undefined,
      clienteDni: this.clienteSeleccionado?.dni,
      vendedorId: 1, vendedorNombre: 'Admin',
      subtotal: this.totalesVenta.subtotal, igv: this.totalesVenta.igv, total: this.totalesVenta.total,
      metodoPago: this.ventaForm.metodoPago,
      estado: 'completada',
      observaciones: this.ventaForm.observaciones,
      detalles: this.detallesVenta,
      numeroVenta: '', fechaVenta: new Date()
    };

    if (this.ventaEditando) {
      this.ventaService.updateVenta(this.ventaEditando.id!, data).subscribe(v => {
        if (v) { this.cargarDatos(); this.cerrarModalVenta(); }
      });
    } else {
      this.ventaService.createVenta(data).subscribe(v => {
        this.cargarDatos(); this.cerrarModalVenta();
      });
    }
  }

  verDetalleVenta(v: Venta) { this.ventaDetalle = v; this.mostrarModalDetalle = true; }
  cerrarModalDetalle() { this.mostrarModalDetalle = false; this.ventaDetalle = null; }

  cancelarVenta(id: number) {
    const venta = this.ventas.find(v => v.id === id);
    if (!venta) return;
    this.ventaCancelar = venta;
    this.motivoCancelacion = '';
    this.mostrarModalCancelar = true;
  }
  
  cerrarModalCancelar() {
    this.mostrarModalCancelar = false;
    this.ventaCancelar = null;
    this.motivoCancelacion = '';
  }

  confirmarCancelacion() {
    if (!this.ventaCancelar || !this.motivoCancelacion.trim()) return;
    this.ventaService.cancelarVenta(this.ventaCancelar.id!, this.motivoCancelacion.trim()).subscribe(cancelada => {
      if (cancelada) {
        this.cargarDatos();
        this.cerrarModalCancelar();
      }
    });
  }
}