// src/sections/Reportes/types.ts
export interface TicketVenta {
  id: string;
  created_at: string;
  total: number;
  metodo_pago: string; // Ej: 'EFECTIVO', 'YAPE', 'MIXTO', 'FIADO'
  estado: 'COMPLETADO' | 'ANULADO';
  cart_snapshot?: any; // (Opcional) Para guardar qué productos exactos se vendieron
  
  // Nuevos campos opcionales para manejar los fiados sin romper el resto
  es_fiado?: boolean;
  cliente_nombre?: string | null;
  monto_pagado?: number;
  monto_deuda?: number;
}