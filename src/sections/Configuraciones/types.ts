// src/sections/Configuraciones/types.ts

export interface PermisosUsuario {
  // CAJA
  caja_realizar_ventas: boolean;
  caja_abrir_cerrar_turno: boolean;
  caja_ingresos_egresos: boolean;
  caja_ver_fiados: boolean;
  caja_cobrar_deudas: boolean;

  // ALMACÉN
  almacen_ver_stock: boolean;
  almacen_ingresar_lotes: boolean;
  almacen_crear_editar_productos: boolean;
  almacen_eliminar_productos: boolean;
  almacen_modificar_precios: boolean;
  almacen_gestionar_proveedores: boolean;
  almacen_registrar_mermas: boolean;

  // REPORTES
  reportes_ver_historial_ventas: boolean;
  reportes_anular_ventas: boolean;
  reportes_ver_globales: boolean;

  // GERENCIA
  gerencia_ver_utilidades: boolean;
  gerencia_gestionar_usuarios: boolean;
  gerencia_configuracion_sistema: boolean;

  // SISTEMA
  sistema_acceso_total: boolean;
}

export interface Empleado {
  id: string; // Puede ser el UUID de Supabase Auth
  nombre: string;
  email: string;
  rol: string; // Ej: 'Administrador', 'Cajero', 'Almacenero'
  estado: 'ACTIVO' | 'INACTIVO';
  permisos: PermisosUsuario;
}

export interface DatosEmpresa {
  id?: number;
  nombre_empresa: string;
  ruc: string;
  logo_url: string;
  direccion?: string;
  telefono?: string;
}