import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../models/usuario';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.css']
})

export class UsuariosComponent implements OnInit {
        userRole: string | null = null;
        accesoDenegado: boolean = false;
      get totalUsuarios(): number {
        return this.usuarios.length;
      }
      get totalAdministradores(): number {
        return this.usuarios.filter(u => u.idRol === 1).length;
      }
      get totalVendedores(): number {
        return this.usuarios.filter(u => u.idRol === 2).length;
      }
          // Contador local para usuarios eliminados (fallback si el backend no devuelve usuarios con estado 'eliminado')
          deletedCount: number = 0;
          get totalEliminados(): number {
            const fromArray = this.usuarios.filter(u => u.estado === 'eliminado').length;
            return fromArray > 0 ? fromArray : this.deletedCount;
          }
    searchTerm: string = '';
    usuariosFiltrados: Usuario[] = [];
  passwordConfirm: string = '';
  mostrarModalNuevoUsuario = false;
  mostrarModalExito = false;
  modoEdicion = false;
  usuarioEditando: Usuario | null = null;
  mostrarModalConfirmar = false;
  usuarioAEliminar: Usuario | null = null;
  // Modal específico para eliminar usuario
  mostrarModalEliminar: boolean = false;
  usuarioAEliminarLocal: Usuario | null = null;
  usuarios: Usuario[] = [];
  usuarioForm: any = {
    dni: '',
    celular: '',
    nombre: '',
    apellido: '',
    login: '',
    password: '',
    direccion: '',
    idRol: 1, // Solo admin
    pregSeguridad: '',
    respSeguridad: ''
  };
  mensajeError: string = '';
  mensajeExito: string = '';

  filtroRol: string = 'todos';
  filtroEstado: string = 'todos';
  get totalActivos(): number {
    return this.usuarios.filter(u => u.estado === 'activo').length;
  }
  get totalInactivos(): number {
    return this.usuarios.filter(u => u.estado === 'inactivo').length;
  }

  constructor(private usuarioService: UsuarioService) {}
    // Contadores generales (persistentes)
    totalUsuariosCreados: number = 0;
    totalUsuariosEliminados: number = 0;
    totalUsuariosEstado: number = 0;
    // Contadores de actividad del día (persisten solo al refrescar la página)
    usuariosCreadosHoy: number = 0;
    usuariosEliminadosHoy: number = 0;
    usuariosEstadoHoy: number = 0;
  ngOnInit() {
    // Restaurar contadores generales desde localStorage
    // Restaurar contadores generales desde localStorage
    const creadosGen = localStorage.getItem('totalUsuariosCreados');
    const eliminadosGen = localStorage.getItem('totalUsuariosEliminados');
    const estadoGen = localStorage.getItem('totalUsuariosEstado');
    this.totalUsuariosCreados = creadosGen ? parseInt(creadosGen, 10) : 0;
    this.totalUsuariosEliminados = eliminadosGen ? parseInt(eliminadosGen, 10) : 0;
    this.totalUsuariosEstado = estadoGen ? parseInt(estadoGen, 10) : 0;
    // Restaurar contadores de actividad del día si existen (solo refresco)
    // Restaurar los contadores de actividad del día desde sessionStorage
    const creadosHoy = sessionStorage.getItem('usuariosCreadosHoy');
    const eliminadosHoy = sessionStorage.getItem('usuariosEliminadosHoy');
    const estadoHoy = sessionStorage.getItem('usuariosEstadoHoy');
    this.usuariosCreadosHoy = creadosHoy ? parseInt(creadosHoy, 10) : 0;
    this.usuariosEliminadosHoy = eliminadosHoy ? parseInt(eliminadosHoy, 10) : 0;
    this.usuariosEstadoHoy = estadoHoy ? parseInt(estadoHoy, 10) : 0;
    // Guardar los contadores al refrescar/cerrar la pestaña
    window.addEventListener('beforeunload', () => {
      sessionStorage.setItem('usuariosCreadosHoy', this.usuariosCreadosHoy.toString());
      sessionStorage.setItem('usuariosEliminadosHoy', this.usuariosEliminadosHoy.toString());
      sessionStorage.setItem('usuariosEstadoHoy', this.usuariosEstadoHoy.toString());
    });
    // Guardar los contadores al actualizar la página o cerrar la pestaña
    window.addEventListener('beforeunload', () => {
      localStorage.setItem('usuariosCreadosHoy', this.usuariosCreadosHoy.toString());
      localStorage.setItem('usuariosEliminadosHoy', this.usuariosEliminadosHoy.toString());
      localStorage.setItem('usuariosEstadoHoy', this.usuariosEstadoHoy.toString());
    });
      localStorage.setItem('usuariosEstadoHoy', this.usuariosEstadoHoy.toString());
    // Restaurar usuarios desde sessionStorage si existen
    const usuariosGuardados = sessionStorage.getItem('usuariosGuardados');
    if (usuariosGuardados) {
      try {
        this.usuarios = JSON.parse(usuariosGuardados);
        this.buscarUsuarios();
      } catch (e) {
        this.usuarios = [];
      }
    } else {
      this.cargarUsuarios();
    }
    // Obtener el rol del usuario desde el token (ajusta según tu AuthService)
    const token = sessionStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userRole = payload.rol || payload.role || (payload.authorities && payload.authorities[0]) || null;
      } catch (e) {
        this.userRole = null;
      }
    }
    if (this.userRole && this.userRole.toLowerCase() === 'vendedor') {
      this.accesoDenegado = true;
      return;
    }
  }


  // Confirma el cambio de estado (activar/desactivar) de un usuario
  confirmarCambioEstado() {
    // Aquí deberías implementar la lógica real de activación/desactivación
    // Por ahora solo cierra el modal y limpia la contraseña
    this.mostrarModalConfirmar = false;
    this.passwordConfirm = '';
    // Puedes mostrar un mensaje de éxito o llamar a un servicio aquí
  }

  filtrarPorRol(rol: string) {
    this.filtroRol = rol;
    this.buscarUsuarios();
  }

  filtrarPorEstado(estado: string) {
    this.filtroEstado = estado;
    this.buscarUsuarios();
  }

  buscarUsuarios() {
    const term = this.searchTerm.trim().toLowerCase();
    let filtrados = [...this.usuarios];
    if (this.filtroRol !== 'todos') {
      filtrados = filtrados.filter(u => {
        if (this.filtroRol === 'admin') return u.idRol === 1;
        if (this.filtroRol === 'supervisor') return u.idRol === 3;
        if (this.filtroRol === 'vendedor') return u.idRol === 2;
        if (this.filtroRol === 'cliente') return u.idRol === 4;
        return true;
      });
    }
    if (this.filtroEstado !== 'todos') {
      filtrados = filtrados.filter(u => u.estado === this.filtroEstado);
    }
    if (term) {
      filtrados = filtrados.filter(u =>
        (u.nombre && u.nombre.toLowerCase().includes(term)) ||
        (u.apellido && u.apellido.toLowerCase().includes(term)) ||
        (u.dni && u.dni.toLowerCase().includes(term)) ||
        (u.login && u.login.toLowerCase().includes(term)) ||
        (u.celular && u.celular.toLowerCase().includes(term))
      );
    }
    this.usuariosFiltrados = filtrados;
  }

  getNombreRol(idRol: number): string {
    if (idRol === 1) return 'Administrador';
    if (idRol === 2) return 'Vendedor';
    return 'Desconocido';
  }


  abrirModalNuevoUsuario() {
    this.resetForm();
    this.modoEdicion = false;
    this.usuarioEditando = null;
    this.mostrarModalNuevoUsuario = true;
  }

  cerrarModalNuevoUsuario() {
    this.mostrarModalNuevoUsuario = false;
    this.mensajeError = '';
  }


  resetForm() {
    this.usuarioForm = {
      dni: '', celular: '', nombre: '', apellido: '', login: '', password: '', direccion: '', idRol: 1, pregSeguridad: '', respSeguridad: ''
    };
    this.mensajeError = '';
  }


  guardarUsuario() {
    // El contador solo se incrementa si la creación es exitosa
    // El contador solo se incrementa si la creación es exitosa
    if (this.userRole && this.userRole.toLowerCase() === 'vendedor') {
      this.mensajeError = 'Acceso denegado: no tienes permiso para guardar usuarios.';
      return;
    }
    if (!this.validarFormulario()) return;
        // Ya no se incrementa manualmente, el getter calcula el total
    const usuario: any = {
      dni: this.usuarioForm.dni,
      nombre: this.usuarioForm.nombre,
      apellido: this.usuarioForm.apellido,
      celular: this.usuarioForm.celular,
      direccion: this.usuarioForm.direccion,
      estado: this.modoEdicion && this.usuarioEditando ? this.usuarioEditando.estado : 'activo',
      login: this.usuarioForm.login,
      pregSeguridad: this.usuarioForm.pregSeguridad,
      respSeguridad: this.usuarioForm.respSeguridad,
      idRol: +this.usuarioForm.idRol
    };
    // Solo incluir password si está presente (para edición)
    if (!this.modoEdicion || (this.usuarioForm.password && this.usuarioForm.password.trim() !== '')) {
      usuario.password = this.usuarioForm.password;
    }
    if (this.modoEdicion && this.usuarioEditando) {
      // Editar usuario
      this.usuarioService.update(this.usuarioEditando.idUsuario, usuario).subscribe({
        next: () => {
          this.cerrarModalNuevoUsuario();
          this.resetForm();
          this.mensajeExito = 'Usuario editado exitosamente';
          this.mostrarModalExito = true;
          this.cargarUsuarios();
        },
        error: (e: any) => {
          this.mensajeError = e.error?.message || 'Error al editar usuario';
        }
      });
    } else {
      // Nuevo usuario
      this.usuarioService.save(usuario).subscribe({
        next: () => {
          this.cerrarModalNuevoUsuario();
          this.resetForm();
          this.mensajeExito = 'Usuario guardado exitosamente';
          this.mostrarModalExito = true;
          this.cargarUsuarios();
          // Actualizar contadores generales y de actividad del día
          this.totalUsuariosCreados++;
          localStorage.setItem('totalUsuariosCreados', this.totalUsuariosCreados.toString());
          this.usuariosCreadosHoy++;
        },
        error: (e: any) => {
          if (e.error?.message && e.error.message.includes('Duplicate entry')) {
            this.mensajeError = 'Ya existe un usuario con esos valores.';
          } else {
            this.mensajeError = e.error?.message || 'Error al guardar usuario';
          }
        }
      });
    }
  }

  cerrarModalExito() {
    this.mostrarModalExito = false;
    this.mensajeExito = '';
  }

  validarFormulario(): boolean {
    if (!this.usuarioForm.dni || !this.usuarioForm.nombre || !this.usuarioForm.apellido || !this.usuarioForm.celular || !this.usuarioForm.login || !this.usuarioForm.password || !this.usuarioForm.direccion || !this.usuarioForm.pregSeguridad || !this.usuarioForm.respSeguridad) {
      this.mensajeError = 'Completa todos los campos obligatorios';
      return false;
    }
    if (this.usuarioForm.dni.length !== 8) {
      this.mensajeError = 'El DNI debe tener 8 dígitos';
      return false;
    }
    if (this.usuarioForm.celular.length !== 9 || !this.usuarioForm.celular.startsWith('9')) {
      this.mensajeError = 'El celular debe tener 9 dígitos y empezar con 9';
      return false;
    }
    if (this.usuarioForm.password.length < 6) {
      this.mensajeError = 'La contraseña debe tener al menos 6 caracteres';
      return false;
    }
    this.mensajeError = '';
    return true;
  }


  // --- ACCIONES DE USUARIO ---
  editarUsuario(usuario: Usuario): void {
    this.modoEdicion = true;
    this.usuarioEditando = usuario;
    this.usuarioForm = {
      dni: usuario.dni,
      celular: usuario.celular,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      login: usuario.login,
      password: '', // No se muestra la contraseña
      direccion: usuario.direccion,
      idRol: 1, // Solo admin
      pregSeguridad: usuario.pregSeguridad,
      respSeguridad: usuario.respSeguridad,
      fecha_registro: (usuario as any).fecha_registro // Guardar fecha_registro si existe
    };
    this.mostrarModalNuevoUsuario = true;
    this.mensajeError = '';
  }

  // Modal de confirmación para activar/desactivar usuario (igual que clientes)
  abrirModalConfirmar(usuario: Usuario): void {
    this.usuarioAEliminar = usuario;
    this.mostrarModalConfirmar = true;
  }

  cerrarModalConfirmar(): void {
    this.mostrarModalConfirmar = false;
    this.usuarioAEliminar = null;
  }

  // Abrir modal de confirmación local para eliminar usuario
  abrirModalEliminar(usuario: Usuario): void {
    this.usuarioAEliminarLocal = usuario;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.usuarioAEliminarLocal = null;
  }

  // Confirmar eliminación: siempre envía petición al servidor
  confirmarEliminarUsuario(): void {
    const usuario = this.usuarioAEliminarLocal;
    if (!usuario) return;
    this.mostrarModalEliminar = false;
    this.usuarioService.delete(usuario.idUsuario).subscribe({
      next: () => {
        this.deletedCount = (this.deletedCount || 0) + 1;
        this.cargarUsuarios();
        // Actualizar contadores generales y de actividad del día
        this.totalUsuariosEliminados++;
        localStorage.setItem('totalUsuariosEliminados', this.totalUsuariosEliminados.toString());
        this.usuariosEliminadosHoy++;
          // Guardar contadores de actividad del día al refrescar
          localStorage.setItem('usuariosCreadosHoy', this.usuariosCreadosHoy.toString());
          localStorage.setItem('usuariosEliminadosHoy', this.usuariosEliminadosHoy.toString());
          // ...existing code...
        this.mensajeExito = 'Usuario eliminado correctamente';
        this.mostrarModalExito = true;
      },
      error: (e: any) => {
        console.error('Error al eliminar usuario:', e);
        this.mensajeError = e.error?.message || 'Error al eliminar el usuario';
        this.mostrarModalExito = true;
      }
    });
    this.usuarioAEliminarLocal = null;
  }

  cambiarEstadoUsuario(usuario: Usuario) {
    usuario.estado = usuario.estado === 'activo' ? 'inactivo' : 'activo';
    // Actualizar contadores generales y de actividad del día
    this.totalUsuariosEstado++;
    localStorage.setItem('totalUsuariosEstado', this.totalUsuariosEstado.toString());
    this.usuariosEstadoHoy++;
    // Guardar el array de usuarios actualizado en sessionStorage
    sessionStorage.setItem('usuariosGuardados', JSON.stringify(this.usuarios));
  }

  cargarUsuarios() {
    this.usuarioService.findAll().subscribe((data: any) => {
      let nuevosUsuarios: Usuario[] = [];
      if (!data) {
        this.usuarios = [];
        this.usuariosFiltrados = [];
        sessionStorage.setItem('usuariosGuardados', JSON.stringify(this.usuarios));
        return;
      }
      if (Array.isArray(data)) {
        nuevosUsuarios = data;
      } else if (Array.isArray(data.content)) {
        nuevosUsuarios = data.content;
      } else if (data && Array.isArray(data.usuarios)) {
        nuevosUsuarios = data.usuarios;
      } else {
        nuevosUsuarios = [];
      }
      // Recuperar estados locales guardados
      const usuariosGuardados = sessionStorage.getItem('usuariosGuardados');
      let usuariosLocales: Usuario[] = [];
      if (usuariosGuardados) {
        try {
          usuariosLocales = JSON.parse(usuariosGuardados);
        } catch (e) {
          usuariosLocales = [];
        }
      }
      // Fusionar estados locales con los nuevos usuarios
      this.usuarios = nuevosUsuarios.map(u => {
        const local = usuariosLocales.find(lu => lu.idUsuario === u.idUsuario);
        return local ? { ...u, estado: local.estado } : u;
      });
      this.buscarUsuarios();
      sessionStorage.setItem('usuariosGuardados', JSON.stringify(this.usuarios));
      console.log('Usuarios cargados:', this.usuarios);
    });
  }
}