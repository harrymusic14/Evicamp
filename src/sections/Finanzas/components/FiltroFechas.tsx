// src/sections/Finanzas/components/FiltroFechas.tsx
import React, { useState } from 'react';

interface Props {
  onFilter: (desde: string, hasta: string) => void;
}

export const FiltroFechas: React.FC<Props> = ({ onFilter }) => {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const aplicarFiltroRapido = (tipo: 'HOY' | 'SEMANA' | 'MES') => {
    const hoy = new Date();
    let inicio = new Date(hoy);
    let fin = new Date(hoy);

    if (tipo === 'HOY') {
      // Mismo día
    } else if (tipo === 'SEMANA') {
      const dia = hoy.getDay() || 7; // Lunes como primer día
      inicio.setDate(hoy.getDate() - dia + 1);
    } else if (tipo === 'MES') {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    }

    const startStr = inicio.toISOString().split('T')[0];
    const endStr = fin.toISOString().split('T')[0];

    setDesde(startStr);
    setHasta(endStr);
    onFilter(startStr, endStr);
  };

  const manejarBusquedaManual = () => {
    onFilter(desde, hasta);
  };

  // NUEVA FUNCIÓN: Resetea los estados locales y notifica al padre
  const limpiarFiltros = () => {
    setDesde('');
    setHasta('');
    onFilter('', '');
  };

  return (
    <div className="bg-[#FFFFFF] border-2 border-[#1E293B] shadow-[4px_4px_0_0_#1E293B] p-4 flex flex-col md:flex-row gap-4 items-end mb-6 rounded-none">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Desde</label>
        <input 
          type="date" 
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          className="bg-[#F8FAFC] text-[#1E293B] border-2 border-[#E2E8F0] focus:border-[#1E293B] rounded-none px-3 py-2 text-xs font-bold outline-none transition-colors"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Hasta</label>
        <input 
          type="date" 
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          className="bg-[#F8FAFC] text-[#1E293B] border-2 border-[#E2E8F0] focus:border-[#1E293B] rounded-none px-3 py-2 text-xs font-bold outline-none transition-colors"
        />
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={manejarBusquedaManual}
          className="bg-[#1E293B] text-[#FFFFFF] px-4 py-2 text-xs font-black uppercase tracking-widest border-2 border-[#1E293B] hover:bg-[#FFFFFF] hover:text-[#1E293B] transition-colors rounded-none cursor-pointer"
        >
          Buscar
        </button>
        <button 
          onClick={limpiarFiltros}
          className="bg-[#FFFFFF] text-[#64748B] px-4 py-2 text-xs font-black uppercase tracking-widest border-2 border-[#64748B] hover:bg-[#64748B] hover:text-[#FFFFFF] transition-colors rounded-none cursor-pointer"
        >
          Limpiar
        </button>
      </div>

      <div className="flex gap-2 ml-auto">
        <button 
          onClick={() => aplicarFiltroRapido('HOY')}
          className="bg-[#FFFFFF] text-[#1E293B] px-4 py-2 border-2 border-[#E2E8F0] hover:border-[#1E293B] text-[10px] font-black uppercase tracking-widest transition-colors rounded-none cursor-pointer"
        >
          Hoy
        </button>
        <button 
          onClick={() => aplicarFiltroRapido('SEMANA')}
          className="bg-[#FFFFFF] text-[#1E293B] px-4 py-2 border-2 border-[#E2E8F0] hover:border-[#1E293B] text-[10px] font-black uppercase tracking-widest transition-colors rounded-none cursor-pointer"
        >
          Semana
        </button>
        <button 
          onClick={() => aplicarFiltroRapido('MES')}
          className="bg-[#FFFFFF] text-[#1E293B] px-4 py-2 border-2 border-[#E2E8F0] hover:border-[#1E293B] text-[10px] font-black uppercase tracking-widest transition-colors rounded-none cursor-pointer"
        >
          Mes
        </button>
      </div>
    </div>
  );
};