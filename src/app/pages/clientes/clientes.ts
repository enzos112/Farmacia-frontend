import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar'; // <--- IMPORTAR ESTO

// Imports para Gráficos
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

// Importaciones de Modelos
import { Cliente, ClienteStats } from '../../models/cliente';

// Importar el servicio
import { ClienteService } from '../../services/cliente.service'; 
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';

interface GrupoHistorial {
  fecha: string;
  actividades: any[];
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatIconModule, 
    BaseChartDirective 
  ],
  templateUrl: './clientes.html',
  styleUrls: ['./clientes.css']
})
export class ClientesComponent implements OnInit {

  constructor(
    private clienteService: ClienteService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  // --- DATOS ---
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  mostrarModalCrecimiento = false;
  mostrarModalTodosClientes: boolean = false;

  actividadDelDia: any[] = [];  
  historialAgrupado: GrupoHistorial[] = [];  
  actividadCompleta: any[] = [];

  public growthChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } // Precision 0 para no mostrar 1.5 clientes
  };
  public growthChartType: ChartType = 'bar';
  public growthChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  
  clienteStats: ClienteStats = {
    totalClientes: 0,
    clientesNuevos: 0,
    clientesActivos: 0,
    ventasTotales: 0
  };

  topClientes: Cliente[] = []; // Solo los 5 mejores
  clientesOrdenados: Cliente[] = []; // Todos ordenados para el modal
  maxComprasTop: number = 1; // Para calcular el ancho de la barra (evitar división por 0)
  mostrarModalTopClientes: boolean = false;

  // --- GRÁFICOS ---
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  
  public estadoChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 10 } } }
  };
  public estadoChartType: ChartType = 'doughnut';
  public estadoChartData: ChartData<'doughnut'> = {
    labels: ['Activos', 'Inactivos'],
    datasets: [{ data: [0, 0], backgroundColor: ['#4CAF50', '#EF5350'], borderWidth: 0 }]
  };

  public segmentoChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } }, y: { grid: { display: false } } }
  };
  public segmentoChartType: ChartType = 'bar';
  public segmentoChartData: ChartData<'bar'> = {
    labels: ['VIP', 'Regular', 'Nuevo'],
    datasets: [{ data: [0, 0, 0], backgroundColor: ['#303F9F', '#5C6BC0', '#9FA8DA'], borderRadius: 4, barThickness: 20 }]
  };
  

  // --- UI ---
  searchTerm: string = '';
  filtroActual: string = 'todos';
  
  mostrarModal: boolean = false;
  clienteEditando: Cliente | null = null;
  clienteForm: any = { nombre: '', apellido: '', dni: '', telefono: '', email: '', direccion: '' };
  
  actividadReciente: any[] = []; // Tu lista de actividades
  mostrarModalActividad: boolean = false; // Control del modal

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.clienteService.findAll().subscribe({
      next: (response: any) => {
        // CORRECCIÓN CLAVE: Accedemos a response.content
        // Si el backend devuelve paginación, los datos están en 'content'
        this.clientes = response.content || []; 
        
        this.aplicarFiltros();
        this.actualizarGraficos();
        this.calcularEstadisticas();
        this.calcularTopClientes();
      },
      error: (e) => console.error('Error al cargar clientes', e)
    });
  }
  private agregarActividad(texto: string) {
      const nuevaActividad = {
          texto: texto,
          fecha: new Date() // Guarda fecha y hora exacta
      };

      // 1. Agregamos al inicio del array general
      this.actividadCompleta.unshift(nuevaActividad);

      // 2. Recalculamos las vistas (Widget y Modal)
      this.actualizarVistasActividad();
  }

  private actualizarVistasActividad() {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Inicio del día de hoy

      // A. FILTRO PARA EL WIDGET (Solo actividades de HOY)
      this.actividadDelDia = this.actividadCompleta.filter(act => {
          const fechaAct = new Date(act.fecha);
          fechaAct.setHours(0, 0, 0, 0);
          return fechaAct.getTime() === hoy.getTime();
      }).slice(0, 5); // Máximo 5 para no saturar la tarjeta

      // B. AGRUPACIÓN PARA EL MODAL (Por días)
      this.historialAgrupado = [];
      
      this.actividadCompleta.forEach(act => {
          const fechaAct = new Date(act.fecha);
          const fechaSinHora = new Date(fechaAct);
          fechaSinHora.setHours(0, 0, 0, 0);

          let tituloFecha = '';
          
          // Definimos etiquetas amigables
          if (fechaSinHora.getTime() === hoy.getTime()) {
              tituloFecha = 'Hoy';
          } else {
              const ayer = new Date(hoy);
              ayer.setDate(ayer.getDate() - 1);
              if (fechaSinHora.getTime() === ayer.getTime()) {
                  tituloFecha = 'Ayer';
              } else {
                  // Formato: "23 de Noviembre 2025"
                  tituloFecha = fechaAct.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
              }
          }

          // Buscamos si ya existe el grupo
          let grupo = this.historialAgrupado.find(g => g.fecha === tituloFecha);
          
          if (!grupo) {
              grupo = { fecha: tituloFecha, actividades: [] };
              this.historialAgrupado.push(grupo);
          }
          grupo.actividades.push(act);
      });
  }

  // --- CÁLCULOS LOCALES ---

  calcularEstadisticas() {
    if (!this.clientes) return;

    // A. Total Clientes
    this.clienteStats.totalClientes = this.clientes.length;

    // B. Clientes Activos
    this.clienteStats.clientesActivos = this.clientes.filter(c => (c.estado || 'activo').toLowerCase() === 'activo').length;

    // C. Nuevos (30d) - (Ya lo tenías configurado)
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);
    this.clienteStats.clientesNuevos = this.clientes.filter(c => {
        if (!c.fechaRegistro) return false;
        return new Date(c.fechaRegistro) >= fechaLimite;
    }).length;

    // --- D. VENTAS TOTALES (VALOR DE CARTERA) ---
    // Sumamos el 'totalCompras' que ahora nos envía el Backend para cada cliente
    this.clienteStats.ventasTotales = this.clientes.reduce((sum, cliente) => {
        return sum + (cliente.totalCompras || 0);
    }, 0);
  }
  private calcularDatosCrecimiento() {
      // Agrupamos clientes por mes de registro
      const meses: any = {};
      const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      
      // Inicializar últimos 6 meses en 0 para que el gráfico no salga vacío
      const hoy = new Date();
      for (let i = 5; i >= 0; i--) {
          const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
          const key = `${nombresMeses[d.getMonth()]} ${d.getFullYear()}`;
          meses[key] = 0;
      }

      this.clientes.forEach(c => {
          if (c.fechaRegistro) {
              const d = new Date(c.fechaRegistro);
              const key = `${nombresMeses[d.getMonth()]} ${d.getFullYear()}`;
              // Solo contamos si cae dentro de los meses que queremos mostrar (o creamos la key dinámicamente)
              if (meses[key] !== undefined) {
                  meses[key]++;
              }
          }
      });

      this.growthChartData = {
          labels: Object.keys(meses),
          datasets: [{
              data: Object.values(meses),
              label: 'Nuevos Clientes',
              backgroundColor: '#4CAF50',
              borderRadius: 4
          }]
      };
  }
  abrirModalCrecimiento() {
      this.calcularDatosCrecimiento();
      this.mostrarModalCrecimiento = true;
  }
  cerrarModalCrecimiento() {
      this.mostrarModalCrecimiento = false;
  }

  calcularTopClientes() {
      // 1. Ordenamos todos los clientes por totalCompras (de mayor a menor)
      // Asumimos que cliente.totalCompras viene del backend. Si es undefined, usa 0.
      const ordenados = [...this.clientes].sort((a, b) => (b.totalCompras || 0) - (a.totalCompras || 0));
      
      this.clientesOrdenados = ordenados; // Guardamos la lista completa ordenada
      
      // 2. Extraemos solo los primeros 5 para el widget
      this.topClientes = ordenados.slice(0, 5);
      
      // 3. Obtenemos el valor máximo de compra (el del primero) para calcular el % de las barras
      if (ordenados.length > 0) {
          this.maxComprasTop = ordenados[0].totalCompras || 1; // Usamos 1 para no dividir por cero si es 0
      }
  }

  cerrarModalTopClientes() {
    this.mostrarModalTopClientes = false;
  }

  // --- ACCIONES PRINCIPALES ---

  cambiarEstado(cliente: Cliente) {
    const estaActivo = cliente.estado === 'activo';
    const nuevoEstado = estaActivo ? 'inactivo' : 'activo';
    const accion = estaActivo ? 'desactivar' : 'activar';
    const colorBtn = estaActivo ? 'warn' : 'primary';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `Confirmar ${accion}`,
        message: `¿Está seguro que desea ${accion} al cliente ${cliente.nombre} ${cliente.apellido}?`,
        confirmText: accion.charAt(0).toUpperCase() + accion.slice(1),
        confirmColor: colorBtn
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Creamos una copia del cliente con el nuevo estado
        const clienteActualizado = { ...cliente, estado: nuevoEstado };
        
        // --- CORRECCIÓN AQUÍ ---
        // Usamos 'idCliente' (que viene del backend) en lugar de 'id'
        const idParaEnviar = cliente.idCliente || cliente.id; 

        if (!idParaEnviar) {
            console.error("Error: No se encuentra el ID del cliente");
            return;
        }

        this.clienteService.update(idParaEnviar, clienteActualizado).subscribe({
          next: () => {
            this.cargarDatos();
            this.mostrarNotificacion(`Cliente ${accion === 'activar' ? 'activado' : 'desactivado'} correctamente`, 'success');
            this.agregarActividad(`Cliente ${cliente.nombre} ${accion === 'activar' ? 'activado' : 'desactivado'}`);
          },
          error: (e) => {
            console.error(e);
            this.mostrarNotificacion('Error al cambiar el estado', 'error');
          }
        });
      }
    });
  }

  guardarCliente() {
    if (!this.validarFormulario()) return;

    // Preparamos el objeto alineado al Backend
    const clienteData: any = {
      nombre: this.clienteForm.nombre,
      apellido: this.clienteForm.apellido,
      dni: this.clienteForm.dni,
      direccion: this.clienteForm.direccion,
      estado: this.clienteEditando ? this.clienteEditando.estado : 'activo',
      telefono: this.clienteForm.telefono,
      celular: this.clienteForm.telefono,

      // --- CORRECCIÓN EMAIL: Mayúsculas y sin espacios ---
      // Si existe email, lo convertimos. Si está vacío, mandamos null o vacío.
      email: this.clienteForm.email ? this.clienteForm.email.trim().toUpperCase() : null
    };

    // --- CORRECCIÓN AQUÍ: Usamos idCliente || id ---
    let peticion;
    if (this.clienteEditando) {
        // Aseguramos obtener el ID correcto
        const idParaEditar = this.clienteEditando.idCliente || this.clienteEditando.id;
        
        if (!idParaEditar) {
            this.mostrarNotificacion('Error: No se encuentra el ID del cliente', 'error');
            return;
        }
        peticion = this.clienteService.update(idParaEditar, clienteData);
    } else {
        peticion = this.clienteService.save(clienteData);
    }
    // -----------------------------------------------

    peticion.subscribe({
        next: () => {
            this.cargarDatos();
            this.cerrarModal();
            const mensaje = this.clienteEditando ? 'Cliente actualizado' : 'Cliente registrado';
            this.mostrarNotificacion(`${mensaje} con éxito`, 'success');
            this.agregarActividad(`${mensaje}: ${clienteData.nombre}`);
        },
        error: (e: any) => {
            console.error(e);
            // Mensaje más descriptivo
            const errorMsg = e.error?.message || 'Error al procesar. Verifique los datos.';
            this.mostrarNotificacion(errorMsg, 'error');
        }
    });
  }

  setFiltroRapido(f: string) { this.filtroActual = f; this.aplicarFiltros(); }
  buscarClientes() { this.aplicarFiltros(); }
  
  aplicarFiltros() {
    let res = [...this.clientes];
    
    if (this.filtroActual === 'activos') res = res.filter(c => c.estado === 'activo');
    if (this.filtroActual === 'inactivos') res = res.filter(c => c.estado !== 'activo');
    
    if (this.searchTerm.trim()) {
        const term = this.searchTerm.toLowerCase();
        res = res.filter(c => 
            c.nombre.toLowerCase().includes(term) || 
            c.apellido.toLowerCase().includes(term) || 
            c.dni.includes(term)
        );
    }
    
    this.clientesFiltrados = res;
  }

  actualizarGraficos() {
      // CORRECCIÓN: Si el estado es null o undefined, asumimos que es 'activo'
      const activos = this.clientes.filter(c => (c.estado || 'activo').toLowerCase() === 'activo').length;
      
      // Los inactivos son solo los que explícitamente dicen 'inactivo'
      const inactivos = this.clientes.filter(c => (c.estado || '').toLowerCase() === 'inactivo').length;
      
      this.estadoChartData.datasets[0].data = [activos, inactivos];
      if (this.chart) this.chart.update();
  }

  abrirModalNuevoCliente() { 
      this.clienteEditando = null; 
      this.clienteForm = { nombre: '', apellido: '', dni: '', telefono: '', email: '', direccion: '' };
      this.mostrarModal = true; 
  }
  editarCliente(c: Cliente) { 
      this.clienteEditando = c; 
      
      // AQUÍ ESTABA EL ERROR DEL CELULAR VACÍO
      // Llenamos el formulario con los datos del cliente seleccionado
      this.clienteForm = { 
          nombre: c.nombre,
          apellido: c.apellido,
          dni: c.dni,
          email: c.email,
          direccion: c.direccion,
          // CLAVE: Asignamos 'celular' (BD) a 'telefono' (Formulario)
          telefono: c.celular || c.telefono 
      }; 
      
      this.mostrarModal = true; 
  }
  cerrarModal() { this.mostrarModal = false; }
  
  soloNumeros(event: any) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault(); // Detiene la tecla si no es número
    }
  }
  private validarFormulario(): boolean {
      // Validar campos obligatorios básicos
      if (!this.clienteForm.nombre || !this.clienteForm.apellido || !this.clienteForm.dni || !this.clienteForm.direccion) {
          this.mostrarNotificacion('Faltan datos obligatorios', 'error');
          return false;
      }

      if (!this.clienteForm.nombre || !this.clienteForm.apellido || !this.clienteForm.direccion) {
          this.mostrarNotificacion('⚠️ Faltan datos obligatorios', 'error');
          return false;
      }
      

      // --- VALIDACIÓN DE DNI ---
      const dni = this.clienteForm.dni;

      if (!dni) {
          this.mostrarNotificacion('⚠️ El DNI es obligatorio', 'error');
          return false;
      }

      // Regla: Debe tener exactamente 8 dígitos
      if (dni.length !== 8) {
          this.mostrarNotificacion('⚠️ El DNI debe tener exactamente 8 dígitos', 'error');
          return false;
      }

      // Regla: No puede tener todos los dígitos iguales (ej: 11111111)
      // Lógica: "Si todos los caracteres son iguales al primero, entonces es inválido"
      const todosIguales = dni.split('').every((char: string) => char === dni[0]);
      if (todosIguales) {
          this.mostrarNotificacion('⚠️ El DNI no puede tener todos los dígitos iguales', 'error');
          return false;
      }

      // --- VALIDACIÓN DE CELULAR ---
      const cel = this.clienteForm.telefono; // Recuerda que en el form usas 'telefono'
      
      if (!cel) {
          this.mostrarNotificacion('El celular es obligatorio', 'error');
          return false;
      }

      // Regla: Debe tener 9 dígitos exactos
      if (cel.length !== 9) {
          this.mostrarNotificacion('El celular debe tener exactamente 9 dígitos', 'error');
          return false;
      }

      // Regla: Debe empezar con 9
      if (!cel.startsWith('9')) {
          this.mostrarNotificacion('El celular debe comenzar con el número 9', 'error');
          return false;
      }
      
      // Regla: DNI debe tener 8 dígitos (aprovechando la validación)
      if (this.clienteForm.dni.length !== 8) {
          this.mostrarNotificacion('El DNI debe tener 8 dígitos', 'error');
          return false;
      }

      // --- VALIDACIÓN DE EMAIL ---
      let email = this.clienteForm.email;

      // Si el usuario escribió algo en el email (ya que es opcional en BD, pero si escribe, debe ser válido)
      if (email && email.trim().length > 0) {
          email = email.trim(); // Quitamos espacios accidentales

          // 1. Validar longitud (DB soporta 100)
          if (email.length > 100) {
              this.mostrarNotificacion('⚠️ El email es demasiado largo (máx 100 caracteres)', 'error');
              return false;
          }

          // 2. Validar formato con Regex
          // Permite: letras, numeros, puntos, guiones, un arroba, dominio y extensión (.com, .pe, etc)
          const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          
          if (!emailPattern.test(email)) {
              this.mostrarNotificacion('⚠️ Formato de email inválido (ej: usuario@gmail.com)', 'error');
              return false;
          }
      }

      return true;
  }
  // Método auxiliar para alertas (igual que en Ventas)
  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error') {
    this.snackBar.open(mensaje, 'CERRAR', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: tipo === 'success' ? ['alerta-success'] : ['alerta-error']
    });
  }

  // --- CORRECCIÓN DEL ERROR TS7008 ---
  // Definimos explícitamente el tipo de retorno y del parámetro
  public objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  // Funciones dummy para evitar errores en HTML
  abrirModalTopClientes() {
    this.mostrarModalTopClientes = true;
  }
  abrirModalActividad() {
    this.mostrarModalActividad = true;
  }
  cerrarModalActividad() {
    this.mostrarModalActividad = false;
  }
  abrirModalTodos() {
    this.mostrarModalTodosClientes = true;
  }

  cerrarModalTodos() {
    this.mostrarModalTodosClientes = false;
  }
}