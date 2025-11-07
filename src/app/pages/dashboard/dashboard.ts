import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'] // (o .css si es el caso)
})
export class DashboardComponent { // <-- ¡La palabra 'export' es la clave!

}
