import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth-service';

// --- Importaciones de Angular Material ---
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
// ¡¡AÑADE ESTA LÍNEA!!
import { MatMenuModule } from '@angular/material/menu'; 

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    // ¡¡AÑADE ESTA LÍNEA!!
    MatMenuModule 
  ],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css']
})
export class LayoutComponent {

  private authService = inject(AuthService);
  
  // Agrega esta línea para la ruta de tu logo
  logoSmallImageUrl: string = 'images/logo_botica_marcafar.jpg'; // Versión más pequeña o el mismo, pero lo manejaremos con CSS

  logout() {
    this.authService.logout();
  }

  menuItems = [
    { text: 'Dashboard', link: '/pages/dashboard', icon: 'dashboard' },
    { text: 'Productos', link: '/pages/productos', icon: 'inventory_2' },
    { text: 'Clientes', link: '/pages/clientes', icon: 'people' },
    { text: 'Ventas', link: '/pages/ventas', icon: 'shopping_cart' },
    { text: 'Usuarios', link: '/pages/usuarios', icon: 'manage_accounts' },
  ];
}