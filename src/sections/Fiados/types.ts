export interface Cliente {
  id: string;
  nombre: string;
  dni: string;
  telefono: string;
}

export interface FiadoDetalle {
  productoId: string;
  name: string;
  qty: number | string; // <-- CORREGIDO: Soporta el string vacío o puntos decimales en tránsito
  price: number;
  subtotal: number | string; // <-- CORREGIDO: Soporta el string vacío en ingeniería inversa
  control_type?: string; 
}

// NUEVO: Interfaz para guardar cada pago individual
export interface PagoAbono {
  id: string;
  monto: number;
  metodo: string;
  fecha: string;
}

export interface Fiado {
  id: string;
  clienteId?: string;
  clienteNombre: string;
  clienteDni?: string;
  clienteTelefono?: string;
  montoOriginal: number;
  saldoPendiente: number;
  montoPagado?: number; // <-- AÑADIDO: Para evitar el error de TypeScript
  fechaEmision: string;
  fechaVencimiento: string;
  // CORREGIDO: Ampliamos los estados para que acepte los de la base de datos
  estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'CANCELADO' | 'ANULADO'; 
  detalles: FiadoDetalle[];
  pagos?: PagoAbono[]; 
}