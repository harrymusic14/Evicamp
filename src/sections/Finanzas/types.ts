// src/sections/Finanzas/types.ts

export interface CashSession {
  id: string;
  opening_balance: number;
  closing_balance?: number;
  expected_balance?: number;
  status: 'OPEN' | 'CLOSED';
  opened_at: string;
  closed_at?: string;
  justification?: string;
  opening_yape?: number;
  opening_card?: number;
}

export interface CashMovement {
  id: string;
  session_id?: string;
  type: 'INGRESO' | 'EGRESO';
  amount: number;
  description: string;
  created_at: string;
  payment_type: string;
  flujo?: 'INTERNO' | 'EXTERNO'; // <-- NUEVO: Define si entra a la caja del negocio o personal
}

// Interfaz para las métricas rápidas de la pantalla principal
export interface MetricasCaja {
  totalIngresos: number;
  totalEgresos: number;
  saldoActual: number;
}