import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GenericService } from './generic.service';
import { environment } from '../../environments/environment.development';
import { Compra } from '../models/compra';

@Injectable({ providedIn: 'root' })
export class CompraService extends GenericService<Compra> {
  constructor() {
    super(inject(HttpClient), `${environment.BASE_URL}/compras`);
  }
  // Aquí el método 'save' o 'create' del GenericService enviará el DTO completo (idProveedor + items)
}