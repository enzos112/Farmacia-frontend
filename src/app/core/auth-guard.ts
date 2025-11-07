import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth-service'; // Importa tu servicio de autenticación

/**
 * Guardián funcional para proteger las rutas.
 */
export const authGuard: CanActivateFn = (route, state) => {
  
  // Inyecta el AuthService y el Router
  const authService = inject(AuthService);
  const router = inject(Router);

  // Revisa si el usuario está logueado
  if (authService.isLoggedIn()) {
    return true; // Sí puede acceder a la ruta
  } else {
    // No está logueado, redirige a la página de login
    router.navigate(['/login']);
    return false; // No puede acceder a la ruta
  }
};