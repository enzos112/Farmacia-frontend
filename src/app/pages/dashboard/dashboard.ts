import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  
  constructor(private router: Router) {}
  
  // Datos del reporte del día
  ventasDelDia: number = 0;
  numeroVentasDelDia: number = 0; // cantidad de ventas del día
  nuevosProductos: number = 0;

  // Mes actual
  mesActual: string = 'Enero';
  totalMesActual: number = 0;
  mesesDelAnio: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  mesSeleccionado: string = '';
  mesAbrevSeleccionado: string = '';

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

  ngOnInit() {
    this.obtenerMesActual();
    this.mesSeleccionado = this.mesActual;
    // Inicializar datos del mes actual (reporte del día y total del mes)
    this.cargarDatosMes();
    // Inicializar top productos
    this.actualizarTopProductos();
  }

  obtenerMesActual() {
  // Usar la lista centralizada de meses para evitar duplicación
  const fecha = new Date();
  this.mesActual = this.mesesDelAnio[fecha.getMonth()];
  }

  onMesChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.mesSeleccionado = select.value;
    this.mesActual = select.value;
    // Recalcular ventas del día y total del mes según selección
    this.cargarDatosMes();
    // Actualizar top productos según el mes seleccionado
    this.actualizarTopProductos();
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
  private actualizarInventarioMes(mesNombre: string): void {
    const cur = this.simularInventarioParaMes(mesNombre);
  this.totalProductosIngresados = cur.ingresados;
  this.productosSinStock = cur.sinStock;
  this.productosConStockMinimo = cur.stockMinimo;
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
