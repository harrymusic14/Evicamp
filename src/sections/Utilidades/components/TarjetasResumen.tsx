// src/sections/Utilidades/components/TarjetasResumen.tsx
import React from 'react';
import { DollarSign, ArrowDownToLine, ArrowUpFromLine, Activity, Wallet } from 'lucide-react';

interface Props {
  ingresos: number;
  costos: number;
  mermas: number;
  gastosOperativos: number;
  utilidad: number;
}

export const TarjetasResumen: React.FC<Props> = ({ ingresos, costos, mermas, gastosOperativos, utilidad }) => {
  return (
    <div className="flex flex-wrap lg:flex-nowrap gap-4 shrink-0 font-sans">
      <div className="flex-1 bg-white border-2 border-slate-200 shadow-sm p-5 flex gap-4 items-center rounded-xl">
        <div className="w-12 h-12 bg-blue-50 border-2 border-blue-100 rounded-full flex items-center justify-center text-blue-500"><ArrowUpFromLine size={20} /></div>
        <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ingresos Brutos</p><p className="text-xl font-bold text-slate-800">S/ {ingresos.toFixed(2)}</p></div>
      </div>
      <div className="flex-1 bg-white border-2 border-slate-200 shadow-sm p-5 flex gap-4 items-center rounded-xl">
        <div className="w-12 h-12 bg-amber-50 border-2 border-amber-100 rounded-full flex items-center justify-center text-amber-500"><ArrowDownToLine size={20} /></div>
        <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Costo de Ventas</p><p className="text-xl font-bold text-slate-800">S/ {costos.toFixed(2)}</p></div>
      </div>
      <div className="flex-1 bg-white border border-slate-200 shadow-sm p-5 flex gap-4 items-center rounded-xl">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500"><Activity size={20} /></div>
        <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pérdida Mermas</p><p className="text-xl font-bold text-slate-800">S/ {mermas.toFixed(2)}</p></div>
      </div>
      
      {/* NUEVA TARJETA DE GASTOS DE CAJA (FINANZAS) */}
      <div className="flex-1 bg-white border border-slate-200 shadow-sm p-5 flex gap-4 items-center rounded-xl">
        <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-500"><Wallet size={20} /></div>
        <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gastos (Finanzas)</p><p className="text-xl font-bold text-slate-800">S/ {gastosOperativos.toFixed(2)}</p></div>
      </div>

      <div className="flex-1 bg-emerald-500 border border-emerald-600 shadow-md p-5 flex gap-4 items-center rounded-xl text-white">
        <div className="w-12 h-12 bg-white/20 border-2 border-white/30 rounded-full flex items-center justify-center text-white"><DollarSign size={24} /></div>
        <div><p className="text-[11px] font-bold text-emerald-50 uppercase tracking-wider">Utilidad Neta Real</p><p className="text-2xl font-bold text-white">S/ {utilidad.toFixed(2)}</p></div>
      </div>
    </div>
  );
};