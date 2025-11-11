import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../models/producto';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css']
})
export class ProductosComponent implements OnInit {
  // Título dinámico
  pageTitle: string = 'Listado de Productos';

  // Vistas alternas
  mostrarCategorias: boolean = false;
  mostrarUnidades: boolean = false;
  // Variables de búsqueda y filtrado
  searchTerm: string = '';
  stockFilter: string = '';
  
  // Datos
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  
  // Estado de carga
  isLoading: boolean = false;
  
  // Categorías disponibles
  categorias: string[] = [
    'Analgésicos y Antiinflamatorios',
    'Antibióticos',
    'Antigripales y Antialérgicos',
    'Vitaminas y Suplementos',
    'Cuidado Gástrico',
    'Cuidado Personal e Higiene',
    'Primeros Auxilios',
    'Cuidado del Bebé',
    'Equipos Médicos',
    'Cosméticos y Belleza',
    'Medicamentos'
  ];
  
  // Estados
  showModal: boolean = false;
  modoEdicion: boolean = false;
  showReporteModal: boolean = false;
  showCategoriaModal: boolean = false;
  showUnidadModal: boolean = false;
  showAlertModal: boolean = false;
  
  // Mensaje de alerta
  alertMessage: string = '';
  alertTitle: string = 'Notificación';
  
  // Datos del reporte
  productosSinStock: Producto[] = [];
  productosStockBajo: Producto[] = [];
  
  // Formularios
  categoriaForm: any = {
    nombre: ''
  };
  
  unidadForm: any = {
    nombre: '',
    simbolo: ''
  };
  
  modoEdicionCategoria: boolean = false;
  modoEdicionUnidad: boolean = false;

  /**
   * Muestra un mensaje de alerta personalizado
   */
  mostrarAlerta(mensaje: string, titulo: string = 'Notificación') {
    this.alertMessage = mensaje;
    this.alertTitle = titulo;
    this.showAlertModal = true;
  }

  /**
   * Cierra el modal de alerta
   */
  cerrarAlerta() {
    this.showAlertModal = false;
    this.alertMessage = '';
  }
  
  // Formulario de producto
  productoForm: any = {
    nombre: '',
    descripcion: '',
    precioVenta: 0,
    stock: 0
  };


  ngOnInit() {
    // Cargar datos de prueba
    this.cargarDatosPrueba();
  }

  /**
   * Datos de prueba para desarrollo
   */
  cargarDatosPrueba() {
    this.productos = [
      { idProducto: 1,  nombre: 'Alcohol 70° 250ml',                   descripcion: 'Antiséptico de uso externo',                 stock: 60.00,  precioVenta: 5.00 },
      { idProducto: 2,  nombre: 'Amoxicilina 500mg',                   descripcion: 'Antibiótico de amplio espectro',             stock: 29.00,  precioVenta: 25.00 },
      { idProducto: 3,  nombre: 'Aspirina',                            descripcion: 'Analgésico',                                  stock: 120.00, precioVenta: 5.50 },
      { idProducto: 4,  nombre: 'Aspirina 100mg',                      descripcion: 'Analgésico baja dosis',                       stock: 173.00, precioVenta: 1.00 },
      { idProducto: 5,  nombre: 'Azitromicina 200mg/5ml Suspensión',  descripcion: 'Antibiótico en suspensión',                    stock: 15.00,  precioVenta: 25.00 },
      { idProducto: 6,  nombre: 'Complejo B',                          descripcion: 'Vitaminas del complejo B',                    stock: 138.00, precioVenta: 20.00 },
      { idProducto: 7,  nombre: 'Crema para escaldaduras Desitin',     descripcion: 'Cuidado de la piel del bebé',                 stock: 49.00,  precioVenta: 21.50 },
      { idProducto: 8,  nombre: 'Curitas Clásicas',                    descripcion: 'Apósito adhesivo para pequeñas heridas',      stock: 100.00, precioVenta: 4.00 },
      { idProducto: 9,  nombre: 'Diclofenaco Gel 1%',                  descripcion: 'Gel tópico antiinflamatorio',                 stock: 25.00,  precioVenta: 15.00 },
      { idProducto: 10, nombre: 'Dolocordralan',                       descripcion: 'Analgésico/antiinflamatorio',                 stock: 0.00,   precioVenta: 4.50 },
      { idProducto: 11, nombre: 'Don gripa',                           descripcion: 'Antigripal',                                  stock: 0.00,  precioVenta: 1.50 },
      { idProducto: 12, nombre: 'Gripa',                               descripcion: 'Analgésico para síntomas de gripe',           stock: 6.00,   precioVenta: 12.00 },
      { idProducto: 13, nombre: 'Ibuprofeno 400mg',                    descripcion: 'Antiinflamatorio no esteroideo (AINE)',       stock: 27.00,  precioVenta: 2.00 },
      { idProducto: 14, nombre: 'Jabón Antibacterial Protex',          descripcion: 'Cuidado e higiene personal',                  stock: 20.00,  precioVenta: 4.00 },
      { idProducto: 15, nombre: 'Loratadina 10mg',                     descripcion: 'Antialérgico',                                stock: 500.00, precioVenta: 0.50 },
      { idProducto: 16, nombre: 'Naproxeno sodico',                    descripcion: 'Analgésico y antiinflamatorio (AINE)',        stock: 0.00,  precioVenta: 5.00 }
    ];
    this.productosFiltrados = [...this.productos];
  }

  /**
   * Busca productos según los filtros aplicados
   */
  buscarProductos() {
    this.productosFiltrados = this.productos.filter(producto => {
      // Filtro por término de búsqueda
      const matchesSearch = !this.searchTerm || 
        producto.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (producto.descripcion && producto.descripcion.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      // Filtro por stock
      const matchesStock = !this.stockFilter ||
        (this.stockFilter === 'sin-stock' && producto.stock === 0) ||
        (this.stockFilter === 'stock-bajo' && producto.stock > 0 && producto.stock <= 10) ||
        (this.stockFilter === 'con-stock' && producto.stock > 10);
      
      return matchesSearch && matchesStock;
    });
  }

  /**
   * Limpia todos los filtros y muestra todos los productos
   */
  limpiarFiltros() {
    this.searchTerm = '';
    this.stockFilter = '';
    this.productosFiltrados = [...this.productos];
  }

  /**
   * Retorna la clase CSS según el nivel de stock
   */
  getStockClass(stock: number): string {
    // Tratar negativos como sin stock
    if (stock <= 0) return 'stock-cero';
    if (stock <= 10) return 'stock-bajo';
    return 'stock-ok';
  }

  getCategoria(producto: Producto): string {
    const nombre = producto.nombre.toLowerCase();
    
    if (nombre.includes('alcohol') || nombre.includes('venda') || nombre.includes('gasa') || nombre.includes('curitas')) {
      return 'Primeros Auxilios';
    } else if (nombre.includes('termómetro') || nombre.includes('tensiómetro')) {
      return 'Equipos Médicos';
    } else if (nombre.includes('vitamina') || nombre.includes('suplemento') || nombre.includes('complejo b')) {
      return 'Vitaminas y Suplementos';
    } else if (nombre.includes('amoxicilina') || nombre.includes('azitromicina') || nombre.includes('antibiótico') || nombre.includes('antibiotico')) {
      return 'Antibióticos';
    } else if (nombre.includes('loratadina') || nombre.includes('gripa') || nombre.includes('antigripal') || nombre.includes('alérg') || nombre.includes('alerg')) {
      return 'Antigripales y Antialérgicos';
    } else if (
      nombre.includes('aspirina') ||
      nombre.includes('ibuprofeno') ||
      nombre.includes('naproxeno') ||
      nombre.includes('diclofenaco') ||
      nombre.includes('dolo')
    ) {
      return 'Analgésicos y Antiinflamatorios';
    } else if (nombre.includes('desitin') || nombre.includes('bebé') || nombre.includes('bebe')) {
      return 'Cuidado del Bebé';
    } else if (nombre.includes('jabón') || nombre.includes('jabon') || nombre.includes('protex') || nombre.includes('higiene')) {
      return 'Cuidado Personal e Higiene';
    }
    return 'Medicamentos';
  }

  /**
   * Abre formulario para crear un nuevo producto
   */
  nuevoProducto() {
    this.modoEdicion = false;
    this.resetearFormulario();
    this.showModal = true;
  }

  /**
   * Resetea el formulario de producto
   */
  resetearFormulario() {
    this.productoForm = {
      nombre: '',
      descripcion: '',
      precioVenta: 0,
      stock: 0
    };
  }

  /**
   * Cierra el modal
   */
  cerrarModal() {
    this.showModal = false;
    this.resetearFormulario();
  }

  /**
   * Guarda el producto (crear o editar)
   */
  guardarProducto() {
    // Validación básica
    if (!this.productoForm.nombre.trim()) {
      this.cerrarModal();
      this.mostrarAlerta('El nombre del producto es obligatorio', 'Validación');
      return;
    }

    if (this.productoForm.precioVenta <= 0) {
      this.cerrarModal();
      this.mostrarAlerta('El precio debe ser mayor a 0', 'Validación');
      return;
    }

    if (this.modoEdicion) {
      // Actualizar producto existente
      const index = this.productos.findIndex(p => p.idProducto === this.productoForm.idProducto);
      if (index !== -1) {
        this.productos[index] = {
          idProducto: this.productoForm.idProducto,
          nombre: this.productoForm.nombre,
          descripcion: this.productoForm.descripcion,
          stock: this.productoForm.stock,
          precioVenta: this.productoForm.precioVenta
        };
        this.buscarProductos();
        this.cerrarModal();
        this.mostrarAlerta(`Producto "${this.productoForm.nombre}" actualizado exitosamente!`, 'Éxito');
      }
    } else {
      // Crear nuevo producto
      const nuevoId = Math.max(...this.productos.map(p => p.idProducto), 0) + 1;
      const nuevoProducto: Producto = {
        idProducto: nuevoId,
        nombre: this.productoForm.nombre,
        descripcion: this.productoForm.descripcion,
        stock: this.productoForm.stock,
        precioVenta: this.productoForm.precioVenta
      };
      
      this.productos.push(nuevoProducto);
      this.buscarProductos();
      this.cerrarModal();
      this.mostrarAlerta(`Producto "${this.productoForm.nombre}" agregado exitosamente!`, 'Éxito');
    }
  }

  /**
   * Genera un reporte de productos con stock bajo
   */
  reporteStockBajo() {
    this.productosSinStock = this.productos.filter(p => p.stock <= 0);
    this.productosStockBajo = this.productos.filter(p => p.stock > 0 && p.stock <= 10);
    
    this.showReporteModal = true;
  }

  /**
   * Cierra el modal de reporte
   */
  cerrarReporteModal() {
    this.showReporteModal = false;
  }

  /**
   * Filtra productos con stock bajo desde el reporte
   */
  filtrarStockBajo() {
    this.stockFilter = 'stock-bajo';
    this.buscarProductos();
    this.cerrarReporteModal();
  }

  /**
   * Abre el formulario para editar un producto existente
   */
  editarProducto(producto: Producto) {
    this.modoEdicion = true;
    this.productoForm = {
      idProducto: producto.idProducto,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precioVenta: producto.precioVenta,
      stock: producto.stock
    };
    this.showModal = true;
  }

  /**
   * Elimina un producto después de confirmar
   */
  eliminarProducto(producto: Producto) {
    if (confirm(`¿Está seguro de eliminar el producto "${producto.nombre}"?`)) {
      this.productos = this.productos.filter(p => p.idProducto !== producto.idProducto);
      this.buscarProductos();
      this.mostrarAlerta(`Producto "${producto.nombre}" eliminado exitosamente!`, 'Éxito');
    }
  }

  /**
   * Navegación / placeholder para Categorías
   */
  verCategorias() {
    this.mostrarCategorias = true;
    this.mostrarUnidades = false;
    this.pageTitle = 'Categorías';
  }

  /**
   * Navegación / placeholder para Unidades de Medida
   */
  verUnidadesMedida() {
    this.mostrarCategorias = false;
    this.mostrarUnidades = true;
    this.pageTitle = 'Unidades de Medida';
  }

  /**
   * Regresar a la vista principal de productos
   */
  verProductos() {
    this.mostrarCategorias = false;
    this.mostrarUnidades = false;
    this.pageTitle = 'Listado de Productos';
    this.showReporteModal = false;
    this.searchTerm = '';
    this.stockFilter = '';
    this.buscarProductos();
  }

  /**
   * Datos de categorías para clasificación y gestión
   */
  categoriasGestion: Array<{ nombre: string }> = [
    { nombre: 'Analgésicos y Antiinflamatorios' },
    { nombre: 'Antibióticos' },
    { nombre: 'Antigripales y Antialérgicos' },
    { nombre: 'Vitaminas y Suplementos' },
    { nombre: 'Cuidado Gástrico' },
    { nombre: 'Cuidado Personal e Higiene' },
    { nombre: 'Primeros Auxilios' },
    { nombre: 'Cuidado del Bebé' },
    { nombre: 'Equipos Médicos' },
    { nombre: 'Cosméticos y Belleza' },
  ];

  editarCategoria(cat: { nombre: string }) {
    this.modoEdicionCategoria = true;
    this.categoriaForm = { 
      nombre: cat.nombre,
      categoriaOriginal: cat
    };
    this.showCategoriaModal = true;
  }

  eliminarCategoria(cat: { nombre: string }) {
    if (confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) {
      this.categoriasGestion = this.categoriasGestion.filter(c => c !== cat);
      this.mostrarAlerta('Categoría eliminada', 'Éxito');
    }
  }

  /**
   * Crear nueva categoría
   */
  nuevoCategoria() {
    this.modoEdicionCategoria = false;
    this.categoriaForm = { nombre: '' };
    this.showCategoriaModal = true;
  }

  /**
   * Guarda la categoría (crear o editar)
   */
  guardarCategoria() {
    const nombreLimpio = this.categoriaForm.nombre.trim();
    
    if (!nombreLimpio) {
      this.cerrarCategoriaModal();
      this.mostrarAlerta('El nombre de la categoría es obligatorio', 'Validación');
      return;
    }

    if (this.modoEdicionCategoria) {
      // Editar categoría existente
      const idx = this.categoriasGestion.indexOf(this.categoriaForm.categoriaOriginal);
      if (idx > -1) {
        this.categoriasGestion[idx] = { ...this.categoriaForm.categoriaOriginal, nombre: nombreLimpio };
        this.categoriasGestion = [...this.categoriasGestion];
        this.cerrarCategoriaModal();
        this.mostrarAlerta('Categoría actualizada exitosamente', 'Éxito');
      }
    } else {
      // Nueva categoría
      this.categoriasGestion.push({ nombre: nombreLimpio });
      this.cerrarCategoriaModal();
      this.mostrarAlerta('Categoría agregada exitosamente', 'Éxito');
    }
  }

  /**
   * Cierra el modal de categoría
   */
  cerrarCategoriaModal() {
    this.showCategoriaModal = false;
    this.categoriaForm = { nombre: '' };
    this.modoEdicionCategoria = false;
  }

  /**
   * Datos de unidades de medida (Nombre y Símbolo)
   */
  unidadesGestion: Array<{ nombre: string; simbolo: string }> = [
    { nombre: 'Unidad', simbolo: 'UND' },
    { nombre: 'Caja', simbolo: 'CAJA' },
    { nombre: 'Frasco', simbolo: 'FRASCO' },
    { nombre: 'Tubo', simbolo: 'TUBO' },
    { nombre: 'Paquete', simbolo: 'PAQ' },
    { nombre: 'Tabletas', simbolo: 'TB' },
  ];

  editarUnidad(u: { nombre: string; simbolo: string }) {
    this.modoEdicionUnidad = true;
    this.unidadForm = {
      nombre: u.nombre,
      simbolo: u.simbolo,
      unidadOriginal: u
    };
    this.showUnidadModal = true;
  }

  eliminarUnidad(u: { nombre: string; simbolo: string }) {
    if (confirm(`¿Eliminar la unidad "${u.nombre}"?`)) {
      this.unidadesGestion = this.unidadesGestion.filter(x => x !== u);
      this.mostrarAlerta('Unidad eliminada', 'Éxito');
    }
  }

  nuevaUnidad() {
    this.modoEdicionUnidad = false;
    this.unidadForm = { nombre: '', simbolo: '' };
    this.showUnidadModal = true;
  }

  /**
   * Guarda la unidad (crear o editar)
   */
  guardarUnidad() {
    const nombreLimpio = this.unidadForm.nombre.trim();
    const simboloLimpio = this.unidadForm.simbolo.trim().toUpperCase();

    if (!nombreLimpio) {
      this.cerrarUnidadModal();
      this.mostrarAlerta('El nombre de la unidad es obligatorio', 'Validación');
      return;
    }

    if (!simboloLimpio) {
      this.cerrarUnidadModal();
      this.mostrarAlerta('El símbolo de la unidad es obligatorio', 'Validación');
      return;
    }

    if (this.modoEdicionUnidad) {
      // Editar unidad existente
      const idx = this.unidadesGestion.indexOf(this.unidadForm.unidadOriginal);
      if (idx > -1) {
        this.unidadesGestion[idx] = { nombre: nombreLimpio, simbolo: simboloLimpio };
        this.unidadesGestion = [...this.unidadesGestion];
        this.cerrarUnidadModal();
        this.mostrarAlerta('Unidad actualizada exitosamente', 'Éxito');
      }
    } else {
      // Nueva unidad
      this.unidadesGestion.push({ nombre: nombreLimpio, simbolo: simboloLimpio });
      this.cerrarUnidadModal();
      this.mostrarAlerta('Unidad agregada exitosamente', 'Éxito');
    }
  }

  /**
   * Cierra el modal de unidad
   */
  cerrarUnidadModal() {
    this.showUnidadModal = false;
    this.unidadForm = { nombre: '', simbolo: '' };
    this.modoEdicionUnidad = false;
  }
}
