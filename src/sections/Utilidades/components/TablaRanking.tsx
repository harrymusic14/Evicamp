// src/sections/Utilidades/components/TablaRanking.tsx
import React from 'react';
import { Trophy } from 'lucide-react';

interface Props {
  titulo: string;
  items: { nombre: string; cantidad: number; total: number }[];
  color: string;
}

export const TablaRanking: React.FC<Props> = ({ titulo, items, color }) => {
  const maxTotal = Math.max(...items.map(i => i.total), 1);

  return (
    <div className="flex-1 bg-white border-2 border-slate-200 shadow-sm flex flex-col min-w-[300px] max-h-[220px] overflow-hidden rounded-xl font-sans">
      <div className={`p-4 border-b-2 border-slate-200 flex items-center gap-2 bg-slate-50 ${color}`}>
        <Trophy size={18} />
        <h3 className="font-bold uppercase tracking-wider text-xs">{titulo}</h3>
      </div>
      
      <div className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
        {items.length === 0 ? (
          <p className="text-center text-slate-400 font-medium text-xs uppercase py-8">No hay datos</p>
        ) : (
          items.map((item, index) => {
            const porcentaje = (item.total / maxTotal) * 100;
            const barColorClass = color.includes('blue') ? 'bg-blue-500' : color.includes('emerald') ? 'bg-emerald-500' : 'bg-amber-500';

            return (
              <div key={index} className="flex flex-col gap-1">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-semibold text-slate-700 uppercase truncate pr-2">
                    {index + 1}. {item.nombre}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    S/ {item.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColorClass}`} style={{ width: `${porcentaje}%` }}></div>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 w-12 text-right">
                    {item.cantidad} unds
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};