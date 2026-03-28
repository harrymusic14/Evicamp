export interface Proveedor {
  id: string;
  ruc: string;              // RUC o DNI del proveedor
  razon_social: string;     // Nombre de la empresa o persona
  nombre_comercial?: string; // Nombre comercial (opcional)
  telefono: string;
  email?: string;
  direccion?: string;
  estado: 'ACTIVO' | 'INACTIVO';
  created_at?: string;
}