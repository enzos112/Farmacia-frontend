import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';

export interface UnidadMedida {
  idUnidadMedida?: number;
  nombre: string;
  simbolo: string;
}

@Injectable({
  providedIn: 'root'
})
export class UnidadMedidaService {
  private url = `${environment.BASE_URL}/unidadmedida`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<UnidadMedida[]> {
    return this.http.get<any>(this.url).pipe(
      map(response => {
        // Si la respuesta tiene paginación
        if (response?.content && Array.isArray(response.content)) {
          return response.content;
        }
        // Si la respuesta es un array directo
        return Array.isArray(response) ? response : [];
      })
    );
  }

  save(unidadMedida: UnidadMedida): Observable<UnidadMedida> {
    return this.http.post<UnidadMedida>(this.url, unidadMedida);
  }

  update(id: number, unidadMedida: UnidadMedida): Observable<UnidadMedida> {
    return this.http.put<UnidadMedida>(`${this.url}/${id}`, unidadMedida);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
