import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GenericService<T> {
  constructor(
    protected http: HttpClient,
    // Esta línea es la que nos permite pasar la URL desde los servicios "hijos"
    @Inject('API_URL') protected url: string 
  ) {}

  findAll() {
    return this.http.get<T[]>(this.url);
  }

  findById(id: number) {
    return this.http.get<T>(`${this.url}/${id}`);
  }

  save(t: T) {
    // Tu backend devuelve la entidad creada, así que la especificamos aquí
    return this.http.post<T>(this.url, t); 
  }

  update(id: number, t: T) {
    // Tu backend devuelve la entidad actualizada
    return this.http.put<T>(`${this.url}/${id}`, t); 
  }

  delete(id: number) {
    return this.http.delete(`${this.url}/${id}`);
  }
}