import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { UsuarioService } from '../../services/usuario';
import { Usuario, UsuarioStats } from '../../models/usuario';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.css']
})
export class UsuariosComponent implements OnInit {

  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  searchTerm: string = '';

  // Modal
  mostrarModal: boolean = false;
  usuarioEditando: Usuario | null = null;
  usuarioForm: any = {
    nombre: '',
    apellido: '',
    username: '',
    email: '',
    rol: 'usuario',
    estado: 'activo'
  };

  // Stats & activity
  usuarioStats: UsuarioStats = { totalUsuarios: 0, usuariosActivos: 0, admins: 0 };
  actividadReciente: any[] = [];

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.usuarioService.getUsuarios().subscribe(list => {
      this.usuarios = list;
      this.usuariosFiltrados = [...list];
    });

    this.usuarioService.getUsuarioStats().subscribe(stats => this.usuarioStats = stats);
  }

  buscarUsuarios() {
    if (!this.searchTerm.trim()) {
      this.usuariosFiltrados = [...this.usuarios];
      return;
    }
    this.usuarioService.searchUsuarios(this.searchTerm).subscribe(results => {
      this.usuariosFiltrados = results;
    });
  }

  abrirModalNuevoUsuario() {
    this.usuarioEditando = null;
    this.usuarioForm = { nombre: '', apellido: '', username: '', email: '', rol: 'usuario', estado: 'activo' };
    this.mostrarModal = true;
  }

  editarUsuario(usuario: Usuario) {
    this.usuarioEditando = usuario;
    this.usuarioForm = {
      nombre: usuario.nombre,
      apellido: usuario.apellido || '',
      username: usuario.username || '',
      email: usuario.email || '',
      rol: usuario.rol || 'usuario',
      estado: usuario.estado || 'activo'
    };
    this.mostrarModal = true;
  }

  guardarUsuario() {
    if (!this.validarFormulario()) return;

    const payload: Usuario = {
      nombre: this.usuarioForm.nombre.trim(),
      apellido: this.usuarioForm.apellido.trim() || undefined,
      username: this.usuarioForm.username.trim() || undefined,
      email: this.usuarioForm.email.trim() || undefined,
      rol: this.usuarioForm.rol,
      estado: this.usuarioForm.estado
    };

    if (this.usuarioEditando && this.usuarioEditando.id) {
      this.usuarioService.updateUsuario(this.usuarioEditando.id, payload).subscribe(updated => {
        if (updated) {
          this.cargarDatos();
          this.cerrarModal();
          this.agregarActividad(`Usuario ${updated.nombre} ${updated.apellido || ''} actualizado`);
        }
      });
    } else {
      this.usuarioService.createUsuario(payload).subscribe(nuevo => {
        this.cargarDatos();
        this.cerrarModal();
        this.agregarActividad(`Nuevo usuario registrado: ${nuevo.nombre} ${nuevo.apellido || ''}`);
      });
    }
  }

  eliminarUsuario(id: number) {
    const usuario = this.usuarios.find(u => u.id === id);
    if (!usuario) return;
    if (!confirm(`¿Eliminar al usuario ${usuario.nombre} ${usuario.apellido || ''}?`)) return;
    this.usuarioService.deleteUsuario(id).subscribe(ok => {
      if (ok) {
        this.cargarDatos();
        this.agregarActividad(`Usuario ${usuario.nombre} ${usuario.apellido || ''} eliminado`);
      }
    });
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.usuarioEditando = null;
    this.usuarioForm = { nombre: '', apellido: '', username: '', email: '', rol: 'usuario', estado: 'activo' };
  }

  private validarFormulario(): boolean {
    if (!this.usuarioForm.nombre || !this.usuarioForm.nombre.trim()) {
      alert('El nombre es requerido');
      return false;
    }
    if (!this.usuarioForm.username || !this.usuarioForm.username.trim()) {
      alert('El username es requerido');
      return false;
    }
    // basic email check
    if (this.usuarioForm.email && this.usuarioForm.email.trim()) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(this.usuarioForm.email.trim())) {
        alert('Email inválido');
        return false;
      }
    }
    return true;
  }

  private agregarActividad(texto: string) {
    this.actividadReciente.unshift({ texto, fecha: new Date() });
    if (this.actividadReciente.length > 6) this.actividadReciente = this.actividadReciente.slice(0, 6);
  }
}