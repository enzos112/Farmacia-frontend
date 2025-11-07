import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.css'] // (o .css si es el caso)
})
export class UsuariosComponent { // <-- ¡La palabra 'export' es la clave!

}