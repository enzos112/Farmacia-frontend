import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';

// Importaciones para Gráficos
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

// Importaciones de tus Modelos y Servicios
import { Cliente, ClienteStats } from '../../models/cliente';
import { ClienteService } from '../../services/cliente';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatIconModule, 
    BaseChartDirective
  ],
  templateUrl: './clientes.html',
  styleUrls: ['./clientes.css']
})
export class ClientesComponent implements OnInit {

  constructor(
    private clienteService: ClienteService,
    private dialog: MatDialog 
  ) {}

  // --- VARIABLES DE DATOS ---
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  
  clienteStats: ClienteStats = {
    totalClientes: 0,
    clientesNuevos: 0,
    clientesActivos: 0,
    ventasTotales: 0
  };

  topClientes: Cliente[] = [];
  maxComprasTop: number = 0;

  // --- VARIABLES DE GRÁFICOS ---
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  // Gráfico 1: Estado (Dona)
  public estadoChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 10 } }
    }
  };
  public estadoChartType: ChartType = 'doughnut';
  public estadoChartData: ChartData<'doughnut'> = {
    labels: ['Activos', 'Inactivos'],
    datasets: [{ 
      data: [0, 0], 
      backgroundColor: ['#4CAF50', '#EF5350'], 
      borderWidth: 0 
    }]
  };

  // Gráfico 2: Segmentación (Barras Horizontales)
  public segmentoChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: { 
      x: { grid: { display: false } }, 
      y: { grid: { display: false } } 
    }
  };
  public segmentoChartType: ChartType = 'bar';
  public segmentoChartData: ChartData<'bar'> = {
    labels: ['VIP (> S/500)', 'Regular', 'Inicial (< S/100)'],
    datasets: [{ 
      data: [0, 0, 0], 
      backgroundColor: ['#303F9F', '#5C6BC0', '#9FA8DA'],
      borderRadius: 4,
      barThickness: 20
    }]
  };

  // --- VARIABLES DE INTERFAZ ---
  searchTerm: string = '';
  filtroActual: string = 'todos'; 
  
  // Modal
  mostrarModal: boolean = false;
  clienteEditando: Cliente | null = null;
  clienteForm: any = {
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: '',
    direccion: ''
  };

  // Actividad Reciente
  actividadReciente: any[] = [
    { texto: 'María González realizó una compra de S/. 45.50', fecha: new Date('2024-11-10T14:30:00') },
    { texto: 'Nuevo cliente registrado: Carlos Rodríguez', fecha: new Date('2024-11-10T12:15:00') },
    { texto: 'Ana López actualizó su información', fecha: new Date('2024-11-10T10:45:00') },
    { texto: 'Luis Martínez realizó una compra de S/. 78.20', fecha: new Date('2024-11-09T16:20:00') },
    { texto: 'Patricia Vásquez se registró', fecha: new Date('2024-11-09T11:30:00') }
  ];

  // --- CICLO DE VIDA ---
  ngOnInit() {
    this.cargarDatos();
  }

  // --- LÓGICA DE CARGA DE DATOS ---
  cargarDatos() {
    this.clienteService.getClientes().subscribe(clientes => {
      this.clientes = clientes;
      this.aplicarFiltros();
      this.actualizarGraficos();
    });

    this.clienteService.getClienteStats().subscribe(stats => {
      this.clienteStats = stats;
    });

    this.clienteService.getTopClientes(5).subscribe(topClientes => {
      this.topClientes = topClientes;
      this.maxComprasTop = Math.max(...topClientes.map(c => c.totalCompras || 0));
      if (this.maxComprasTop === 0) this.maxComprasTop = 1; 
    });
  }

  // --- LÓGICA DE GRÁFICOS ---
  actualizarGraficos() {
    if (!this.clientes) return;

    const activos = this.clientes.filter(c => c.estado === 'activo').length;
    const inactivos = this.clientes.filter(c => c.estado !== 'activo').length;
    
    this.estadoChartData = {
      ...this.estadoChartData,
      datasets: [{ ...this.estadoChartData.datasets[0], data: [activos, inactivos] }]
    };

    const vip = this.clientes.filter(c => (c.totalCompras || 0) > 500).length;
    const regular = this.clientes.filter(c => (c.totalCompras || 0) >= 100 && (c.totalCompras || 0) <= 500).length;
    const inicial = this.clientes.filter(c => (c.totalCompras || 0) < 100).length;

    this.segmentoChartData = {
      ...this.segmentoChartData,
      datasets: [{ ...this.segmentoChartData.datasets[0], data: [vip, regular, inicial] }]
    };

    if (this.chart) {
      this.chart.update();
    }
  }

  // --- LÓGICA DE FILTROS Y BÚSQUEDA ---
  setFiltroRapido(filtro: string) {
    this.filtroActual = filtro;
    this.aplicarFiltros();
  }

  buscarClientes() {
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    let resultado = [...this.clientes];

    if (this.filtroActual === 'activos') {
      resultado = resultado.filter(c => c.estado === 'activo');
    } else if (this.filtroActual === 'inactivos') {
      resultado = resultado.filter(c => c.estado !== 'activo');
    } else if (this.filtroActual === 'vip') {
      resultado = resultado.filter(c => (c.totalCompras || 0) > 500);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      resultado = resultado.filter(c => 
        c.nombre.toLowerCase().includes(term) ||
        c.apellido.toLowerCase().includes(term) ||
        c.dni.includes(term) ||
        (c.email && c.email.toLowerCase().includes(term))
      );
    }

    this.clientesFiltrados = resultado;
  }

  // --- LÓGICA DEL MODAL (CRUD) ---
  abrirModalNuevoCliente() {
    this.clienteEditando = null;
    this.clienteForm = { nombre: '', apellido: '', dni: '', telefono: '', email: '', direccion: '' };
    this.mostrarModal = true;
  }

  editarCliente(cliente: Cliente) {
    this.clienteEditando = cliente;
    this.clienteForm = {
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      dni: cliente.dni,
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || ''
    };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.clienteEditando = null;
    this.clienteForm = { nombre: '', apellido: '', dni: '', telefono: '', email: '', direccion: '' };
  }

  guardarCliente() {
    if (!this.validarFormulario()) return;

    const clienteData: Cliente = {
      nombre: this.clienteForm.nombre.trim(),
      apellido: this.clienteForm.apellido.trim(),
      dni: this.clienteForm.dni.trim(),
      telefono: this.clienteForm.telefono.trim() || undefined,
      email: this.clienteForm.email.trim() || undefined,
      direccion: this.clienteForm.direccion.trim() || undefined,
      estado: this.clienteEditando ? this.clienteEditando.estado : 'activo'
    };

    if (this.clienteEditando) {
      this.clienteService.updateCliente(this.clienteEditando.id!, clienteData).subscribe(updated => {
        if (updated) {
          this.cargarDatos();
          this.cerrarModal();
          this.agregarActividad(`Cliente actualizado: ${updated.nombre} ${updated.apellido}`);
        }
      });
    } else {
      this.clienteService.createCliente(clienteData).subscribe(created => {
        if (created) {
          this.cargarDatos();
          this.cerrarModal();
          this.agregarActividad(`Nuevo cliente: ${created.nombre} ${created.apellido}`);
        }
      });
    }
  }

  // Función inteligente para Activar/Desactivar
  cambiarEstado(cliente: Cliente) {
    const nuevoEstado = cliente.estado === 'activo' ? 'inactivo' : 'activo';
    const accion = cliente.estado === 'activo' ? 'desactivar' : 'activar';
    const titulo = cliente.estado === 'activo' ? 'Confirmar Desactivación' : 'Confirmar Activación';

    // Abrimos el diálogo reutilizable
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: titulo,
        message: `¿Está seguro que desea ${accion} al cliente ${cliente.nombre} ${cliente.apellido}?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Creamos el objeto con el nuevo estado
        // Usamos 'as const' para que TypeScript no se queje del tipo
        const clienteActualizado = { ...cliente, estado: nuevoEstado as 'activo' | 'inactivo' };
        
        this.clienteService.updateCliente(cliente.id!, clienteActualizado).subscribe(updated => {
          if (updated) {
            this.cargarDatos();
            // Registramos la actividad con la acción correcta
            this.agregarActividad(`Cliente ${accion === 'activar' ? 'activado' : 'desactivado'}: ${cliente.nombre} ${cliente.apellido}`);
          }
        });
      }
    });
  }

  // --- VALIDACIONES ---
  private validarFormulario(): boolean {
    if (!this.clienteForm.nombre.trim()) { alert('Nombre requerido'); return false; }
    if (!this.clienteForm.apellido.trim()) { alert('Apellido requerido'); return false; }
    if (!this.clienteForm.dni.trim()) { alert('DNI requerido'); return false; }
    if (this.clienteForm.dni.trim().length !== 8) { alert('DNI debe tener 8 dígitos'); return false; }

    const duplicado = this.clientes.find(c => 
      c.dni === this.clienteForm.dni.trim() && c.id !== this.clienteEditando?.id
    );
    if (duplicado) { alert('Ya existe un cliente con ese DNI'); return false; }

    if (this.clienteForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.clienteForm.email.trim())) {
        alert('Email inválido'); return false;
      }
    }
    return true;
  }

  private agregarActividad(texto: string) {
    this.actividadReciente.unshift({ texto, fecha: new Date() });
    if (this.actividadReciente.length > 5) {
      this.actividadReciente = this.actividadReciente.slice(0, 5);
    }
  }
}