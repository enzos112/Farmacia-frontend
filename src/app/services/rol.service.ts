import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GenericService } from './generic.service';
import { environment } from '../../environments/environment.development';
import { Rol } from '../models/rol';

@Injectable({ providedIn: 'root' })
export class RolService extends GenericService<Rol> {
  constructor() {
    super(inject(HttpClient), `${environment.BASE_URL}/rol`);
  }
}