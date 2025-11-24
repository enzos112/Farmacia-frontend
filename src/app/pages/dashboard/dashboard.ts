import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { VentaService } from '../../services/venta.service';
import { Venta, DetalleVenta, VentaStats } from '../../models/venta';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ProductoService } from '../../services/producto.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  
  constructor(private router: Router, private ventaService: VentaService, private productoService: ProductoService) {}
  
  // Datos del reporte del día
  ventasDelDia: number = 0;
  numeroVentasDelDia: number = 0; // cantidad de ventas del día
  totalProductos: number = 16; // Total de productos en el sistema

  // Mes actual
  mesActual: string = 'Enero';
  totalMesActual: number = 0;
  mesesDelAnio: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  // Meses disponibles desde el inicio del sistema (noviembre 2025 en adelante)
  mesesDisponibles: string[] = [];
  mesSeleccionado: string = '';
  mesAbrevSeleccionado: string = '';
  sinDatosEnMes: boolean = false;

  // Ventas diarias por mes (mock hasta tener backend)
  private ventasDiariasPorMes: Record<string, number[]> = {};

  // Inventario
  // Claridad: esta métrica corresponde a productos sin stock
  productosSinStock: number = 27;
  productosConStockMinimo: number = 4665;
  totalProductosIngresados: number = 143;

  // Top productos más vendidos
  topProductos: { nombre: string; ventas: number }[] = [];
  maxVentasTop: number = 0;

  // Stats provenientes del servicio
  ventaStats: VentaStats | null = null;

  // Gráfico inventario (barras + línea)
  // Usamos 'any' para permitir dataset mixto (bar + line) sin conflicto de tipos en plantilla
  inventoryChartData: any = {
    labels: [],
    datasets: [
      {
        type: 'bar',
        label: 'Unidades',
        data: [],
        backgroundColor: 'rgba(22,41,104,0.5)', // Color azul con menor intensidad
        borderRadius: 4,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: '% Porcentaje',
        data: [],
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255,152,0,0.2)',
        tension: 0.35,
        pointBackgroundColor: '#ff9800',
        pointRadius: 4,
        yAxisID: 'yPercent'
      }
    ]
  };

  inventoryChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { 
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 12 }
        }
      },
      tooltip: { 
        enabled: true,
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 12 }
      },
    },
    scales: {
      y: {
        position: 'right',
        title: {
          display: true,
          text: 'Unidades',
          color: '#6c757d',
          font: { size: 11 }
        },
        ticks: { 
          color: '#6c757d',
          font: { size: 11 }
        },
        grid: {
          color: '#f0f0f0'
        },
        beginAtZero: true
      },
      yPercent: {
        position: 'left',
        title: {
          display: true,
          text: '% Porcentaje',
          color: '#ff9800',
          font: { size: 11 }
        },
        ticks: {
          callback: (val: number | string) => val + '%',
          color: '#ff9800',
          font: { size: 11 }
        },
        grid: {
          display: false
        },
        beginAtZero: true,
        max: 50
      },
      x: {
        ticks: { 
          color: '#6c757d',
          font: { size: 11 },
          maxRotation: 45,
          minRotation: 0
        },
        grid: { display: false }
      }
    }
  };

  ngOnInit() {
    this.obtenerMesActual();
    this.inicializarMesesDisponibles();
    this.mesSeleccionado = this.mesActual;
    // Intentar cargar datos reales desde el servicio
    this.cargarDatosDesdeServicio();
    
    // Cargar datos reales de productos
    this.cargarDatosProductos();
  }

  private cargarDatosDesdeServicio() {
    // Obtener estadísticas generales
    this.ventaService.getVentaStats().subscribe({
      next: (stats) => {
        this.ventaStats = stats;
        // Mapear a las propiedades de UI
        this.ventasDelDia = stats.ventasHoyMonto; // monto en soles del día
        this.totalMesActual = stats.ingresosTotales;
        this.numeroVentasDelDia = stats.ventasHoy; // conteo de ventas del día
      },
      error: () => {
        // Fallback a simulación si el servicio falla
        this.cargarDatosMes();
      }
    });

    // Obtener ventas para calcular top productos
    this.ventaService.getVentas().subscribe({
      next: (ventas) => {
        // Filtrar ventas visibles (no 'oculta') y del mes seleccionado
        const mesIndex = this.mesesDelAnio.indexOf(this.mesSeleccionado || this.mesActual);
        const year = new Date().getFullYear();
        const ventasFiltradas = ventas.filter(v => {
          const d = new Date(v.fechaVenta);
          return v.estado !== 'oculta' && d.getFullYear() === year && d.getMonth() === mesIndex;
        });

        const productCounts: { [key: string]: number } = {};
        ventasFiltradas.forEach(v => {
          const detalles = Array.isArray(v.detalles) ? v.detalles : [];
          detalles.forEach(d => {
            const nombre = d.productoNombre ?? '';
            if (!nombre) return;
            productCounts[nombre] = (productCounts[nombre] || 0) + d.cantidad;
          });
        });

        const productos = Object.keys(productCounts).map(nombre => ({ nombre, ventas: productCounts[nombre] }));
        productos.sort((a, b) => b.ventas - a.ventas);
        this.topProductos = productos.slice(0, 5);
        this.maxVentasTop = this.topProductos.length ? Math.max(...this.topProductos.map(p => p.ventas)) : 0;

        // Actualizar gráfico inventario con estos datos
        this.actualizarInventoryChart();
      },
      error: () => {
        // fallback: mantener datos simulados
        this.actualizarTopProductos();
        this.actualizarInventoryChart();
      }
    });
  }

  private cargarDatosProductos() {
    this.productoService.findAll().subscribe({
      next: (productos) => {
        console.log('📊 Productos cargados para dashboard:', productos);
        
        // Total de productos en el sistema
        this.totalProductos = productos.length;
        
        // Productos sin stock (stock = 0)
        this.productosSinStock = productos.filter(p => p.stock === 0).length;
        
        // Productos con stock mínimo o bajo (0 < stock <= stockminimo)
        this.productosConStockMinimo = productos.filter(p => 
          p.stock > 0 && p.stock <= p.stockminimo
        ).length;
        
        // Total de productos "ingresados" = todos los productos
        this.totalProductosIngresados = productos.length;
        
        console.log('📈 Estadísticas calculadas:', {
          total: this.totalProductos,
          sinStock: this.productosSinStock,
          stockMinimo: this.productosConStockMinimo
        });
      },
      error: (error) => {
        console.error('❌ Error al cargar productos para dashboard:', error);
      }
    });
  }

  private actualizarInventoryChart() {
    const labels = this.topProductos.map(p => p.nombre);
    const cantidades = this.topProductos.map(p => p.ventas);
    const total = cantidades.reduce((a, b) => a + b, 0) || 1;
    const porcentajes = cantidades.map(c => +(c / total * 100).toFixed(2));

    this.inventoryChartData = {
      labels,
      datasets: [
        { ...this.inventoryChartData.datasets[0], data: cantidades },
        { ...this.inventoryChartData.datasets[1], data: porcentajes }
      ]
    };
  }

  obtenerMesActual() {
    // Usar la lista centralizada de meses para evitar duplicación
    const fecha = new Date();
    this.mesActual = this.mesesDelAnio[fecha.getMonth()];
  }

  inicializarMesesDisponibles() {
    // Mes de inicio del sistema: Noviembre 2025 (índice 10)
    const mesInicioSistema = 10; // Noviembre (0=Enero, 10=Noviembre)
    const fechaActual = new Date();
    const mesActualIndex = fechaActual.getMonth();
    
    // Si estamos en el mismo año del inicio
    // Mostrar solo desde noviembre hasta el mes actual
    this.mesesDisponibles = [];
    for (let i = mesInicioSistema; i <= mesActualIndex; i++) {
      this.mesesDisponibles.push(this.mesesDelAnio[i]);
    }
    
    // Si no hay meses disponibles, al menos mostrar el actual
    if (this.mesesDisponibles.length === 0) {
      this.mesesDisponibles = [this.mesActual];
    }
  }

  onMesChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.mesSeleccionado = select.value;
    this.mesActual = select.value;
    
    // Verificar si el mes seleccionado tiene datos
    this.verificarDatosDelMes();
    
    // Recalcular ventas del día y total del mes según selección
    this.cargarDatosMes();
    // Actualizar top productos según el mes seleccionado
    this.actualizarTopProductos();
    // Recargar datos de productos por si cambiaron
    this.cargarDatosProductos();
  }
  
  verificarDatosDelMes() {
    // Aquí verificamos si hay datos reales para el mes
    // Por ahora, como usamos datos simulados, siempre hay datos
    // Cuando conectes con el backend real, verificar si hay ventas
    this.sinDatosEnMes = false;
  }
  
  
  irAProductos() {
      this.router.navigate(['/pages/productos']);
  }

  // Método para simular top productos; cuando haya backend se reemplaza con llamada HTTP
  actualizarTopProductos() {
    const base = this.mesSeleccionado || this.mesActual;
    // Generar valores distintos según el mes para que cambie
    const factor = this.mesesDelAnio.indexOf(base) + 1; // 1..12
    const simulados = [
      { nombre: 'Paracetamol 500mg', ventas: 120 * factor },
      { nombre: 'Ibuprofeno 400mg', ventas: 95 * factor },
      { nombre: 'Vitamina C 1g', ventas: 80 * factor },
      { nombre: 'Omeprazol 20mg', ventas: 70 * factor },
      { nombre: 'Amoxicilina 500mg', ventas: 55 * factor }
    ];
    this.topProductos = simulados;
    this.maxVentasTop = Math.max(...simulados.map(s => s.ventas));
  }

  // Conectar Reporte del día con Mes actual
  private cargarDatosMes() {
    const mes = this.mesSeleccionado || this.mesActual;
    if (!this.ventasDiariasPorMes[mes]) {
      this.ventasDiariasPorMes[mes] = this.generarVentasDiariasParaMes(mes);
    }

    const ventasMes = this.ventasDiariasPorMes[mes];
    // Total del mes = suma de ventas diarias
    this.totalMesActual = ventasMes.reduce((a, b) => a + b, 0);

    // Ventas del día = día actual si el mes seleccionado es el mes actual, de lo contrario usar el primer día del mes
    const hoy = new Date();
    const mesActualIndex = hoy.getMonth();
    const selIndex = this.mesesDelAnio.indexOf(mes);
    const diaIndex = (selIndex === mesActualIndex) ? (hoy.getDate() - 1) : 0;
    this.ventasDelDia = ventasMes[diaIndex] ?? 0;

    // Número de ventas del día (mock): suponer ticket promedio de S/. 10
    this.numeroVentasDelDia = Math.max(1, Math.round(this.ventasDelDia / 10));

    // Actualizar inventario dependiente del mes
    this.actualizarInventarioMes(mes);
    // Actualizar abreviatura para UI
    this.mesAbrevSeleccionado = this.abreviarMes(mes);
  }

  private generarVentasDiariasParaMes(mesNombre: string): number[] {
    const anio = new Date().getFullYear();
    const mesIndex = this.mesesDelAnio.indexOf(mesNombre); // 0..11
    const dias = new Date(anio, mesIndex + 1, 0).getDate();
    // Simulación ajustada: ventas diarias con tope de 600 soles
    const MAX_DIA = 600;
    const MIN_DIA = 200; // piso para evitar valores demasiado bajos
    // Base por mes alrededor de ~420 con leve variación estacional
    const base = 420 + (mesIndex - 5) * 10; // ~370..470 a lo largo del año

    const ventas: number[] = [];
    for (let d = 1; d <= dias; d++) {
      // Oscilación suave por día (picos a mitad de mes)
      const variacion = Math.sin((d / dias) * Math.PI) * 120; // 0..120
      // Ruido pseudoaleatorio determinista por día/mes
      const ruido = ((d * 37 + mesIndex * 13) % 80) - 40; // -40..39
      let valor = base + variacion + ruido;
      // Limitar al rango deseado
      valor = Math.min(MAX_DIA, Math.max(MIN_DIA, valor));
      ventas.push(Math.round(valor * 100) / 100); // 2 decimales
    }
    return ventas;
  }

  // Simulación de métricas de inventario por mes (hasta tener backend)
  // NOTA: Este método ya no se usa porque ahora cargamos datos reales
  private actualizarInventarioMes(mesNombre: string): void {
    // Comentado: ahora usamos cargarDatosProductos() que trae datos reales
    // const cur = this.simularInventarioParaMes(mesNombre);
    // this.totalProductosIngresados = cur.ingresados;
    // this.productosSinStock = cur.sinStock;
    // this.productosConStockMinimo = cur.stockMinimo;
  }

  private abreviarMes(mesNombre: string): string {
    const abrev = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const i = this.mesesDelAnio.indexOf(mesNombre);
    return abrev[Math.max(0, i)];
  }

  private simularInventarioParaMes(mesNombre: string): { ingresados: number; sinStock: number; stockMinimo: number } {
    const idx = this.mesesDelAnio.indexOf(mesNombre); // 0..11
    const ingresadosBase = 120 + idx * 6; // ~120..186
    const jitter = ((idx * 17) % 15) - 7; // -7..7
    const ingresados = ingresadosBase + jitter;
    const sinStock = 5 + (idx % 6);
    const stockMin = 10 + (idx % 8);
    return { ingresados, sinStock, stockMinimo: stockMin };
  }
}
