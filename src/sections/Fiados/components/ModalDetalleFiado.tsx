import React from 'react';
import { X, ShoppingCart } from 'lucide-react';
import type { Fiado } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  fiado: Fiado | null;
}

export const ModalDetalleFiado: React.FC<Props> = ({ isOpen, onClose, fiado }) => {
  if (!isOpen || !fiado) return null;

  return (
    <div className="fixed inset-0 bg-[#1E293B]/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 font-mono">
      <div className="bg-white w-full max-w-md border-2 border-[#1E293B] shadow-[8px_8px_0_0_#1E293B] flex flex-col max-h-[80vh]">
        
        {/* HEADER */}
        <div className="bg-[#1E293B] text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <ShoppingCart className="text-[#3B82F6]" size={20} />
            <h2 className="text-sm font-black uppercase tracking-widest text-white">
              Detalle de Productos
            </h2>
          </div>
          <button onClick={onClose} className="hover:text-[#EF4444] transition-colors cursor-pointer"><X size={20} /></button>
        </div>

        {/* BODY */}
        <div className="p-6 flex flex-col gap-4 overflow-hidden flex-1">
          <div className="shrink-0 border-b-2 border-[#E2E8F0] pb-4">
            <p className="text-xs font-black text-[#64748B] uppercase">Cliente</p>
            <p className="text-lg font-black text-[#1E293B] uppercase leading-tight">{fiado.clienteNombre}</p>
            <p className="text-[10px] font-bold text-[#64748B] mt-1">
              Fecha Emisión: {new Date(fiado.fechaEmision).toLocaleDateString()}
            </p>
          </div>

          {/* LISTA DE PRODUCTOS (Sin barra de scroll visible) */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {!fiado.detalles || fiado.detalles.length === 0 ? (
              <p className="text-center text-[#94A3B8] font-bold text-xs py-4 uppercase">No hay detalles registrados.</p>
            ) : (
              fiado.detalles.map(d => (
                <div key={d.productoId} className="flex justify-between items-center border-2 border-[#E2E8F0] p-3 hover:border-[#3B82F6] transition-colors bg-[#F8FAFC]">
                  <div className="flex-1">
                    <p className="text-xs font-black text-[#1E293B] uppercase">{d.name}</p>
                    <p className="text-[10px] font-bold text-[#64748B]">{d.qty} unid. x S/ {d.price.toFixed(2)}</p>
                  </div>
                  <span className="text-sm font-black text-[#1E293B]">S/ {Number(d.subtotal || 0).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>

          {/* FOOTER - TOTAL */}
          <div className="shrink-0 border-t-2 border-[#E2E8F0] pt-4 mt-2 flex justify-between items-center">
            <span className="text-sm font-black uppercase text-[#64748B]">Monto Total:</span>
            <span className="text-xl font-black text-[#1E293B]">S/ {fiado.montoOriginal.toFixed(2)}</span>
          </div>
          
          <button 
            onClick={onClose} 
            className="w-full mt-2 py-3 bg-[#1E293B] text-white border-2 border-[#1E293B] text-xs font-black uppercase hover:bg-[#3B82F6] hover:border-[#3B82F6] transition-colors cursor-pointer shadow-[4px_4px_0_0_#1E293B] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
          >
            Cerrar Detalles
          </button>
        </div>

      </div>
    </div>
  );
};