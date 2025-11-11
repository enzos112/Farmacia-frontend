import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Venta, DetalleVenta, VentaStats, ProductoVenta, ClienteVenta } from '../../models/venta';
import { VentaService } from '../../services/venta';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatDialogModule, MatButtonModule, MatInputModule, MatFormFieldModule],
  templateUrl: './ventas.html',
  styleUrls: ['./ventas.css']
})
export class VentasComponent implements OnInit {

  constructor(private ventaService: VentaService, private dialog: MatDialog) {}

  // Datos principales
  ventas: Venta[] = [];
  ventasFiltradas: Venta[] = [];
  ventaStats: VentaStats = {
    totalVentas: 0,
    ventasHoy: 0,
    ventasMes: 0,
    promedioVenta: 0,
    ventasPendientes: 0,
    ingresosTotales: 0
  };

  // Filtros y búsqueda
  searchTerm: string = '';
  filtroEstado: string = '';

  // Mes actual
  mesActual: string = 'Noviembre';
  mesSeleccionado: string = '';
  mesesDelAnio: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Productos más vendidos
  productosVendidos: any[] = [
    { nombre: 'Paracetamol 500mg', cantidad: 45, ingresos: 675.00 },
    { nombre: 'Ibuprofeno 400mg', cantidad: 38, ingresos: 760.00 },
    { nombre: 'Vitamina C 1g', cantidad: 32, ingresos: 576.00 },
    { nombre: 'Omeprazol 20mg', cantidad: 28, ingresos: 728.00 },
    { nombre: 'Amoxicilina 500mg', cantidad: 25, ingresos: 500.00 }
  ];
  maxCantidadVendida: number = 45;

  // Actividad reciente
  actividadReciente: any[] = [
    {
      texto: 'Nueva venta V-2024-004 por S/. 30.00',
      fecha: new Date('2024-11-10T16:20:00')
    },
    {
      texto: 'Venta V-2024-003 completada por S/. 40.00',
      fecha: new Date('2024-11-10T14:45:00')
    },
    {
      texto: 'Nueva venta V-2024-002 por S/. 80.00',
      fecha: new Date('2024-11-10T11:15:00')
    },
    {
      texto: 'Venta V-2024-001 completada por S/. 50.00',
      fecha: new Date('2024-11-10T09:30:00')
    }
  ];

  // Modal nueva venta
  mostrarModalVenta: boolean = false;
  ventaEditando: Venta | null = null;
  ventaForm: any = {
    metodoPago: 'efectivo',
    observaciones: ''
  };

  // Cliente y productos para venta
  busquedaCliente: string = '';
  clientesEncontrados: ClienteVenta[] = [];
  clienteSeleccionado: ClienteVenta | null = null;

  busquedaProducto: string = '';
  productosEncontrados: ProductoVenta[] = [];
  detallesVenta: DetalleVenta[] = [];

  totalesVenta = {
    subtotal: 0,
    igv: 0,
    total: 0
  };

  // Modal detalle venta
  mostrarModalDetalle: boolean = false;
  ventaDetalle: Venta | null = null;

  // Modal cancelar venta
  mostrarModalCancelar: boolean = false;
  ventaCancelar: Venta | null = null;
  motivoCancelacion: string = '';

  ngOnInit() {
    this.obtenerMesActual();
    this.mesSeleccionado = this.mesActual;
    this.cargarDatos();
  }

  obtenerMesActual() {
    const fecha = new Date();
    this.mesActual = this.mesesDelAnio[fecha.getMonth()];
  }

  cargarDatos() {
    // Cargar ventas
    this.ventaService.getVentas().subscribe(ventas => {
      this.ventas = ventas;
      this.ventasFiltradas = [...ventas];
    });

    // Cargar estadísticas
    this.ventaService.getVentaStats().subscribe(stats => {
      this.ventaStats = stats;
    });
  }

  buscarVentas() {
    if (!this.searchTerm.trim()) {
      this.aplicarFiltros();
      return;
    }

    this.ventaService.searchVentas(this.searchTerm).subscribe(ventasFiltradas => {
      this.ventasFiltradas = this.filtroEstado 
        ? ventasFiltradas.filter(v => v.estado === this.filtroEstado)
        : ventasFiltradas;
    });
  }

  filtrarPorEstado() {
    this.aplicarFiltros();
  }

  private aplicarFiltros() {
    let ventasFiltradas = [...this.ventas];

    // Aplicar filtro de búsqueda
    if (this.searchTerm.trim()) {
      ventasFiltradas = ventasFiltradas.filter(venta =>
        venta.numeroVenta.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (venta.clienteNombre && venta.clienteNombre.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (venta.clienteDni && venta.clienteDni.includes(this.searchTerm)) ||
        venta.estado.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Aplicar filtro de estado
    if (this.filtroEstado) {
      ventasFiltradas = ventasFiltradas.filter(v => v.estado === this.filtroEstado);
    }

    this.ventasFiltradas = ventasFiltradas;
  }

  onMesChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.mesSeleccionado = select.value;
    this.mesActual = select.value;
    // Aquí se podría recargar las estadísticas del mes seleccionado
  }

  // Métodos para labels
  getMetodoPagoLabel(metodo: string): string {
    const labels: { [key: string]: string } = {
      'efectivo': 'Efectivo',
      'tarjeta': 'Tarjeta',
      'transferencia': 'Transferencia'
    };
    return labels[metodo] || metodo;
  }

  getEstadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      'completada': 'Completada',
      'pendiente': 'Pendiente',
      'cancelada': 'Cancelada',
      'devuelta': 'Devuelta'
    };
    return labels[estado] || estado;
  }

  // Modal nueva venta
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
    
    // Cargar cliente si existe
    if (venta.clienteId) {
      this.clienteSeleccionado = {
        id: venta.clienteId,
        nombre: venta.clienteNombre?.split(' ')[0] || '',
        apellido: venta.clienteNombre?.split(' ').slice(1).join(' ') || '',
        dni: venta.clienteDni || '',
        telefono: '',
        email: ''
      };
    }

    // Cargar detalles
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
    this.ventaForm = {
      metodoPago: 'efectivo',
      observaciones: ''
    };
    this.clienteSeleccionado = null;
    this.busquedaCliente = '';
    this.clientesEncontrados = [];
    this.busquedaProducto = '';
    this.productosEncontrados = [];
    this.detallesVenta = [];
    this.totalesVenta = { subtotal: 0, igv: 0, total: 0 };
  }

  // Búsqueda de clientes
  buscarClientesModal() {
    if (!this.busquedaCliente.trim()) {
      this.clientesEncontrados = [];
      return;
    }

    this.ventaService.searchClientesVenta(this.busquedaCliente).subscribe(clientes => {
      this.clientesEncontrados = clientes.slice(0, 5); // Limitar a 5 resultados
    });
  }

  seleccionarCliente(cliente: ClienteVenta) {
    this.clienteSeleccionado = cliente;
    this.busquedaCliente = '';
    this.clientesEncontrados = [];
  }

  quitarCliente() {
    this.clienteSeleccionado = null;
  }

  // Búsqueda de productos
  buscarProductosModal() {
    if (!this.busquedaProducto.trim()) {
      this.productosEncontrados = [];
      return;
    }

    this.ventaService.searchProductos(this.busquedaProducto).subscribe(productos => {
      this.productosEncontrados = productos.slice(0, 5); // Limitar a 5 resultados
    });
  }

  agregarProducto(producto: ProductoVenta) {
    // Verificar si el producto ya está en la lista
    const existeProducto = this.detallesVenta.find(d => d.productoId === producto.id);
    
    if (existeProducto) {
      existeProducto.cantidad++;
      existeProducto.subtotal = existeProducto.cantidad * existeProducto.precioUnitario;
    } else {
      const nuevoDetalle: DetalleVenta = {
        productoId: producto.id,
        productoNombre: producto.nombre,
        cantidad: 1,
        precioUnitario: producto.precio,
        subtotal: producto.precio
      };
      this.detallesVenta.push(nuevoDetalle);
    }

    this.busquedaProducto = '';
    this.productosEncontrados = [];
    this.calcularTotales();
  }

  actualizarSubtotal(index: number) {
    const detalle = this.detallesVenta[index];
    if (detalle.cantidad <= 0) {
      detalle.cantidad = 1;
    }
    detalle.subtotal = detalle.cantidad * detalle.precioUnitario;
    this.calcularTotales();
  }

  quitarProducto(index: number) {
    this.detallesVenta.splice(index, 1);
    this.calcularTotales();
  }

  private calcularTotales() {
    const totales = this.ventaService.calcularTotales(this.detallesVenta);
    this.totalesVenta = totales;
  }

  guardarVenta() {
    if (this.detallesVenta.length === 0) {
      alert('Debe agregar al menos un producto');
      return;
    }

    const ventaData: Venta = {
      clienteId: this.clienteSeleccionado?.id,
      clienteNombre: this.clienteSeleccionado 
        ? `${this.clienteSeleccionado.nombre} ${this.clienteSeleccionado.apellido}`
        : undefined,
      clienteDni: this.clienteSeleccionado?.dni,
      vendedorId: 1,
      vendedorNombre: 'Admin Usuario',
      subtotal: this.totalesVenta.subtotal,
      igv: this.totalesVenta.igv,
      total: this.totalesVenta.total,
      metodoPago: this.ventaForm.metodoPago,
      estado: 'completada',
      observaciones: this.ventaForm.observaciones || undefined,
      detalles: this.detallesVenta,
      numeroVenta: '', // Se genera automáticamente
      fechaVenta: new Date()
    };

    if (this.ventaEditando) {
      // Actualizar venta existente
      this.ventaService.updateVenta(this.ventaEditando.id!, ventaData).subscribe(ventaActualizada => {
        if (ventaActualizada) {
          this.cargarDatos();
          this.cerrarModalVenta();
          this.agregarActividad(`Venta ${ventaActualizada.numeroVenta} actualizada`);
        }
      });
    } else {
      // Crear nueva venta
      this.ventaService.createVenta(ventaData).subscribe(nuevaVenta => {
        this.cargarDatos();
        this.cerrarModalVenta();
        this.agregarActividad(`Nueva venta ${nuevaVenta.numeroVenta} por S/. ${nuevaVenta.total.toFixed(2)}`);
      });
    }
  }

  // Modal detalle venta
  verDetalleVenta(venta: Venta) {
    this.ventaDetalle = venta;
    this.mostrarModalDetalle = true;
  }

  cerrarModalDetalle() {
    this.mostrarModalDetalle = false;
    this.ventaDetalle = null;
  }

  // Modal cancelar venta
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
        this.agregarActividad(`Venta ${this.ventaCancelar!.numeroVenta} cancelada`);
      }
    });
  }

  private agregarActividad(texto: string) {
    this.actividadReciente.unshift({
      texto,
      fecha: new Date()
    });

    // Mantener solo las últimas 5 actividades
    if (this.actividadReciente.length > 5) {
      this.actividadReciente = this.actividadReciente.slice(0, 5);
    }
  }
}