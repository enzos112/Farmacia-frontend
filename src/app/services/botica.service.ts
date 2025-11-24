import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GenericService } from './generic.service';
import { environment } from '../../environments/environment.development';
import { Botica } from '../models/botica';

@Injectable({ providedIn: 'root' })
export class BoticaService extends GenericService<Botica> {
  constructor() {
    super(inject(HttpClient), `${environment.BASE_URL}/botica`);
  }
}