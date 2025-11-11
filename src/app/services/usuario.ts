import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Usuario, UsuarioStats } from '../models/usuario';

const STORAGE_KEY = 'app_demo_usuarios';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private nextId = 1;

  constructor() {
    const current = this._loadFromStorage();
    if (current.length) {
      this.nextId = Math.max(...current.map(u => u.id || 0)) + 1;
    } else {
      // Seed with a couple of users for demo
      const seed: Usuario[] = [
        { id: 1, nombre: 'Admin', apellido: 'Sistema', username: 'admin', email: 'admin@demo.com', rol: 'admin', estado: 'activo', ultimaConexion: new Date().toISOString() },
        { id: 2, nombre: 'Juan', apellido: 'Pérez', username: 'jperez', email: 'juan@example.com', rol: 'vendedor', estado: 'activo', ultimaConexion: new Date().toISOString() }
      ];
      this.nextId = 3;
      this._saveToStorage(seed);
    }
  }

  getUsuarios(): Observable<Usuario[]> {
    return of(this._loadFromStorage());
  }

  searchUsuarios(term: string): Observable<Usuario[]> {
    const t = term.trim().toLowerCase();
    const results = this._loadFromStorage().filter(u =>
      u.nombre.toLowerCase().includes(t) ||
      (u.apellido || '').toLowerCase().includes(t) ||
      (u.username || '').toLowerCase().includes(t) ||
      (u.email || '').toLowerCase().includes(t)
    );
    return of(results);
  }

  createUsuario(usuario: Usuario): Observable<Usuario> {
    const list = this._loadFromStorage();
    const nuevo: Usuario = { ...usuario, id: this.nextId++ };
    list.unshift(nuevo);
    this._saveToStorage(list);
    return of(nuevo);
  }

  updateUsuario(id: number, usuario: Usuario): Observable<Usuario | null> {
    const list = this._loadFromStorage();
    const idx = list.findIndex(u => u.id === id);
    if (idx === -1) return of(null);
    const updated = { ...list[idx], ...usuario, id };
    list[idx] = updated;
    this._saveToStorage(list);
    return of(updated);
  }

  deleteUsuario(id: number): Observable<boolean> {
    let list = this._loadFromStorage();
    const before = list.length;
    list = list.filter(u => u.id !== id);
    this._saveToStorage(list);
    return of(list.length < before);
  }

  getUsuarioStats(): Observable<UsuarioStats> {
    const list = this._loadFromStorage();
    const stats: UsuarioStats = {
      totalUsuarios: list.length,
      usuariosActivos: list.filter(u => u.estado === 'activo').length,
      admins: list.filter(u => u.rol === 'admin').length
    };
    return of(stats);
  }

  // --- Helpers (localStorage persistence for demo) ---
  private _loadFromStorage(): Usuario[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as Usuario[];
    } catch (e) {
      return [];
    }
  }

  private _saveToStorage(list: Usuario[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      // ignore
    }
  }
}
