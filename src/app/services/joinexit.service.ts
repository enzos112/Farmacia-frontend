import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GenericService } from './generic.service';
import { environment } from '../../environments/environment.development';
import { JoinExit } from '../models/join-exit'; // <-- Coincide con tu archivo

@Injectable({ providedIn: 'root' })
export class JoinExitService extends GenericService<JoinExit> {
  constructor() {
    super(inject(HttpClient), `${environment.BASE_URL}/joinexits`);
  }
}