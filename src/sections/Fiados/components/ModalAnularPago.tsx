import React from 'react';
import { X, RotateCcw, Trash2 } from 'lucide-react';
import type { Fiado } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  fiado: Fiado | null;
  onAnularPago: (pagoId: string, monto: number) => void;
}

export const ModalAnularPago: React.FC<Props> = ({ isOpen, onClose, fiado, onAnularPago }) => {
  if (!isOpen || !fiado) return null;

  return (
    <div className="fixed inset-0 bg-[#1E293B]/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 font-mono">
      <div className="bg-white w-full max-w-md border-2 border-[#1E293B] shadow-[8px_8px_0_0_#1E293B] flex flex-col max-h-[80vh]">
        
        {/* HEADER */}
        <div className="bg-[#1E293B] text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <RotateCcw className="text-[#F59E0B]" size={20} />
            <h2 className="text-sm font-black uppercase tracking-widest text-white">
              Historial de Pagos
            </h2>
          </div>
          <button onClick={onClose} className="hover:text-[#EF4444] transition-colors cursor-pointer"><X size={20} /></button>
        </div>

        {/* BODY */}
        <div className="p-6 flex flex-col gap-4 overflow-hidden flex-1">
          <div className="shrink-0 border-b-2 border-[#E2E8F0] pb-4 text-center">
            <p className="text-xs font-black text-[#64748B] uppercase">Cliente</p>
            <p className="text-lg font-black text-[#1E293B] uppercase leading-tight">{fiado.clienteNombre}</p>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {!fiado.pagos || fiado.pagos.length === 0 ? (
              <p className="text-center text-[#94A3B8] font-bold text-xs py-4 uppercase">No hay pagos registrados.</p>
            ) : (
              fiado.pagos.map(pago => (
                <div key={pago.id} className="flex justify-between items-center border-2 border-[#E2E8F0] p-3 hover:border-[#EF4444] transition-colors bg-[#F8FAFC] group">
                  <div className="flex-1">
                    <p className="text-xs font-black text-[#1E293B] uppercase">Abono {pago.metodo}</p>
                    <p className="text-[10px] font-bold text-[#64748B]">{new Date(pago.fecha).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-[#10B981]">S/ {pago.monto.toFixed(2)}</span>
                    <button 
                      onClick={() => onAnularPago(pago.id, pago.monto)} 
                      className="p-2 bg-white text-[#94A3B8] border-2 border-[#E2E8F0] group-hover:border-[#EF4444] group-hover:text-[#EF4444] transition-colors cursor-pointer"
                      title="Eliminar este pago"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};