// src/sections/Inventario/components/EtiquetaStock.tsx
import React from 'react';
import { AlertTriangle, Coffee } from 'lucide-react';

interface Props {
  qty: number;
  minStock: number;
  unit: string;
}

export const EtiquetaStock: React.FC<Props> = ({ qty, minStock, unit }) => {
  // 1. CASO EXCEPCIONAL: CONSUMO INTERNO (Sin alertas, bloque estático)
  if (String(unit).toUpperCase().includes('CONSUMO')) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-black text-[10px] uppercase tracking-widest rounded-none" title="Producto de Uso Interno o Servicio">
        <Coffee size={12} />
        CONSUMO
      </div>
    );
  }

  // 2. LÓGICA NORMAL PARA PRODUCTOS DE VENTA (Unidad / Peso)
  let colorClass = 'bg-[#ECFDF5] text-[#10B981] border-[#A7F3D0]';
  let alertIcon = false;
  
  if (qty <= minStock) {
    colorClass = 'bg-red-50 text-red-600 border-red-200';
    alertIcon = true;
  } else if (qty <= (minStock * 2)) {
    colorClass = 'bg-[#F8FAFC] text-[#1E293B] border-[#1E293B]';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 border font-black text-xs uppercase tracking-widest rounded-none ${colorClass}`}>
      {alertIcon && <AlertTriangle size={12} />}
      {qty} <span className="opacity-70 text-[10px]">{unit}</span>
    </div>
  );
};