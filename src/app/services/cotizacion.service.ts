import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GenericService } from './generic.service';
import { environment } from '../../environments/environment.development';
import { Cotizacion } from '../models/cotizacion';

@Injectable({ providedIn: 'root' })
export class CotizacionService extends GenericService<Cotizacion> {
  constructor() {
    super(inject(HttpClient), `${environment.BASE_URL}/cotizaciones`);
  }
}