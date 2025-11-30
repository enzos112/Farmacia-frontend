import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Producto } from '../../models/producto';
import { ProductoService } from '../../services/producto.service';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { UnidadMedidaService, UnidadMedida } from '../../services/unidad-medida.service';
import { AuthService } from '../../core/auth-service';
import { getRoleFromToken } from '../../core/jwt-helper';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css']
})
export class ProductosComponent implements OnInit {
  
  // Datos principales
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  isLoading = false;
  
  // Filtros y búsqueda
  searchTerm: string = '';
  stockFilter: string = '';
  categoriaFilter: string = '';
  
  // Modales
  showModal = false;
  showReporteModal = false;
  showCategoriaModal = false;
  showUnidadModal = false;
  showAlertModal = false;
  showConfirmModal = false;
  
  // Estados de vista
  modoEdicion = false;
  mostrarCategorias = false;
  mostrarUnidades = false;
  pageTitle = 'Productos';
  
  // Formularios
  productoEditando: Producto | null = null;
  productoForm: any = {
    nombre: '',
    descripcion: '',
    codBarras: '',
    laboratorio: '',
    precioCompra: 0,
    precioMenor: 0,
    precioMayor: 0,
    stock: 0,
    stockminimo: 0,
    fechaVencimiento: '',
    idCategoria: 0,
    idUnidadMedida: 0
  };
  
  // Gestión de categorías y unidades (cargadas del backend)
  categoriasGestion: Categoria[] = [];
  unidadesGestion: UnidadMedida[] = [];
  
  categoriaForm = { nombre: '' };
  unidadForm = { nombre: '', simbolo: '' };
  categoriaEditando: any = null;
  unidadEditando: any = null;
  
  // Reporte de stock
  productosSinStock: Producto[] = [];
  productosStockBajo: Producto[] = [];
  
  // Modal de alerta
  alertTitle = '';
  alertMessage = '';
  
  // Modal de confirmación
  confirmModalData = {
    title: '',
    message: '',
    onConfirm: () => {}
  };
  

  public userRole: string | null = null;

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private unidadMedidaService: UnidadMedidaService,
    private authService: AuthService
  ) {
    const token = this.authService.getToken();
    this.userRole = getRoleFromToken(token || '');
  }
  
  ngOnInit(): void {
    // Actualiza el rol del usuario al iniciar el componente
    const token = this.authService.getToken();
    this.userRole = getRoleFromToken(token || '');
    this.cargarProductos();
    this.cargarCategorias();
    this.cargarUnidades();
  }
  
  cargarProductos(): void {
    this.isLoading = true;
    this.productoService.findAll().subscribe({
      next: (data) => {
        console.log('📦 Productos recibidos del backend:', data);
        if (data.length > 0) {
          console.log('📝 Estructura del primer producto:', data[0]);
        }
        this.productos = data;
        this.productosFiltrados = [...this.productos];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        
        if (err.status === 403) {
          this.mostrarAlerta('Error de Autenticación', 'No tienes permisos para acceder. Por favor inicia sesión nuevamente.');
        } else if (err.status === 0) {
          this.mostrarAlerta('Error de Conexión', 'No se puede conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8080');
        } else {
          this.mostrarAlerta('Error', `No se pudieron cargar los productos: ${err.message || err.statusText}`);
        }
      }
    });
  }

  cargarCategorias(): void {
    this.categoriaService.findAll().subscribe({
      next: (data) => {
        console.log('📂 Categorías recibidas del backend:', data);
        this.categoriasGestion = data;
      },
      error: (error) => {
        console.error('❌ Error al cargar categorías:', error);
        this.mostrarAlerta('Error', 'No se pudieron cargar las categorías');
      }
    });
  }

  cargarUnidades(): void {
    this.unidadMedidaService.findAll().subscribe({
      next: (data) => {
        console.log('📏 Unidades de medida recibidas del backend:', data);
        this.unidadesGestion = data;
      },
      error: (error) => {
        console.error('❌ Error al cargar unidades de medida:', error);
        this.mostrarAlerta('Error', 'No se pudieron cargar las unidades de medida');
      }
    });
  }
  
  nuevoProducto(): void {
    this.showModal = true;
    this.modoEdicion = false;
    this.productoForm = {
      nombre: '',
      descripcion: '',
      codBarras: '',
      laboratorio: '',
      precioCompra: 0,
      precioMenor: 0,
      precioMayor: 0,
      stock: 0,
      stockminimo: 0,
      fechaVencimiento: '',
      idCategoria: 0,
      idUnidadMedida: 0
    };
  }
  
  editarProducto(producto: Producto): void {
    console.log('✏️ Editando producto:', producto);
    this.showModal = true;
    this.modoEdicion = true;
    this.productoEditando = producto;
    
    // Extraer IDs de objetos anidados si existen
    const idCategoria = producto.categoria?.idCategoria || producto.idCategoria || 0;
    const idUnidadMedida = producto.unidadMedida?.idUnidadMedida || producto.idUnidadMedida || 0;
    
    console.log('🔑 IDs extraídos - Categoría:', idCategoria, 'Unidad:', idUnidadMedida);
    
    this.productoForm = {
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      codBarras: producto.codBarras,
      laboratorio: producto.laboratorio,
      precioCompra: producto.precioCompra,
      precioMenor: producto.precioMenor,
      precioMayor: producto.precioMayor,
      stock: producto.stock,
      stockminimo: producto.stockminimo,
      fechaVencimiento: producto.fechaVencimiento,
      idCategoria: idCategoria,
      idUnidadMedida: idUnidadMedida
    };
    
    console.log('📝 Formulario cargado:', this.productoForm);
  }
  
  cerrarModal(): void {
    this.showModal = false;
    this.productoEditando = null;
  }
  
  guardarProducto(): void {
    // Validaciones básicas
    if (!this.productoForm.nombre || !this.productoForm.descripcion) {
      this.mostrarAlerta('Error', 'Nombre y descripción son obligatorios');
      return;
    }
    
    if (!this.productoForm.codBarras || this.productoForm.codBarras.trim() === '') {
      this.mostrarAlerta('Error', 'El código de barras es obligatorio');
      return;
    }
    
    if (this.productoForm.idCategoria === 0 || this.productoForm.idCategoria === null) {
      this.mostrarAlerta('Error', 'Debe seleccionar una categoría');
      return;
    }
    
    if (this.productoForm.idUnidadMedida === 0 || this.productoForm.idUnidadMedida === null) {
      this.mostrarAlerta('Error', 'Debe seleccionar una unidad de medida');
      return;
    }
    
    const productoData: Producto = {
      nombre: this.productoForm.nombre,
      descripcion: this.productoForm.descripcion,
      codBarras: this.productoForm.codBarras,
      laboratorio: this.productoForm.laboratorio,
      precioCompra: Number(this.productoForm.precioCompra),
      precioMenor: Number(this.productoForm.precioMenor),
      precioMayor: Number(this.productoForm.precioMayor),
      stock: Number(this.productoForm.stock),
      stockminimo: Number(this.productoForm.stockminimo),
      fechaVencimiento: this.productoForm.fechaVencimiento,
      idCategoria: Number(this.productoForm.idCategoria),
      idUnidadMedida: Number(this.productoForm.idUnidadMedida)
    };
    
    if (this.modoEdicion && this.productoEditando?.idProducto) {
      // Actualizar producto existente
      this.productoService.update(this.productoEditando.idProducto, productoData).subscribe({
        next: (response) => {
          this.mostrarAlerta('Éxito', 'Producto actualizado correctamente');
          this.cargarProductos();
          this.cerrarModal();
        },
        error: (err) => {
          let mensaje = 'No se pudo actualizar el producto.';
          if (err.error?.message) {
            mensaje = err.error.message;
          } else if (err.error) {
            mensaje = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
          }
          
          this.mostrarAlerta('Error al Actualizar', mensaje);
        }
      });
    } else {
      // Crear nuevo producto
      this.productoService.save(productoData).subscribe({
        next: (response) => {
          this.mostrarAlerta('Éxito', 'Producto creado correctamente');
          this.cargarProductos();
          this.cerrarModal();
        },
        error: (err) => {
          console.error('✗ Error al crear producto:', err);
          console.error('Status:', err.status);
          console.error('Error completo:', JSON.stringify(err, null, 2));
          
          let mensaje = 'No se pudo crear el producto.';
          
          if (err.status === 403) {
            mensaje = 'No tienes permisos para crear productos. Inicia sesión nuevamente.';
          } else if (err.status === 0) {
            mensaje = 'No se puede conectar con el servidor. Verifica que el backend esté corriendo.';
          } else if (err.status === 500) {
            const errorMsg = err.error?.message || '';
            
            if (errorMsg.includes('Duplicate entry') && errorMsg.includes('cod_barras')) {
              // Extraer el código de barras duplicado del mensaje
              const match = errorMsg.match(/Duplicate entry '([^']+)'/);
              const codigoDuplicado = match ? match[1] : productoData.codBarras;
              mensaje = `El código de barras "${codigoDuplicado}" ya existe en otro producto. Por favor usa un código diferente.`;
            } else if (errorMsg.includes('FK')) {
              mensaje = 'Error de clave foránea: Verifica que la categoría y unidad de medida existan en la base de datos.';
            } else {
              mensaje = `Error del servidor: ${errorMsg || err.statusText}`;
            }
          } else if (err.error?.message) {
            mensaje = err.error.message;
          }
          
          this.mostrarAlerta('Error al Crear Producto', mensaje);
        }
      });
    }
  }
  
  eliminarProducto(producto: Producto): void {
    this.confirmModalData = {
      title: 'Confirmar Eliminación',
      message: `¿Está seguro de eliminar el producto "${producto.nombre}"?`,
      onConfirm: () => {
        if (producto.idProducto) {
          this.productoService.delete(producto.idProducto).subscribe({
            next: () => {
              this.mostrarAlerta('Éxito', 'Producto eliminado correctamente');
              this.cargarProductos();
              this.cerrarConfirmModal();
            },
            error: (err) => {
              console.error('Error al eliminar producto:', err);
              this.mostrarAlerta('Error', 'No se pudo eliminar el producto');
              this.cerrarConfirmModal();
            }
          });
        }
      }
    };
    this.showConfirmModal = true;
  }
  
  // Búsqueda y filtros
  buscarProductos(): void {
    let resultado = [...this.productos];
    
    // Filtro por término de búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      resultado = resultado.filter(p => 
        p.nombre.toLowerCase().includes(term) ||
        p.descripcion.toLowerCase().includes(term)
      );
    }
    
    // Filtro por categoría
    if (this.categoriaFilter) {
      resultado = resultado.filter(p => 
        this.getCategoriaNombre(p) === this.categoriaFilter
      );
    }
    
    // Filtro por stock
    if (this.stockFilter === 'sin-stock') {
      resultado = resultado.filter(p => p.stock === 0);
    } else if (this.stockFilter === 'stock-bajo') {
      resultado = resultado.filter(p => p.stock > 0 && p.stock <= p.stockminimo);
    } else if (this.stockFilter === 'con-stock') {
      resultado = resultado.filter(p => p.stock > p.stockminimo);
    }
    
    this.productosFiltrados = resultado;
  }
  
  // Reporte de stock
  reporteStockBajo(): void {
    this.productosSinStock = this.productos.filter(p => p.stock === 0);
    this.productosStockBajo = this.productos.filter(p => p.stock > 0 && p.stock <= p.stockminimo);
    this.showReporteModal = true;
  }
  
  cerrarReporteModal(): void {
    this.showReporteModal = false;
  }
  
  // Gestión de categorías
  verCategorias(): void {
    this.mostrarCategorias = true;
    this.mostrarUnidades = false;
    this.pageTitle = 'Categorías';
  }
  
  nuevoCategoria(): void {
    this.showCategoriaModal = true;
    this.categoriaEditando = null;
    this.categoriaForm = { nombre: '' };
  }
  
  editarCategoria(cat: any): void {
    this.showCategoriaModal = true;
    this.categoriaEditando = cat;
    this.categoriaForm = { ...cat };
  }
  
  cerrarCategoriaModal(): void {
    this.showCategoriaModal = false;
    this.categoriaEditando = null;
  }
  
  guardarCategoria(): void {
    if (!this.categoriaForm.nombre || !this.categoriaForm.nombre.trim()) {
      this.mostrarAlerta('Error', 'Debe ingresar un nombre para la categoría');
      return;
    }

    const nuevaCategoria: Categoria = { nombre: this.categoriaForm.nombre.trim() };
    this.categoriaService.save(nuevaCategoria).subscribe({
      next: (categoria) => {
        console.log('✅ Categoría creada en backend:', categoria);
        this.mostrarAlerta('Éxito', 'Categoría creada correctamente');
        this.cargarCategorias(); // Recargar lista
        this.cerrarCategoriaModal();
      },
      error: (error) => {
        console.error('❌ Error al crear categoría:', error);
        this.mostrarAlerta('Error', 'No se pudo crear la categoría');
      }
    });
  }
  
  eliminarCategoria(cat: any): void {
    this.confirmModalData = {
      title: 'Confirmar Eliminación',
      message: `¿Está seguro de eliminar la categoría "${cat.nombre}"?`,
      onConfirm: () => {
        if (cat.idCategoria) {
          this.categoriaService.delete(cat.idCategoria).subscribe({
            next: () => {
              this.mostrarAlerta('Éxito', 'Categoría eliminada correctamente');
              this.cargarCategorias();
              this.cerrarConfirmModal();
            },
            error: (error) => {
              console.error('❌ Error al eliminar categoría:', error);
              let mensaje = 'No se pudo eliminar la categoría';
              if (error.error?.message) {
                mensaje = error.error.message;
              } else if (error.status === 500) {
                mensaje = 'No se puede eliminar la categoría porque tiene productos asociados';
              }
              this.mostrarAlerta('Error', mensaje);
              this.cerrarConfirmModal();
            }
          });
        }
      }
    };
    this.showConfirmModal = true;
  }
  
  // Gestión de unidades de medida
  verUnidadesMedida(): void {
    this.mostrarUnidades = true;
    this.mostrarCategorias = false;
    this.pageTitle = 'Unidades de Medida';
  }
  
  nuevaUnidad(): void {
    this.showUnidadModal = true;
    this.unidadEditando = null;
    this.unidadForm = { nombre: '', simbolo: '' };
  }
  
  editarUnidad(u: any): void {
    this.showUnidadModal = true;
    this.unidadEditando = u;
    this.unidadForm = { ...u };
  }
  
  cerrarUnidadModal(): void {
    this.showUnidadModal = false;
    this.unidadEditando = null;
  }
  
  guardarUnidad(): void {
    if (!this.unidadForm.nombre || !this.unidadForm.nombre.trim()) {
      this.mostrarAlerta('Error', 'Debe ingresar un nombre para la unidad de medida');
      return;
    }
    if (!this.unidadForm.simbolo || !this.unidadForm.simbolo.trim()) {
      this.mostrarAlerta('Error', 'Debe ingresar un símbolo para la unidad de medida');
      return;
    }

    const nuevaUnidad: UnidadMedida = { 
      nombre: this.unidadForm.nombre.trim(), 
      simbolo: this.unidadForm.simbolo.trim().toUpperCase() 
    };
    this.unidadMedidaService.save(nuevaUnidad).subscribe({
      next: (unidad) => {
        console.log('✅ Unidad de medida creada en backend:', unidad);
        this.mostrarAlerta('Éxito', 'Unidad de medida creada correctamente');
        this.cargarUnidades(); // Recargar lista
        this.cerrarUnidadModal();
      },
      error: (error) => {
        console.error('❌ Error al crear unidad de medida:', error);
        this.mostrarAlerta('Error', 'No se pudo crear la unidad de medida');
      }
    });
  }
  
  eliminarUnidad(u: any): void {
    this.confirmModalData = {
      title: 'Confirmar Eliminación',
      message: `¿Está seguro de eliminar la unidad de medida "${u.nombre}" (${u.simbolo})?`,
      onConfirm: () => {
        if (u.idUnidadMedida) {
          this.unidadMedidaService.delete(u.idUnidadMedida).subscribe({
            next: () => {
              this.mostrarAlerta('Éxito', 'Unidad de medida eliminada correctamente');
              this.cargarUnidades();
              this.cerrarConfirmModal();
            },
            error: (error) => {
              console.error('❌ Error al eliminar unidad de medida:', error);
              let mensaje = 'No se pudo eliminar la unidad de medida';
              if (error.error?.message) {
                mensaje = error.error.message;
              } else if (error.status === 500) {
                mensaje = 'No se puede eliminar la unidad de medida porque tiene productos asociados';
              }
              this.mostrarAlerta('Error', mensaje);
              this.cerrarConfirmModal();
            }
          });
        }
      }
    };
    this.showConfirmModal = true;
  }
  
  verProductos(): void {
    this.mostrarCategorias = false;
    this.mostrarUnidades = false;
    this.pageTitle = 'Productos';
  }
  
  // Utilidades
  getCategoriaNombre(producto: Producto): string {
    // Primero intentar obtener el nombre del objeto anidado
    if (producto.categoria?.nombre) {
      return producto.categoria.nombre;
    }
    // Si no existe, buscar en el array local
    const cat = this.categoriasGestion.find(c => c.idCategoria === producto.idCategoria);
    return cat ? cat.nombre : 'Sin categoría';
  }
  
  getStockClass(stock: number, stockminimo: number): string {
    if (stock === 0) return 'stock-cero';
    if (stock <= stockminimo) return 'stock-bajo';
    return 'stock-ok';
  }
  
  mostrarAlerta(title: string, message: string): void {
    this.alertTitle = title;
    this.alertMessage = message;
    this.showAlertModal = true;
  }
  
  cerrarAlerta(): void {
    this.showAlertModal = false;
  }
  
  cerrarConfirmModal(): void {
    this.showConfirmModal = false;
  }
}
