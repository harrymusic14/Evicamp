import React, { useState, useEffect } from 'react';
import { X, Scale, Banknote, Calculator, ShoppingCart } from 'lucide-react';
import type { Product } from '../../Inventario/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (weight: number) => void;
}

export const ModalBalanza: React.FC<Props> = ({ isOpen, onClose, product, onConfirm }) => {
  const [montoSoles, setMontoSoles] = useState<string>('');
  const [pesoKg, setPesoKg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setMontoSoles('');
      setPesoKg('');
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const precioUnitario = product.price;

  const handleMontoChange = (val: string) => {
    setMontoSoles(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const calcPeso = num / precioUnitario;
      setPesoKg(calcPeso.toFixed(4));
    } else {
      setPesoKg('');
    }
  };

  const handlePesoChange = (val: string) => {
    setPesoKg(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const calcMonto = num * precioUnitario;
      setMontoSoles(calcMonto.toFixed(2));
    } else {
      setMontoSoles('');
    }
  };

  const handleConfirm = () => {
    const peso = parseFloat(pesoKg);
    if (!isNaN(peso) && peso > 0) {
      onConfirm(peso);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1E293B]/90 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 font-mono">
      <div className="bg-white w-full max-w-md border-2 border-[#1E293B] shadow-[8px_8px_0_0_#1E293B] flex flex-col overflow-hidden">
        
        {/* Cabecera */}
        <div className="bg-[#3B82F6] text-white px-4 py-3 flex items-center justify-between border-b-2 border-[#1E293B]">
          <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <Scale size={20} /> Balanza Digital
          </h2>
          <button onClick={onClose} className="hover:text-[#1E293B] transition-colors cursor-pointer">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-[#F8FAFC] border-2 border-[#E2E8F0] p-4">
            <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-1">Cálculo de Peso</p>
            <h3 className="text-lg font-black text-[#1E293B] uppercase mb-2 leading-tight">{product.name}</h3>
            <div className="flex justify-between items-center pt-2 border-t border-dashed border-[#E2E8F0]">
              <span className="text-xs font-bold text-[#64748B] uppercase">Precio x KG:</span>
              <span className="text-xl font-black text-[#10B981]">S/ {precioUnitario.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-[#1E293B] uppercase tracking-widest flex items-center gap-2">
                <Banknote size={16} className="text-[#10B981]" /> ¿Cuánto dinero quiere llevar? (S/)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  autoFocus
                  value={montoSoles}
                  onChange={(e) => handleMontoChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && parseFloat(pesoKg) > 0 && handleConfirm()}
                  className="w-full h-14 bg-white border-2 border-[#1E293B] px-4 text-2xl font-black text-[#1E293B] outline-none focus:bg-[#ECFDF5]"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex justify-center py-2 relative">
               <div className="h-[2px] w-full bg-[#E2E8F0] absolute top-1/2 -translate-y-1/2"></div>
               <div className="bg-white border-2 border-[#E2E8F0] p-2 relative z-10">
                 <Calculator size={16} className="text-[#94A3B8]" />
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-[#1E293B] uppercase tracking-widest flex items-center gap-2">
                <Scale size={16} className="text-[#3B82F6]" /> ¿Cuántos Kilos va a pesar? (KG)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={pesoKg}
                  onChange={(e) => handlePesoChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && parseFloat(pesoKg) > 0 && handleConfirm()}
                  className="w-full h-14 bg-white border-2 border-[#1E293B] px-4 text-2xl font-black text-[#3B82F6] outline-none focus:bg-[#EFF6FF]"
                  placeholder="0.000"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleConfirm}
            disabled={!pesoKg || parseFloat(pesoKg) <= 0}
            className="w-full h-16 bg-[#1E293B] text-white flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] shadow-[4px_4px_0_0_#10B981] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 cursor-pointer"
          >
            <ShoppingCart size={24} /> Agregar al Carrito
          </button>
        </div>
      </div>
    </div>
  );
};