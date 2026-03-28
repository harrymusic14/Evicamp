// src/sections/Utilidades/types.ts
export interface MetricaDia {
  fecha: string;
  total: number;
  tickets: number;
}

export interface MetricaProducto {
  id: string;
  nombre: string;
  cantidadVendida: number;
  totalRecaudado: number;
}

export interface MetricaCategoria {
  categoria: string;
  cantidadVendida: number;
  totalRecaudado: number;
}

// NUEVA INTERFAZ PARA EL ANÁLISIS DE RENTABILIDAD
export interface AnalisisProducto {
  id: string;
  nombre: string;
  categoria: string;
  estado: string; 
  stockActual?: number; 
  tipoControl?: string; // <-- NUEVO: Para saber si es producto de CONSUMO
  unidadesVendidas: number;
  ingresosTotales: number;
  costoTotalVentas: number;
  unidadesMerma: number;
  perdidaMerma: number;
  utilidadReal: number;
  margen: number; // Porcentaje de ganancia
}