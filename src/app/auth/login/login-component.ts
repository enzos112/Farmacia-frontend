import { Component, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Importamos RouterModule

// Importamos los servicios y modelos que SÍ existen
import { AuthService } from '../../core/auth-service'; 
import { LoginRequest } from '../../models/login-request';

// Importaciones de Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login-component.html',
  styleUrls: ['./login-component.css']
})
export class LoginComponent {

  loginForm: FormGroup;
  error: string | null = null;
  
  // Agrega esta línea para la ruta de tu logo
  logoImageUrl: string = 'images/logo_botica_marcafar.jpg'; 

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private zone = inject(NgZone);

  constructor() {
    this.loginForm = this.fb.group({
      login: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      return; // Si el formulario es inválido, no hagas nada
    }

    this.error = null; // Limpia errores previos

    const loginRequest: LoginRequest = {
      login: this.loginForm.value.login,
      password: this.loginForm.value.password
    };

    // 1. Llama al servicio de autenticación
    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        // 2. ¡Éxito! El AuthService ya guardó el token
        console.log('Login exitoso, token recibido:', response.token);

        // 3. Redirige al dashboard (dentro de la zona de Angular)
        this.zone.run(() => {
          this.router.navigate(['/pages/dashboard']); 
        });
      },
      error: (err) => {
        // 4. Si falla (ej. 401 Credenciales incorrectas)
        console.error('Error en el login:', err);
        if (err.status === 401 || err.status === 403) {
            this.error = 'Usuario o contraseña incorrectos.';
        } else {
            this.error = 'Error inesperado. No se pudo conectar al servidor.';
        }
      }
    });
  }
}