import { Routes } from '@angular/router';

// ¡Importa los componentes con los nombres de TUS archivos!
import { DashboardComponent } from './dashboard/dashboard';
import { ProductosComponent } from './productos/productos';
import { ClientesComponent } from './clientes/clientes';
import { VentasComponent } from './ventas/ventas';
import { UsuariosComponent } from './usuarios/usuarios';

export const PAGES_ROUTES: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'productos',
    component: ProductosComponent
  },
  {
    path: 'clientes',
    component: ClientesComponent
  },
  {
    path: 'ventas',
    component: VentasComponent
  },
  {
    path: 'usuarios',
    component: UsuariosComponent
  },
  {
    path: '', // Redirige a 'dashboard' por defecto
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];