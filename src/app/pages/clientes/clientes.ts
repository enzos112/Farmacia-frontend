import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clientes.html',
  styleUrls: ['./clientes.css'] // (o .css si es el caso)
})
export class ClientesComponent { // <-- ¡La palabra 'export' es la clave!

}
