import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Cliente, ClienteStats } from '../models/cliente';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  
  private clientes: Cliente[] = [
    {
      id: 1,
      nombre: 'María',
      apellido: 'González',
      dni: '12345678',
      telefono: '987654321',
      email: 'maria.gonzalez@email.com',
      direccion: 'Av. Principal 123, Lima',
      fechaRegistro: new Date('2024-01-15'),
      totalCompras: 1250.50,
      ultimaCompra: new Date('2024-11-08'),
      estado: 'activo'
    },
    {
      id: 2,
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      dni: '87654321',
      telefono: '912345678',
      email: 'carlos.rodriguez@email.com',
      direccion: 'Jr. Los Olivos 456, Lima',
      fechaRegistro: new Date('2024-02-20'),
      totalCompras: 890.75,
      ultimaCompra: new Date('2024-11-05'),
      estado: 'activo'
    },
    {
      id: 3,
      nombre: 'Ana',
      apellido: 'López',
      dni: '11223344',
      telefono: '998877665',
      email: 'ana.lopez@email.com',
      direccion: 'Calle Las Flores 789, Lima',
      fechaRegistro: new Date('2024-03-10'),
      totalCompras: 2150.25,
      ultimaCompra: new Date('2024-11-09'),
      estado: 'activo'
    },
    {
      id: 4,
      nombre: 'Luis',
      apellido: 'Martínez',
      dni: '55667788',
      telefono: '955443322',
      email: 'luis.martinez@email.com',
      direccion: 'Av. Los Pinos 321, Lima',
      fechaRegistro: new Date('2024-04-05'),
      totalCompras: 675.80,
      ultimaCompra: new Date('2024-10-28'),
      estado: 'activo'
    },
    {
      id: 5,
      nombre: 'Patricia',
      apellido: 'Vásquez',
      dni: '99887766',
      telefono: '977665544',
      email: 'patricia.vasquez@email.com',
      direccion: 'Jr. San Martín 654, Lima',
      fechaRegistro: new Date('2024-05-12'),
      totalCompras: 450.30,
      ultimaCompra: new Date('2024-09-15'),
      estado: 'inactivo'
    }
  ];

  constructor() { }

  // Obtener todos los clientes
  getClientes(): Observable<Cliente[]> {
    return of(this.clientes);
  }

  // Obtener cliente por ID
  getClienteById(id: number): Observable<Cliente | undefined> {
    const cliente = this.clientes.find(c => c.id === id);
    return of(cliente);
  }

  // Crear nuevo cliente
  createCliente(cliente: Cliente): Observable<Cliente> {
    const newId = Math.max(...this.clientes.map(c => c.id || 0)) + 1;
    const newCliente = {
      ...cliente,
      id: newId,
      fechaRegistro: new Date(),
      totalCompras: 0,
      estado: 'activo' as const
    };
    this.clientes.push(newCliente);
    return of(newCliente);
  }

  // Actualizar cliente
  updateCliente(id: number, cliente: Partial<Cliente>): Observable<Cliente | null> {
    const index = this.clientes.findIndex(c => c.id === id);
    if (index !== -1) {
      this.clientes[index] = { ...this.clientes[index], ...cliente };
      return of(this.clientes[index]);
    }
    return of(null);
  }

  // Eliminar cliente
  deleteCliente(id: number): Observable<boolean> {
    const index = this.clientes.findIndex(c => c.id === id);
    if (index !== -1) {
      this.clientes.splice(index, 1);
      return of(true);
    }
    return of(false);
  }

  // Buscar clientes
  searchClientes(term: string): Observable<Cliente[]> {
    const filtered = this.clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(term.toLowerCase()) ||
      cliente.apellido.toLowerCase().includes(term.toLowerCase()) ||
      cliente.dni.includes(term) ||
      (cliente.email && cliente.email.toLowerCase().includes(term.toLowerCase()))
    );
    return of(filtered);
  }

  // Obtener estadísticas de clientes
  getClienteStats(): Observable<ClienteStats> {
    const totalClientes = this.clientes.length;
    const clientesActivos = this.clientes.filter(c => c.estado === 'activo').length;
    
    // Clientes nuevos (últimos 30 días)
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);
    const clientesNuevos = this.clientes.filter(c => 
      c.fechaRegistro && c.fechaRegistro >= fechaLimite
    ).length;

    const ventasTotales = this.clientes.reduce((total, cliente) => 
      total + (cliente.totalCompras || 0), 0
    );

    const stats: ClienteStats = {
      totalClientes,
      clientesNuevos,
      clientesActivos,
      ventasTotales
    };

    return of(stats);
  }

  // Obtener top clientes por compras
  getTopClientes(limit: number = 5): Observable<Cliente[]> {
    const sorted = [...this.clientes]
      .sort((a, b) => (b.totalCompras || 0) - (a.totalCompras || 0))
      .slice(0, limit);
    return of(sorted);
  }
}
