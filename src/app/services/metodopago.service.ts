import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GenericService } from './generic.service';
import { environment } from '../../environments/environment.development';
import { MetodoPago } from '../models/metodo-pago'; // <-- Coincide con tu archivo
@Injectable({ providedIn: 'root' })
export class MetodoPagoService extends GenericService<MetodoPago> {
  constructor() {
    super(inject(HttpClient), `${environment.BASE_URL}/metodopago`);
  }
}