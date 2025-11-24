import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GenericService } from './generic.service';
import { environment } from '../../environments/environment.development';
import { UnidadMedida } from '../models/unidad-medida'; // <-- Coincide con tu archivo
@Injectable({ providedIn: 'root' })
export class UnidadMedidaService extends GenericService<UnidadMedida> {
  constructor() {
    super(inject(HttpClient), `${environment.BASE_URL}/unidadmedida`); // Revisa esta URL en tu backend
  }
}