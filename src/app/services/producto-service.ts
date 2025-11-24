import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development'; // 1. Importa tu environment
import { HttpClient } from '@angular/common/http';
import { Producto } from '../models/producto'; // 2. Importa tu modelo Producto
import { GenericService } from './generic-service'; // 3. Importa el genérico
import { Observable, Subject } from 'rxjs'; // 4. Importa Subject para la reactividad
import { map } from 'rxjs/operators'; // Para transformar la respuesta

@Injectable({
  providedIn: 'root'
})
// 5. Usa 'extends' para heredar del genérico
export class ProductoService extends GenericService<Producto> {

  // 6. Crea los "canales de comunicación" (igual que tu docente)
  private productoChange: Subject<Producto[]> = new Subject<Producto[]>();
  private messageChange: Subject<string> = new Subject<string>();

  constructor() {
    // 7. Llama al constructor 'super' (el del GenericService)
    super(
      inject(HttpClient),
      // 8. Pasa la URL de tu API de productos (desde 'environment.ts')
      `${environment.BASE_URL}/productos` 
    );
    console.log('🔧 ProductoService inicializado con URL:', `${environment.BASE_URL}/productos`);
  }

  // Sobrescribir findAll para manejar respuesta paginada
  override findAll(): Observable<Producto[]> {
    return this.http.get<any>(this.url).pipe(
      map(response => {
        // Si la respuesta tiene la propiedad 'content', es una respuesta paginada
        if (response && response.content && Array.isArray(response.content)) {
          return response.content;
        }
        // Si ya es un array, devolverlo directamente
        if (Array.isArray(response)) {
          return response;
        }
        // Si no es ninguno de los anteriores, devolver array vacío
        return [];
      })
    );
  }

  // --- Métodos para el canal de comunicación de Productos ---
  setProductoChange(data: Producto[]){
    this.productoChange.next(data);
  }

  getProductoChange(){
    return this.productoChange.asObservable();
  }

  // --- Métodos para el canal de comunicación de Mensajes (Notificaciones) ---
  setMessageChange(data: string){
    this.messageChange.next(data);
  }

  getMessageChange(){
    return this.messageChange.asObservable();
  }
}