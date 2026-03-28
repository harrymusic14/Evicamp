// src/sections/Punto-de-venta/types.ts
import type { Product } from '../Inventario/types';

// RE-EXPORTAR PRODUCT PARA USO EN COMPONENTES DEL POS
export type { Product };

export interface CartItem extends Product {
  cartQuantity: number; // Cantidad que el cliente está comprando
  subtotal: number;     // Precio * Cantidad
}