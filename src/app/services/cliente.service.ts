import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GenericService } from './generic.service';
import { environment } from '../../environments/environment.development';
import { Cliente } from '../models/cliente';

@Injectable({ providedIn: 'root' })
export class ClienteService extends GenericService<Cliente> {
  constructor() {
    super(inject(HttpClient), `${environment.BASE_URL}/cliente`);
  }
}