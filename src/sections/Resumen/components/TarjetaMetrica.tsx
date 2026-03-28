// src/sections/Resumen/components/TarjetaMetrica.tsx
import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  titulo: string;
  valor: string | number;
  icono: LucideIcon;
  colorIcono: string;
  bgIcono: string;
  tendencia?: string;
  esPositivo?: boolean;
}

export const TarjetaMetrica: React.FC<Props> = ({ titulo, valor, icono: Icon, colorIcono, bgIcono, tendencia, esPositivo }) => {
  return (
    <div className="bg-white border border-[#E2E8F0] p-5 relative overflow-hidden group rounded-none shadow-sm transition-all hover:shadow-md">
      <div className={`absolute -right-4 -top-4 w-16 h-16 ${bgIcono} opacity-10 group-hover:scale-150 transition-transform duration-500`}></div>
      <div className="flex justify-between items-start mb-3 relative z-10">
        <h3 className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.2em] leading-tight w-2/3">{titulo}</h3>
        <div className={`p-2 ${bgIcono} ${colorIcono} rounded-none border border-[#E2E8F0]/20`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="relative z-10">
        <span className="text-xl font-black text-[#1E293B] tracking-tighter font-mono">{valor}</span>
      </div>
      {tendencia && (
        <div className="mt-2 text-[9px] font-bold font-mono flex items-center gap-1">
          <span className={esPositivo ? 'text-[#10B981]' : 'text-red-500'}>{tendencia}</span>
          <span className="text-[#94A3B8] uppercase">Global</span>
        </div>
      )}
    </div>
  );
};