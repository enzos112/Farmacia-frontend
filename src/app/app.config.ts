import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes'; // Importa las rutas (que definiremos en el Paso 2)

// --- Importaciones Clave que añadimos ---
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { jwtInterceptor } from './core/jwt-interceptor'; // 1. Importa tu interceptor
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'; // 2. Para Angular Material
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideCharts(withDefaultRegisterables()),
    // --- Líneas que añadimos ---
    provideAnimationsAsync(), // 3. Activa las animaciones de Angular Material
    
    // 4. Activa HttpClient y le registra tu interceptor
    provideHttpClient(
      withInterceptors([jwtInterceptor]) 
    )
    
  ]
};