import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VentaEventService {
  private ventaRealizadaSource = new Subject<void>();
  ventaRealizada$ = this.ventaRealizadaSource.asObservable();

  notificarVentaRealizada() {
    this.ventaRealizadaSource.next();
  }
}
