import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth-service'; // Importa tu servicio de autenticación
import { environment } from '../../environments/environment.development';

/**
 * Interceptor funcional para añadir el token JWT a las peticiones.
 */
export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn
) => {

  // Inyecta el AuthService
  const authService = inject(AuthService);
  
  // Obtiene el token
  const token = authService.getToken();

  // Revisa si la petición es a nuestra API
  const isApiUrl = req.url.startsWith(environment.BASE_URL);
  // Revisa si es la petición de login (a esta NO se le debe enviar el token)
  const isLoginUrl = req.url.includes('/auth/login');

  // Si tenemos token, es una petición a nuestra API Y no es el login...
  if (token && isApiUrl && !isLoginUrl) {
    // Clona la petición y añade la cabecera de autorización
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}` // Formato estándar
      }
    });
    // Envía la petición clonada
    return next(clonedReq);
  }

  // Si no hay token o es la URL de login, envía la petición original
  return next(req);
};