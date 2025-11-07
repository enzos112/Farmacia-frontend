import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router'; // RouterModule es para los routerLink
import { AuthService } from '../../core/auth-service'; // Importa tu auth-service

// --- Importaciones de Angular Material para el Layout ---
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,     // Para cargar las rutas hijas (ej. dashboard)
    RouterModule,     // Para que funcionen los [routerLink] del menú
    
    // --- Módulos de Material ---
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css'] // Usamos .scss como en tu archivo
})
export class LayoutComponent { // <-- ¡Asegúrate que la clase se llame así!

  // Inyectamos el AuthService y Router
  private authService = inject(AuthService);

  // Función para el botón de Cerrar Sesión
  logout() {
    this.authService.logout();
    // No necesitas redirigir, el authService ya lo hace
  }

  // Lista de enlaces para el menú lateral
  // (Igual a los que definiste en pages.routes.ts)
  menuItems = [
    { text: 'Dashboard', link: '/pages/dashboard', icon: 'dashboard' },
    { text: 'Productos', link: '/pages/productos', icon: 'inventory_2' },
    { text: 'Clientes', link: '/pages/clientes', icon: 'people' },
    { text: 'Ventas', link: '/pages/ventas', icon: 'shopping_cart' },
    { text: 'Usuarios', link: '/pages/usuarios', icon: 'manage_accounts' },
  ];
}