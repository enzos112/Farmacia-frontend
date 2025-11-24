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
}