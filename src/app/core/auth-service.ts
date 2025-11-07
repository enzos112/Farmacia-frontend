import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.development';
import { LoginRequest } from '../models/login-request';
import { LoginResponse } from '../models/login-response';
import { tap } from 'rxjs'; // 'tap' nos permite "espiar" la respuesta sin alterarla

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Inyectamos los servicios que necesitamos
  private http = inject(HttpClient);
  private router = inject(Router);

  // Definimos la URL base de nuestro AuthController
  private url: string = `${environment.BASE_URL}/auth`;

  /**
   * Llama al endpoint /login del backend.
   * Si tiene éxito, guarda el token en sessionStorage.
   */
  login(request: LoginRequest) {
    // Llamamos a la URL /auth/login, enviamos el 'request' y esperamos un 'LoginResponse'
    return this.http.post<LoginResponse>(`${this.url}/login`, request)
      .pipe(
        tap(response => {
          // 'tap' se ejecuta si la llamada es exitosa (200 OK)
          // Guardamos el token en el almacenamiento de la sesión del navegador
          this.setToken(response.token);
        })
      );
  }

  /**
   * Cierra la sesión del usuario.
   */
  logout() {
    this.removeToken();
    this.router.navigate(['/login']); // Redirige al login
  }

  // --- Métodos de Ayuda (Helpers) para el Token ---

  /**
   * Guarda el token en sessionStorage
   */
  private setToken(token: string) {
    sessionStorage.setItem('token', token);
  }

  /**
   * Obtiene el token desde sessionStorage
   */
  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  /**
   * Remueve el token de sessionStorage
   */
  private removeToken() {
    sessionStorage.removeItem('token');
  }

  /**
   * Revisa si el usuario está autenticado (si existe un token)
   * ¡Este método lo usará nuestro 'auth.guard' para proteger las rutas!
   */
  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }
}