import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GenericService } from './generic.service';
import { environment } from '../../environments/environment.development';
import { Proveedor } from '../models/proveedor';

@Injectable({ providedIn: 'root' })
export class ProveedorService extends GenericService<Proveedor> {
  constructor() {
    super(inject(HttpClient), `${environment.BASE_URL}/proveedor`);
  }
}