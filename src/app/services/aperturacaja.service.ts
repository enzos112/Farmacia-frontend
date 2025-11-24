import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GenericService } from './generic.service';
import { environment } from '../../environments/environment.development';
import { AperturaCaja } from '../models/apertura-caja'; // <-- Coincide con tu archivo
@Injectable({ providedIn: 'root' })
export class AperturaCajaService extends GenericService<AperturaCaja> {
  constructor() {
    super(inject(HttpClient), `${environment.BASE_URL}/aperturacaja`); // Revisa URL
  }
}