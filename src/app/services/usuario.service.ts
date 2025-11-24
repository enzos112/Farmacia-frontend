import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GenericService } from './generic.service';
import { environment } from '../../environments/environment.development';
import { Usuario } from '../models/usuario';

@Injectable({ providedIn: 'root' })
export class UsuarioService extends GenericService<Usuario> {
  constructor() {
    super(inject(HttpClient), `${environment.BASE_URL}/usuarios`);
  }
}