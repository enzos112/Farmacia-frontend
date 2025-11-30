import { Rol } from './rol';

export interface Usuario {
  idUsuario: number;
  dni: string;
  nombre: string;
  apellido: string;
  celular: string;
  direccion: string;
  estado: string;
  login: string;
  password?: string; // Opcional porque es Write-Only
  pregSeguridad: string;
  respSeguridad: string;
  idRol: number;
  rol?: Rol;
  fechaCreacion?: string; // ISO date string
  fechaEliminacion?: string; // ISO date string
  fechaCambioEstado?: string; // ISO date string
}