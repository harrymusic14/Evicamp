export interface Merma {
  id: string;
  batch_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  cost_unit: number;
  total_loss: number;
  reason: string;
  notes?: string;
  user_name: string;
  created_at: string;
  raw_date: string; /* <-- AÑADIMOS ESTA LÍNEA AQUÍ */
  previous_quantity: number;
  new_quantity: number;
}