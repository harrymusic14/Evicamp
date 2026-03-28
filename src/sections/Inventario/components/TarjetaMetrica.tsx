// src/sections/Inventario/componentes/TarjetaMetrica.tsx
import React from 'react';

interface Props {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  isAlert?: boolean;
  isGreen?: boolean;
}

export const TarjetaMetrica: React.FC<Props> = ({ label, value, icon, isAlert, isGreen }) => (
  <div className="flex items-center gap-3 p-4 border border-[#E2E8F0] bg-white rounded-none min-w-[170px] shadow-sm">
    <div className={`p-2 border border-[#E2E8F0] rounded-none ${
      isAlert ? 'text-red-500 bg-red-50' : 
      isGreen ? 'text-[#10B981] bg-[#ECFDF5]' : 
      'text-[#64748B] bg-[#F8FAFC]'
    }`}>
      {icon}
    </div>
    <div>
      <p className="text-[8px] font-black uppercase tracking-wider text-[#64748B] mb-1">
        {label}
      </p>
      <p className={`text-lg font-bold tracking-tighter ${
        isAlert ? 'text-red-500' : 
        isGreen ? 'text-[#10B981]' : 
        'text-[#1E293B]'
      }`}>
        {value}
      </p>
    </div>
  </div>
);