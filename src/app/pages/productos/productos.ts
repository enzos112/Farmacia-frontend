import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../models/producto';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, NgFor, NgIf, NgClass],
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
  
  // Estados
  isLoading: boolean = false;
  showModal: boolean = false;
  modoEdicion: boolean = false;
  
  // Formulario de producto
  productoForm: any = {
    nombre: '',
    descripcion: '',
    precioVenta: 0,
    stock: 0
  };

  // Categorías disponibles (para mostrar en la tabla)
  categorias: string[] = [
    'Analgésicos y Antiinflamatorios',
    'Antibióticos',
    'Antigripales y Antialérgicos',
    'Cosméticos y Belleza',
    'Cuidado del Bebé',
    'Cuidado Gástrico',
    'Cuidado Personal e Higiene',
    'Equipos Médicos',
    'Primeros Auxilios',
    'Vitaminas y Suplementos'
  ];

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
      { idProducto: 10, nombre: 'Dolocordralan',                       descripcion: 'Analgésico/antiinflamatorio',                 stock: 6.00,   precioVenta: 4.50 },
      { idProducto: 11, nombre: 'Don gripa',                           descripcion: 'Antigripal',                                  stock: -1.00,  precioVenta: 1.50 },
      { idProducto: 12, nombre: 'Gripa',                               descripcion: 'Analgésico para síntomas de gripe',           stock: 6.00,   precioVenta: 12.00 },
      { idProducto: 13, nombre: 'Ibuprofeno 400mg',                    descripcion: 'Antiinflamatorio no esteroideo (AINE)',       stock: 27.00,  precioVenta: 2.00 },
      { idProducto: 14, nombre: 'Jabón Antibacterial Protex',          descripcion: 'Cuidado e higiene personal',                  stock: 20.00,  precioVenta: 4.00 },
      { idProducto: 15, nombre: 'Loratadina 10mg',                     descripcion: 'Antialérgico',                                stock: 500.00, precioVenta: 0.50 },
      { idProducto: 16, nombre: 'Naproxeno sodico',                    descripcion: 'Analgésico y antiinflamatorio (AINE)',        stock: -1.00,  precioVenta: 5.00 }
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
      alert('El nombre del producto es obligatorio');
      return;
    }

    if (this.productoForm.precioVenta <= 0) {
      alert('El precio debe ser mayor a 0');
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
        alert(`Producto "${this.productoForm.nombre}" actualizado exitosamente!`);
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
      alert(`Producto "${this.productoForm.nombre}" agregado exitosamente!`);
    }

    this.buscarProductos();
    this.cerrarModal();
  }

  /**
   * Genera un reporte de productos con stock bajo
   */
  reporteStockBajo() {
    const productosSinStock = this.productos.filter(p => p.stock === 0);
    const productosStockBajo = this.productos.filter(p => p.stock > 0 && p.stock <= 10);
    
    let reporte = 'REPORTE DE STOCK BAJO\n';
    reporte += '═'.repeat(50) + '\n\n';
    
    // Productos sin stock
    reporte += `PRODUCTOS SIN STOCK (${productosSinStock.length}):\n`;
    reporte += '─'.repeat(50) + '\n';
    if (productosSinStock.length > 0) {
      productosSinStock.forEach((p, index) => {
        reporte += `${index + 1}. ${p.nombre}\n`;
        reporte += `   Precio: $${p.precioVenta.toFixed(2)}\n`;
      });
    } else {
      reporte += '   ✓ No hay productos sin stock\n';
    }
    
    reporte += '\n';
    
    // Productos con stock bajo
    reporte += `PRODUCTOS CON STOCK BAJO (${productosStockBajo.length}):\n`;
    reporte += '─'.repeat(50) + '\n';
    if (productosStockBajo.length > 0) {
      productosStockBajo.forEach((p, index) => {
        reporte += `${index + 1}. ${p.nombre}\n`;
        reporte += `   Stock actual: ${p.stock} unidades\n`;
        reporte += `   Precio: $${p.precioVenta.toFixed(2)}\n`;
      });
    } else {
      reporte += '   ✓ No hay productos con stock bajo\n';
    }
    
    reporte += '\n' + '═'.repeat(50) + '\n';
    reporte += `TOTAL A REABASTECER: ${productosSinStock.length + productosStockBajo.length} productos`;
    
    // Mostrar reporte
    alert(reporte);
    
    // Opcional: filtrar automáticamente los productos con problemas
    if (productosSinStock.length > 0 || productosStockBajo.length > 0) {
      const mostrarFiltrados = confirm('¿Desea filtrar los productos con stock bajo?');
      if (mostrarFiltrados) {
        this.stockFilter = 'stock-bajo';
        this.buscarProductos();
      }
    }
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
      alert(`Producto "${producto.nombre}" eliminado exitosamente!`);
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
  }

  /**
   * Datos de categorías (Nombre y Símbolo)
   */
  categoriasGestion: Array<{ nombre: string; simbolo: string }> = [
    { nombre: 'Analgésicos y Antiinflamatorios', simbolo: '' },
    { nombre: 'Antibióticos', simbolo: '' },
    { nombre: 'Antigripales y Antialérgicos', simbolo: '' },
    { nombre: 'Vitaminas y Suplementos', simbolo: '' },
    { nombre: 'Cuidado Gástrico', simbolo: '' },
    { nombre: 'Cuidado Personal e Higiene', simbolo: '' },
    { nombre: 'Primeros Auxilios', simbolo: '' },
    { nombre: 'Cuidado del Bebé', simbolo: '' },
    { nombre: 'Equipos Médicos', simbolo: '' },
    { nombre: 'Cosméticos y Belleza', simbolo: '' },
  ];

  editarCategoria(cat: { nombre: string; simbolo: string }) {
    const nuevoNombre = prompt('Editar categoría', cat.nombre);
    if (nuevoNombre === null) return; // cancelado
    const nombreLimpio = nuevoNombre.trim();
    if (!nombreLimpio) return;
    // Actualizar y notificar a la vista
    const idx = this.categoriasGestion.indexOf(cat);
    if (idx > -1) {
      this.categoriasGestion[idx] = { ...cat, nombre: nombreLimpio };
      this.categoriasGestion = [...this.categoriasGestion];
    }
  }

  eliminarCategoria(cat: { nombre: string; simbolo: string }) {
    if (confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) {
      this.categoriasGestion = this.categoriasGestion.filter(c => c !== cat);
      alert('Categoría eliminada');
    }
  }

  /**
   * Crear nueva categoría (mock)
   */
  nuevoCategoria() {
    const nombre = prompt('Nombre de la nueva categoría:');
    if (!nombre || !nombre.trim()) return;
    // Ya no se requiere símbolo para categorías
    this.categoriasGestion.push({ nombre: nombre.trim(), simbolo: '' });
    alert(' Categoría agregada');
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
    const nombre = prompt('Editar nombre de unidad', u.nombre);
    if (nombre === null) return;
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;

    const simbolo = prompt('Editar símbolo (abreviatura)', u.simbolo || '');
    if (simbolo === null) return;
    const simboloLimpio = simbolo.trim().toUpperCase();

    const idx = this.unidadesGestion.indexOf(u);
    if (idx > -1) {
      this.unidadesGestion[idx] = { ...u, nombre: nombreLimpio, simbolo: simboloLimpio };
      this.unidadesGestion = [...this.unidadesGestion];
    }
  }

  eliminarUnidad(u: { nombre: string; simbolo: string }) {
    if (confirm(`¿Eliminar la unidad "${u.nombre}"?`)) {
      this.unidadesGestion = this.unidadesGestion.filter(x => x !== u);
      alert('Unidad eliminada');
    }
  }

  nuevaUnidad() {
    const nombre = prompt('Nombre de la nueva unidad:');
    if (!nombre || !nombre.trim()) return;
    const simbolo = prompt('Símbolo (abreviatura):') || nombre.substring(0,3).toUpperCase();
    this.unidadesGestion.push({ nombre: nombre.trim(), simbolo: simbolo.trim().toUpperCase() });
    alert('Unidad agregada');
  }
}
