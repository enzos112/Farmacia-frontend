import { Routes } from '@angular/router';

// ¡Importa los componentes con los nombres de TUS archivos!
// (Estos archivos SÍ existen en tu proyecto)
import { LayoutComponent } from './pages/layout/layout';
import { LoginComponent } from './auth/login/login-component'; 
import { authGuard } from './core/auth-guard'; 

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'pages',
    component: LayoutComponent,
    canActivate: [authGuard], 
    loadChildren: () => import('./pages/pages.routes').then(m => m.PAGES_ROUTES)
  },
  { 
    path: '', // Ruta raíz
    redirectTo: 'login', // ¡Redirige a /login por defecto!
    pathMatch: 'full' 
  },
  { 
    path: '**', // Cualquier otra ruta no encontrada
    redirectTo: 'login' 
  }
];