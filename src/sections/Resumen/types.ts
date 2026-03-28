// src/sections/Resumen/types.ts

export interface MetricaResumen {
  titulo: string;
  valor: string | number;
  tendencia?: 'up' | 'down' | 'neutral';
  porcentaje?: string;
  icono: any; // Usaremos los iconos de Lucide
}