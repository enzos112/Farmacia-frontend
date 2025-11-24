import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';

export interface Categoria {
  idCategoria?: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private url = `${environment.BASE_URL}/categoria`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<Categoria[]> {
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

  save(categoria: Categoria): Observable<Categoria> {
    return this.http.post<Categoria>(this.url, categoria);
  }

  update(id: number, categoria: Categoria): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.url}/${id}`, categoria);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
