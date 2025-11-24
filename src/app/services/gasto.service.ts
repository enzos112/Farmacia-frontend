import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GenericService } from './generic.service';
import { environment } from '../../environments/environment.development';
import { Gasto } from '../models/gasto';

@Injectable({ providedIn: 'root' })
export class GastoService extends GenericService<Gasto> {
  constructor() {
    super(inject(HttpClient), `${environment.BASE_URL}/gastos`);
  }
}