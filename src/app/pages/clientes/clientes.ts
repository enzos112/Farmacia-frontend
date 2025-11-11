import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Cliente, ClienteStats } from '../../models/cliente';
import { ClienteService } from '../../services/cliente';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './clientes.html',
  styleUrls: ['./clientes.css']
})
export class ClientesComponent implements OnInit {

  constructor(private clienteService: ClienteService) {}

  // Datos principales
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  clienteStats: ClienteStats = {
    totalClientes: 0,
    clientesNuevos: 0,
    clientesActivos: 0,
    ventasTotales: 0
  };

  // Top clientes
  topClientes: Cliente[] = [];
  maxComprasTop: number = 0;

  // Búsqueda
  searchTerm: string = '';

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

  // Actividad reciente
  actividadReciente: any[] = [
    {
      texto: 'María González realizó una compra de S/. 45.50',
      fecha: new Date('2024-11-10T14:30:00')
    },
    {
      texto: 'Nuevo cliente registrado: Carlos Rodríguez',
      fecha: new Date('2024-11-10T12:15:00')
    },
    {
      texto: 'Ana López actualizó su información de contacto',
      fecha: new Date('2024-11-10T10:45:00')
    },
    {
      texto: 'Luis Martínez realizó una compra de S/. 78.20',
      fecha: new Date('2024-11-09T16:20:00')
    },
    {
      texto: 'Patricia Vásquez se registró como nuevo cliente',
      fecha: new Date('2024-11-09T11:30:00')
    }
  ];

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    // Cargar clientes
    this.clienteService.getClientes().subscribe(clientes => {
      this.clientes = clientes;
      this.clientesFiltrados = [...clientes];
    });

    // Cargar estadísticas
    this.clienteService.getClienteStats().subscribe(stats => {
      this.clienteStats = stats;
    });

    // Cargar top clientes
    this.clienteService.getTopClientes(5).subscribe(topClientes => {
      this.topClientes = topClientes;
      this.maxComprasTop = Math.max(...topClientes.map(c => c.totalCompras || 0));
    });
  }

  buscarClientes() {
    if (!this.searchTerm.trim()) {
      this.clientesFiltrados = [...this.clientes];
      return;
    }

    this.clienteService.searchClientes(this.searchTerm).subscribe(clientesFiltrados => {
      this.clientesFiltrados = clientesFiltrados;
    });
  }

  abrirModalNuevoCliente() {
    this.clienteEditando = null;
    this.clienteForm = {
      nombre: '',
      apellido: '',
      dni: '',
      telefono: '',
      email: '',
      direccion: ''
    };
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

  guardarCliente() {
    if (!this.validarFormulario()) {
      return;
    }

    const clienteData: Cliente = {
      nombre: this.clienteForm.nombre.trim(),
      apellido: this.clienteForm.apellido.trim(),
      dni: this.clienteForm.dni.trim(),
      telefono: this.clienteForm.telefono.trim() || undefined,
      email: this.clienteForm.email.trim() || undefined,
      direccion: this.clienteForm.direccion.trim() || undefined
    };

    if (this.clienteEditando) {
      // Actualizar cliente existente
      this.clienteService.updateCliente(this.clienteEditando.id!, clienteData).subscribe(clienteActualizado => {
        if (clienteActualizado) {
          this.cargarDatos();
          this.cerrarModal();
          this.agregarActividad(`Cliente ${clienteActualizado.nombre} ${clienteActualizado.apellido} actualizado`);
        }
      });
    } else {
      // Crear nuevo cliente
      this.clienteService.createCliente(clienteData).subscribe(nuevoCliente => {
        this.cargarDatos();
        this.cerrarModal();
        this.agregarActividad(`Nuevo cliente registrado: ${nuevoCliente.nombre} ${nuevoCliente.apellido}`);
      });
    }
  }

  eliminarCliente(id: number) {
    const cliente = this.clientes.find(c => c.id === id);
    if (!cliente) return;

    if (confirm(`¿Está seguro de eliminar al cliente ${cliente.nombre} ${cliente.apellido}?`)) {
      this.clienteService.deleteCliente(id).subscribe(eliminado => {
        if (eliminado) {
          this.cargarDatos();
          this.agregarActividad(`Cliente ${cliente.nombre} ${cliente.apellido} eliminado`);
        }
      });
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.clienteEditando = null;
    this.clienteForm = {
      nombre: '',
      apellido: '',
      dni: '',
      telefono: '',
      email: '',
      direccion: ''
    };
  }

  private validarFormulario(): boolean {
    if (!this.clienteForm.nombre.trim()) {
      alert('El nombre es requerido');
      return false;
    }

    if (!this.clienteForm.apellido.trim()) {
      alert('El apellido es requerido');
      return false;
    }

    if (!this.clienteForm.dni.trim()) {
      alert('El DNI es requerido');
      return false;
    }

    if (this.clienteForm.dni.trim().length !== 8) {
      alert('El DNI debe tener 8 dígitos');
      return false;
    }

    // Validar que el DNI no esté duplicado
    const dniExistente = this.clientes.find(c => 
      c.dni === this.clienteForm.dni.trim() && 
      c.id !== this.clienteEditando?.id
    );

    if (dniExistente) {
      alert('Ya existe un cliente con este DNI');
      return false;
    }

    // Validar email si se proporciona
    if (this.clienteForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.clienteForm.email.trim())) {
        alert('El formato del email no es válido');
        return false;
      }
    }

    return true;
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
