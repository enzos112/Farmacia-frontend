export interface Usuario {
  id?: number;
  nombre: string;
  apellido?: string;
  username?: string;
  email?: string;
  rol?: string;
  estado?: 'activo' | 'inactivo';
  ultimaConexion?: string; // ISO date
}

export interface UsuarioStats {
  totalUsuarios: number;
  usuariosActivos: number;
  admins: number;
}
