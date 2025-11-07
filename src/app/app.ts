import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router'; // 1. Asegúrate de que importa RouterOutlet

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], // 2. Asegúrate de que RouterOutlet esté en 'imports'
  templateUrl: './app.html',
  styleUrls: ['./app.css'] // (O .css si lo cambiaste)
})
export class AppComponent { // <-- 3. La clase se llama AppComponent
  title = 'farmacia-frontend-v2';
}