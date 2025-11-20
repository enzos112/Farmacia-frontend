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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';

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
    MatMenuModule,
    MatDialogModule
  ],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css']
})
export class LayoutComponent {

  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  // Agrega esta línea para la ruta de tu logo
  logoSmallImageUrl: string = 'images/logo_botica_marcafar.jpg'; // Versión más pequeña o el mismo, pero lo manejaremos con CSS

  // Estado del sidebar
  sidenavOpened: boolean = false;

  logout() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cerrar Sesión',
        message: '¿Está seguro de que desea cerrar sesión en su cuenta?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.authService.logout();
      }
    });
  }

  onSidenavToggle() {
    this.sidenavOpened = !this.sidenavOpened;
  }

  menuItems = [
    { text: 'Dashboard', link: '/pages/dashboard', icon: 'dashboard' },
    { text: 'Productos', link: '/pages/productos', icon: 'inventory_2' },
    { text: 'Clientes', link: '/pages/clientes', icon: 'people' },
    { text: 'Ventas', link: '/pages/ventas', icon: 'shopping_cart' },
    { text: 'Usuarios', link: '/pages/usuarios', icon: 'manage_accounts' },
  ];
}