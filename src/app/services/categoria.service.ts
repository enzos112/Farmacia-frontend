import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GenericService } from './generic.service';
import { environment } from '../../environments/environment.development';
import { Categoria } from '../models/categoria';

@Injectable({ providedIn: 'root' })
export class CategoriaService extends GenericService<Categoria> {
  constructor() {
    super(inject(HttpClient), `${environment.BASE_URL}/categoria`);
  }
}