// src/sections/Utilidades/components/FiltrosUtilidades.tsx
import React, { useState, useEffect } from 'react';
import { BarChart3, CalendarDays, Search, RotateCcw } from 'lucide-react';

interface Props {
  fechaInicio: string;
  fechaFin: string;
  setFechaInicio: (val: string) => void;
  setFechaFin: (val: string) => void;
  filtrarHoy: () => void;
  filtrarSemana: () => void;
  filtrarMes: () => void;
  limpiarFiltros: () => void;
}

export const FiltrosUtilidades: React.FC<Props> = ({
  fechaInicio, fechaFin, setFechaInicio, setFechaFin,
  filtrarHoy, filtrarSemana, filtrarMes, limpiarFiltros
}) => {
  // Estados locales para que la tabla no se actualice hasta presionar "Buscar"
  const [localInicio, setLocalInicio] = useState(fechaInicio);
  const [localFin, setLocalFin] = useState(fechaFin);

  // Sincronizar los inputs si se usan los botones rápidos (Hoy, Mes, etc.)
  useEffect(() => {
    setLocalInicio(fechaInicio);
    setLocalFin(fechaFin);
  }, [fechaInicio, fechaFin]);

  const handleBuscar = () => {
    setFechaInicio(localInicio);
    setFechaFin(localFin);
  };

  return (
    <div className="flex flex-wrap lg:flex-nowrap justify-between items-end gap-4 shrink-0 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <BarChart3 size={28} className="text-blue-500" /> Inteligencia de Negocio
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Análisis de Utilidad y Rendimiento</p>
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex gap-2">
          <button onClick={filtrarHoy} className="bg-white border-2 border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-colors rounded-lg shadow-sm cursor-pointer">Hoy</button>
          <button onClick={filtrarSemana} className="bg-white border-2 border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-colors rounded-lg shadow-sm cursor-pointer">7 Días</button>
          <button onClick={filtrarMes} className="bg-white border-2 border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-colors rounded-lg shadow-sm cursor-pointer">Mes</button>
        </div>

        <div className="flex items-center gap-2 bg-white border-2 border-slate-200 p-2 shadow-sm rounded-lg">
          <div className="flex flex-col px-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Desde</label>
            <div className="flex items-center gap-2">
              <CalendarDays size={14} className="text-slate-400" />
              <input type="date" value={localInicio} onChange={(e) => setLocalInicio(e.target.value)} className="text-xs font-bold text-slate-700 outline-none bg-transparent cursor-pointer" />
            </div>
          </div>
          <div className="w-[2px] h-8 bg-slate-200"></div>
          <div className="flex flex-col px-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hasta</label>
            <div className="flex items-center gap-2">
              <CalendarDays size={14} className="text-slate-400" />
              <input type="date" value={localFin} onChange={(e) => setLocalFin(e.target.value)} className="text-xs font-bold text-slate-700 outline-none bg-transparent cursor-pointer" />
            </div>
          </div>
          
          <div className="w-[2px] h-8 bg-slate-200 mx-1"></div>
          
          {/* BOTÓN BUSCAR MANUALMENTE */}
          <button onClick={handleBuscar} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors cursor-pointer shadow-sm flex items-center justify-center" title="Buscar por Fecha">
            <Search size={16} />
          </button>
          
          {/* BOTÓN LIMPIAR FECHAS */}
          <button onClick={limpiarFiltros} className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg transition-colors cursor-pointer shadow-sm flex items-center justify-center border-2 border-slate-200" title="Restaurar Fechas">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};