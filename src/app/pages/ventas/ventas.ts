import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';

import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

import { Venta, DetalleVenta, VentaStats, ProductoVenta, ClienteVenta } from '../../models/venta';
import { VentaService } from '../../services/venta.service';
import { VentaEventService } from '../../services/venta-event.service';
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
    BaseChartDirective
  ],
  templateUrl: './ventas.html',
  styleUrls: ['./ventas.css']
})
export class VentasComponent implements OnInit {

  constructor(
    private ventaService: VentaService, 
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private ventaEventService: VentaEventService
  ) {}

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

  // --- CONFIGURACIÓN DEL GRÁFICO ---
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  
  // --- 1. ACTUALIZAR OPCIONES (Para que el texto se vea gris, no blanco) ---
  public ingresosChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: { 
      line: { 
        tension: 0.4 // <--- ESTO CREA LA CURVA SUAVE
      } 
    }, 
    animation: {
      duration: 1000, 
      easing: 'easeOutQuart'
    },
    plugins: { legend: { display: false } },
    scales: {
      x: { 
        grid: { display: false }, 
        // CAMBIO: Color gris para que se lea sobre fondo blanco
        ticks: { color: '#78909c', font: { size: 12 } } 
      },
      y: { display: false }
    }
  };

  public ingresosChartType: ChartType = 'line';

  // --- 2. ACTUALIZAR DATOS (Para que la línea sea Azul y visible) ---
  public ingresosChartData: ChartData<'line'> = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'],
    datasets: [
      {
        data: [0, 0, 0, 0, 0],
        // CAMBIO: Azul primario para la línea
        borderColor: '#303F9F', 
        // CAMBIO: Azul muy suave para el relleno (area bajo la curva)
        backgroundColor: 'rgba(48, 63, 159, 0.1)', 
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#303F9F',
        pointRadius: 5,       // Puntos un poco más visibles
        pointHoverRadius: 7,
        fill: 'origin',
        borderWidth: 3,
        tension: 0.4          // <--- REFUERZO DE CURVA SUAVE
      }
    ]
  };

  // --- FILTROS ---
  searchTerm: string = '';
  filtroActual: string = 'todos'; 
  filtroEstado: string = '';

  // --- VARIABLES DE FECHA Y MES ---
  mesActual: string = '';
  periodoSeleccionado: string = ''; 
  periodosDisponibles: string[] = []; 
  
  mesesDelAnio: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // --- WIDGETS ---
  productosVendidos: any[] = [];
  maxCantidadVendida: number = 0;
  actividadReciente: any[] = [];
  productosCompletos: any[] = []; // Para el modal de ranking
  actividadCompleta: any[] = []; // Para el modal de actividad

  // --- VARIABLES DE MODALES ---
  mostrarModalVenta: boolean = false;
  ventaEditando: Venta | null = null;
  ventaForm: any = { metodoPago: 'efectivo', condicionPago: 'Contado', observaciones: '' };
  
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
  
  mostrarModalHistorialCompleto: boolean = false;
  mostrarModalActividad: boolean = false; 
  mostrarModalRanking: boolean = false; // Nueva variable para el modal de ranking
  
  mostrarAlertaCarrito = false;

  cerrarAlerta(): void {
    this.mostrarAlertaCarrito = false;
  }

  // Helpers
  getProductosVenta(venta: Venta): string {
    const detalles = venta.detalleVenta || venta.detalles || [];
    if (!detalles.length) return '⚠️ Data ilegible';
    return detalles.map((d: any) => d.productoNombre || d.producto?.nombre || '⚠️ Prod. desconocido').join(', ');
  }

  getTotalCantidad(venta: Venta): number {
    const detalles = venta.detalleVenta || venta.detalles || [];
    
    return detalles.reduce((sum: number, d: any) => {
      // 1. Intentar leer la cantidad directa
      if (d.cantidad && d.cantidad > 0) {
        return sum + d.cantidad;
      }
      
      // 2. INTENTO DE RECUPERACIÓN: Calcular cantidad si falta
      // Si tenemos subtotal y precio, la cantidad es matemática pura.
      const precio = d.precioUnitario || d.precioVenta;
      const subtotal = d.subtotal;
      
      if (precio && subtotal && precio > 0) {
        // Redondeamos por si acaso hay decimales extraños
        return sum + Math.round(subtotal / precio);
      }

      return sum;
    }, 0);
  }

  ngOnInit() {
    this.obtenerMesActual();
    this.filtroEstado = ''; 
    this.filtroActual = 'todos';
    this.cargarDatos();
  }

  obtenerMesActual() {
    const fecha = new Date();
    this.mesActual = this.mesesDelAnio[fecha.getMonth()];
  }

cargarDatos() {
    // 1. Cargar Ventas
    this.ventaService.getVentas().subscribe({
      next: (ventas) => {
        // Ordenar por fecha descendente
        this.ventas = ventas.sort((a, b) => new Date(b.fechaVenta).getTime() - new Date(a.fechaVenta).getTime());
        
        this.aplicarFiltros(); 
        this.calcularActividadReciente(); 
        this.calcularPeriodosDisponibles(); 

        // --- NUEVO: Calcular los Widgets con los datos reales cargados ---
        this.calcularKPIs(); 
      },
      error: (err) => {
        console.error('Error ventas:', err);
        this.mostrarNotificacion('Error al cargar ventas', 'error');
      }
    });

    // --- ELIMINADO: getVentaStats() del backend para evitar que sobrescriba con ceros ---
  }

  // Cálculo local de estadísticas para los Widgets
  private calcularKPIs() {
    // Filtramos solo las ventas válidas (REGISTRADA) para no ensuciar el promedio con anuladas
    const validas = this.ventas.filter(v => v.estado === 'REGISTRADA');
    
    const hoy = new Date();
    // Reseteamos hora para comparar solo fechas
    const fechaHoyStr = hoy.toLocaleDateString(); 

    // 1. Total Histórico (Cantidad total de ventas válidas)
    const totalHistorico = validas.length;

    // 2. Ventas Hoy (Comparando fecha local)
    const ventasHoy = validas.filter(v => {
      const fechaVenta = new Date(v.fechaVenta).toLocaleDateString();
      return fechaVenta === fechaHoyStr;
    }).length;

    // 3. Ventas Mes (Mes y Año actuales)
    const ventasMes = validas.filter(v => {
      const fecha = new Date(v.fechaVenta);
      return fecha.getMonth() === hoy.getMonth() && 
             fecha.getFullYear() === hoy.getFullYear();
    }).length;

    // 4. Ticket Promedio
    // Sumamos (Total + Impuesto) de todas las ventas históricas
    const ingresosTotalesHistoricos = validas.reduce((sum, v) => sum + (v.total + (v.impuesto || 0)), 0);
    
    // Promedio = Total Ingresos / Cantidad Ventas
    const promedio = totalHistorico > 0 ? ingresosTotalesHistoricos / totalHistorico : 0;

    // Actualizamos la variable que usa el HTML
    this.ventaStats = {
      ...this.ventaStats, // Mantener otros valores si existen
      totalVentas: totalHistorico,
      ventasHoy: ventasHoy,
      ventasMes: ventasMes,
      promedioVenta: promedio
      // Nota: 'ingresosTotales' se sigue manejando en 'actualizarGraficoIngresos' 
      // para que coincida con el filtro del gráfico.
    };
  }

  private calcularPeriodosDisponibles() {
    const periodos = new Set<string>();
    const hoy = new Date();
    periodos.add(`${this.mesesDelAnio[hoy.getMonth()]} ${hoy.getFullYear()}`);

    this.ventas.forEach(v => {
      if (v.fechaVenta && v.estado !== 'oculta') {
        const d = new Date(v.fechaVenta);
        if (!isNaN(d.getTime())) {
          const mes = this.mesesDelAnio[d.getMonth()];
          const anio = d.getFullYear();
          periodos.add(`${mes} ${anio}`);
        }
      }
    });

    this.periodosDisponibles = Array.from(periodos).sort((a, b) => {
      const [mesA, anioA] = a.split(' ');
      const [mesB, anioB] = b.split(' ');
      if (anioA !== anioB) return parseInt(anioA) - parseInt(anioB);
      return this.mesesDelAnio.indexOf(mesA) - this.mesesDelAnio.indexOf(mesB);
    });

    if (!this.periodoSeleccionado && this.periodosDisponibles.length > 0) {
      this.periodoSeleccionado = this.periodosDisponibles[this.periodosDisponibles.length - 1];
    }
    
    this.actualizarGraficoIngresos();
  }

  onPeriodoChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.periodoSeleccionado = select.value;
    this.actualizarGraficoIngresos();
  }

  private actualizarGraficoIngresos() {
    if (!this.periodoSeleccionado) return;

    const parts = this.periodoSeleccionado.split(' ');
    const mesNombre = parts[0];
    const anio = parseInt(parts[1]);
    const mesIndex = this.mesesDelAnio.indexOf(mesNombre);

    // Filtrar ventas del mes seleccionado
    const ventasMes = this.ventas.filter(venta => {
      if (!venta.fechaVenta || venta.estado === 'oculta' || venta.estado === 'ANULADA') return false;
      const fecha = new Date(venta.fechaVenta);
      return fecha.getMonth() === mesIndex && fecha.getFullYear() === anio;
    });

    const totalMes = ventasMes.reduce((sum, v) => sum + v.total + (v.impuesto || 0), 0);
    this.ventaStats.ingresosTotales = totalMes;

    const semanasData = [0, 0, 0, 0, 0]; 
    ventasMes.forEach(venta => {
      const fecha = new Date(venta.fechaVenta);
      const dia = fecha.getDate();
      let semanaIndex = Math.floor((dia - 1) / 7);
      if (semanaIndex > 4) semanaIndex = 4;
      semanasData[semanaIndex] += (venta.total + (venta.impuesto || 0));
    });

    this.ingresosChartData.datasets[0].data = semanasData;
    if (this.chart) {
      this.chart.update();
    }

    // Actualizamos el widget de Top Productos con las ventas de ESTE mes
    this.calcularTopProductos(ventasMes);
  }

  // REEMPLAZA TU FUNCIÓN calcularTopProductos POR ESTA:
  private calcularTopProductos(ventasDelMes: Venta[]) {
    const productCounts: { [key: string]: { cantidad: number, ingresos: number } } = {};

    ventasDelMes.forEach(venta => {
      const detalles = Array.isArray(venta.detalles) ? venta.detalles : (Array.isArray(venta.detalleVenta) ? venta.detalleVenta : []);
      detalles.forEach((det: DetalleVenta) => {
        const nombre = det.productoNombre ?? 'Desconocido';
        if (!productCounts[nombre]) {
          productCounts[nombre] = { cantidad: 0, ingresos: 0 };
        }
        productCounts[nombre].cantidad += det.cantidad;
        productCounts[nombre].ingresos += det.subtotal;
      });
    });

    // Lista completa para el Modal
    this.productosCompletos = Object.keys(productCounts).map(nombre => ({
      nombre,
      cantidad: productCounts[nombre].cantidad,
      ingresos: productCounts[nombre].ingresos
    })).sort((a, b) => b.cantidad - a.cantidad);

    // Lista cortada para el Widget (Solo 4)
    this.productosVendidos = this.productosCompletos.slice(0, 4);
    
    // Evitar división por cero
    this.maxCantidadVendida = this.productosVendidos.length > 0 ? Math.max(...this.productosVendidos.map(p => p.cantidad)) : 1;
  }

  private calcularActividadReciente() {
    const ventasOrdenadas = this.ventas
      .filter(venta => venta.estado !== 'oculta' && venta.fechaVenta)
      .sort((a, b) => new Date(b.fechaVenta).getTime() - new Date(a.fechaVenta).getTime());

    this.actividadCompleta = ventasOrdenadas.map(venta => {
      const totalReal = venta.total + (venta.impuesto || 0);
      let clienteDisplay = 'Cliente Ocasional';
      if (venta.cliente && venta.cliente.nombre) {
         const nombre = venta.cliente.nombre.split(' ')[0];
         const apellido = venta.cliente.apellido ? venta.cliente.apellido.split(' ')[0] : '';
         clienteDisplay = `${nombre} ${apellido}`;
      } else if (venta.clienteNombre) {
         clienteDisplay = venta.clienteNombre;
      }

      return {
        comprobante: venta.numComprobante || `Ticket #${venta.idVenta || '?'}`,
        cliente: clienteDisplay,
        monto: totalReal,
        fecha: new Date(venta.fechaVenta),
        estado: venta.estado,
        esAnulada: venta.estado === 'ANULADA'
      };
    });

    this.actividadReciente = this.actividadCompleta.slice(0, 4);
  }

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

  public aplicarFiltros() {
    let resultado = [...this.ventas];

    if (this.filtroActual === 'todos') {
       resultado = resultado.filter(v => v.estado !== 'oculta');
    } else {
       resultado = resultado.filter(v => v.estado === this.filtroActual);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      resultado = resultado.filter(venta =>
        (venta.numComprobante && venta.numComprobante.toLowerCase().includes(term)) ||
        (venta.cliente?.nombre && venta.cliente.nombre.toLowerCase().includes(term)) ||
        (venta.cliente?.apellido && venta.cliente.apellido.toLowerCase().includes(term)) ||
        (venta.cliente?.dni && venta.cliente.dni.includes(term))
      );
    }
    
    if (!this.mostrarModalHistorialCompleto) {
        this.ventasFiltradas = resultado.slice(0, 4);
    } else {
        this.ventasFiltradas = resultado; 
    }
  }

  getMetodoPagoLabel(metodo: string): string {
    const labels: { [key: string]: string } = { 'efectivo': 'Efectivo', 'tarjeta': 'Tarjeta', 'transferencia': 'Transferencia' };
    return labels[metodo] || metodo;
  }

  getEstadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      'REGISTRADA': 'Registrada', 'ANULADA': 'Anulada', 'completada': 'Registrada',
      'pendiente': 'Pendiente', 'cancelada': 'Cancelada', 'oculta': 'Oculta'
    };
    return labels[estado] || estado;
  }

  ocultarVenta(venta: Venta) {
    const id = venta.idVenta || venta.id;
    if (!id) return;
    this.ventaOcultar = venta;
    this.mostrarModalOcultar = true;
  }

  confirmarOcultar() {
    const id = this.ventaOcultar?.idVenta || this.ventaOcultar?.id;
    if (!this.ventaOcultar || !id) return;

    this.ventaService.anularVenta(id).subscribe({
      next: () => {
        this.mostrarNotificacion('Venta anulada correctamente', 'success');
        this.cargarDatos(); 
        this.cerrarModalOcultar();
      },
      error: (err) => {
        console.error(err);
        this.mostrarNotificacion('Error al anular la venta', 'error');
      }
    });
  }

  cerrarModalOcultar() {
    this.mostrarModalOcultar = false;
    this.ventaOcultar = null;
  }

  abrirModalNuevaVenta() {
    this.ventaEditando = null;
    this.resetearFormularioVenta();
    this.mostrarModalVenta = true;
  }

  abrirModalHistorialCompleto(): void {
      this.mostrarModalHistorialCompleto = true;
      this.aplicarFiltros();
  }

  cerrarModalHistorialCompleto(): void {
      this.mostrarModalHistorialCompleto = false;
      this.cargarDatos(); 
  }

  abrirModalActividad() {
    this.mostrarModalActividad = true;
  }

  cerrarModalActividad() {
    this.mostrarModalActividad = false;
  }

  // Métodos para el Modal de Ranking
  abrirModalRanking() {
    this.mostrarModalRanking = true;
  }

  cerrarModalRanking() {
    this.mostrarModalRanking = false;
  }

  editarVenta(venta: Venta) {
    this.ventaEditando = venta;
    this.ventaForm = {
      metodoPago: venta.metodoPago || 'efectivo',
      condicionPago: venta.condicionPago || 'Contado',
      observaciones: venta.observaciones || ''
    };
    
    if (venta.cliente) {
       this.clienteSeleccionado = {
         id: venta.cliente.idCliente || 0,
         nombre: venta.cliente.nombre,
         apellido: venta.cliente.apellido,
         dni: venta.cliente.dni,
         email: venta.cliente.email
       };
    } else if (venta.clienteId) {
       this.clienteSeleccionado = {
         id: venta.clienteId,
         nombre: venta.clienteNombre || '',
         apellido: '',
         dni: venta.clienteDni || '',
         email: ''
       };
    }

    const detalles = venta.detalleVenta || venta.detalles || [];
    this.detallesVenta = detalles.map((d: any) => ({
        productoId: d.producto?.idProducto || d.productoId,
        productoNombre: d.producto?.nombre || d.productoNombre,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario || d.precioVenta,
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
    this.ventaForm = { metodoPago: 'efectivo', condicionPago: 'Contado', observaciones: '' };
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
    const ex = this.detallesVenta.find(d => d.productoId === p.id);
    if (ex) {
      ex.cantidad += 1;
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
      this.mostrarNotificacion('Debe agregar al menos un producto', 'error');
      return;
    }
    if (!this.ventaForm.condicionPago) {
      this.mostrarNotificacion('La condición de pago es obligatoria', 'error');
      return;
    }
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { 
        title: 'Confirmar Venta', // Título correcto
        message: `¿Desea procesar la venta por un total de S/. ${this.totalesVenta.total.toFixed(2)}?`,
        confirmText: 'Procesar Venta', // Texto del botón
        confirmColor: 'primary' // Color azul (positivo)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.guardarVenta();
      }
    });
  }

  guardarVenta() {
    if (this.detallesVenta.length === 0) {
      this.mostrarAlertaCarrito = true;
      return;
    }

    const ventaDTO = {
      idCliente: this.clienteSeleccionado?.id ? this.clienteSeleccionado.id : 1,
      items: this.detallesVenta.map(d => ({
        idProducto: d.productoId ?? 0,
        cantidad: d.cantidad
      }))
    };

    console.log('🚀 Enviando venta:', ventaDTO);

    this.ventaService.createVenta(ventaDTO).subscribe({
      next: (resp) => {
        console.log('✅ Venta exitosa:', resp);
        this.mostrarNotificacion('Venta registrada correctamente', 'success');
        this.cargarDatos(); 
        this.cerrarModalVenta();
        this.ventaEventService.notificarVentaRealizada(); // Notificar a otros componentes
      },
      error: (err) => {
        console.error('❌ Error al guardar:', err);
        const mensaje = err.error?.message || 'Error al procesar la venta. Verifique stock o conexión.';
        this.mostrarNotificacion(mensaje, 'error');
      }
    });
  }

  // Reemplaza tu función verDetalleVenta actual por esta:
  verDetalleVenta(v: Venta) {
    // 1. Hacemos una copia de la venta para no afectar la lista original
    this.ventaDetalle = { ...v };

    // 2. PARCHE: Si no hay comprobante, generamos uno visual con el ID
    if (!this.ventaDetalle.numComprobante) {
      const id = this.ventaDetalle.idVenta || this.ventaDetalle.id || '?';
      this.ventaDetalle.numComprobante = `Ticket #${id}`;
    }

    // 3. PARCHE: Si no hay condición de pago, asumimos "Contado"
    if (!this.ventaDetalle.condicionPago) {
      this.ventaDetalle.condicionPago = 'Contado';
    }

    // 4. CORRECCIÓN TABLA: Normalizamos los detalles
    // El backend a veces envía 'detalleVenta' y otras 'detalles'. Unificamos.
    const detallesOriginales = this.ventaDetalle.detalleVenta || this.ventaDetalle.detalles || [];

    // Recorremos cada item para asegurar que tenga nombre y precio
    this.ventaDetalle.detalleVenta = detallesOriginales.map((d: any) => ({
      ...d,
      // Buscamos el nombre en todas las ubicaciones posibles
      productoNombre: d.productoNombre || d.producto?.nombre || 'Producto desconocido',
      // Buscamos el precio (a veces llega como precioVenta o precioUnitario)
      precioUnitario: d.precioUnitario ?? d.precioVenta ?? 0,
      // Aseguramos números
      cantidad: d.cantidad ?? 0,
      subtotal: d.subtotal ?? 0
    }));

    // 5. Abrimos el modal
    this.mostrarModalDetalle = true;
  }
  
  cerrarModalDetalle() { 
    this.mostrarModalDetalle = false; 
    this.ventaDetalle = null; 
  }

  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error') {
    this.snackBar.open(mensaje, 'CERRAR', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: tipo === 'success' ? ['alerta-success'] : ['alerta-error']
    });
  }
}