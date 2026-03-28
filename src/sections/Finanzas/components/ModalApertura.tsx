// src/sections/Finanzas/components/ModalApertura.tsx
import React, { useState } from 'react';
import { X, Wallet, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../db/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModalApertura: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [monto, setMonto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleApertura = async () => {
    if (!monto || Number(monto) < 0) return;
    setIsSubmitting(true);

    const sessionId = Date.now().toString();

    const { error } = await supabase.from('cash_sessions').insert([{
      id: sessionId,
      opening_balance: Number(monto),
      status: 'OPEN',
      opened_at: new Date().toISOString(),
      is_synced: '1'
    }]);

    setIsSubmitting(false);

    if (error) {
      alert("Error al aperturar caja: " + error.message);
    } else {
      setMonto('');
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1E293B]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-mono">
      <div className="bg-white border-2 border-[#1E293B] shadow-[8px_8px_0_0_#1E293B] w-full max-w-sm flex flex-col rounded-none animate-fade-in">
        
        <div className="bg-[#10B981] p-4 border-b-2 border-[#1E293B] flex justify-between items-center text-[#1E293B]">
          <h2 className="font-black uppercase tracking-widest flex items-center gap-2 text-sm">
            <Wallet size={18} /> Aperturar Caja
          </h2>
          <button onClick={onClose} className="hover:text-white transition-colors cursor-pointer">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest text-center">
            Ingresa el dinero físico (sencillo) con el que inicia la caja hoy.
          </p>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">Monto Inicial (S/)</label>
            <input 
              type="number" 
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Ej. 100.00"
              className="w-full bg-[#F8FAFC] border-2 border-[#1E293B] p-3 text-2xl font-black text-center outline-none focus:border-[#10B981] focus:bg-white transition-colors rounded-none"
              autoFocus
            />
          </div>
        </div>

        <div className="p-4 bg-[#F8FAFC] border-t-2 border-[#1E293B]">
          <button 
            onClick={handleApertura}
            disabled={!monto || isSubmitting}
            className="w-full bg-[#1E293B] text-white p-3 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#10B981] hover:text-[#1E293B] transition-colors disabled:opacity-50 border-2 border-[#1E293B] shadow-[4px_4px_0_0_#1E293B] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] cursor-pointer"
          >
            {isSubmitting ? 'Abriendo...' : <><CheckCircle2 size={18} /> Confirmar Apertura</>}
          </button>
        </div>

      </div>
    </div>
  );
};