import React from 'react';
import { AlertTriangle, Plus } from 'lucide-react';

interface Props {
  onNuevaMerma: () => void;
}

export const HeaderMermas: React.FC<Props> = ({ onNuevaMerma }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 bg-white border-b-2 border-[#1E293B] shrink-0">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#FEF2F2] border-2 border-[#EF4444] flex items-center justify-center shadow-[4px_4px_0_0_#EF4444] rounded-none">
          <AlertTriangle size={24} className="text-[#EF4444]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#1E293B] uppercase tracking-widest">
            Control de Mermas
          </h1>
          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-[0.2em] mt-1">
            Registro de pérdidas, vencimientos y uso interno
          </p>
        </div>
      </div>

      <button 
        onClick={onNuevaMerma}
        className="bg-[#EF4444] text-white px-6 py-3 border-2 border-[#1E293B] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#1E293B] hover:text-[#EF4444] transition-all cursor-pointer rounded-none shadow-[4px_4px_0_0_#1E293B] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
      >
        <Plus size={16} /> Registrar Merma
      </button>
    </div>
  );
};