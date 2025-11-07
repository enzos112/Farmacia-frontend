import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
// ¡CAMBIO AQUÍ! No es 'App', es 'AppComponent'
import { AppComponent } from './app/app'; 

// ¡CAMBIO AQUÍ!
bootstrapApplication(AppComponent, appConfig) 
  .catch((err) => console.error(err));