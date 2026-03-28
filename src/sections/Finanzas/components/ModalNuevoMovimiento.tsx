// src/sections/Finanzas/components/ModalNuevoMovimiento.tsx
import React, { useState } from 'react';
import { X, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../db/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sessionId: string;
}

export const ModalNuevoMovimiento: React.FC<Props> = ({ isOpen, onClose, onSuccess, sessionId }) => {
  const [tipo, setTipo] = useState<'INGRESO' | 'EGRESO'>('EGRESO');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [flujo, setFlujo] = useState<'INTERNO' | 'EXTERNO'>('INTERNO'); // <-- Nuevo estado para controlar la caja
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGuardar = async () => {
    if (!monto || !descripcion) return;
    setIsSubmitting(true);

    const movId = Date.now().toString();

    const { error } = await supabase.from('cash_movements').insert([{
      id: movId,
      session_id: sessionId,
      type: tipo,
      amount: Number(monto),
      description: descripcion.toUpperCase(),
      payment_type: metodoPago,
      flujo: flujo, // <-- Guardamos si es INTERNO o EXTERNO
      created_at: new Date().toISOString(),
      is_synced: '1'
    }]);

    setIsSubmitting(false);

    if (error) {
      alert("Error al guardar movimiento: " + error.message);
    } else {
      setMonto('');
      setDescripcion('');
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1E293B]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-mono">
      <div className="bg-white border-2 border-[#1E293B] shadow-[8px_8px_0_0_#1E293B] w-full max-w-md flex flex-col rounded-none animate-fade-in">
        
        <div className="bg-[#3B82F6] p-4 border-b-2 border-[#1E293B] flex justify-between items-center text-white">
          <h2 className="font-black uppercase tracking-widest flex items-center gap-2 text-sm">
            <ArrowRightLeft size={18} /> Registrar Movimiento
          </h2>
          <button onClick={onClose} className="hover:text-[#1E293B] transition-colors cursor-pointer">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          
          {/* NUEVO SELECTOR DE FLUJO (INTERNO / EXTERNO) */}
          <div className="flex bg-[#F8FAFC] border-2 border-[#1E293B] p-1 rounded-none">
            <button onClick={() => setFlujo('INTERNO')} className={`flex-1 py-2 text-[10px] font-black uppercase transition-colors rounded-none cursor-pointer ${flujo === 'INTERNO' ? 'bg-[#1E293B] text-white shadow-sm' : 'text-[#64748B] hover:bg-[#E2E8F0]'}`}>
              Caja Interna (Negocio)
            </button>
            <button onClick={() => setFlujo('EXTERNO')} className={`flex-1 py-2 text-[10px] font-black uppercase transition-colors rounded-none cursor-pointer ${flujo === 'EXTERNO' ? 'bg-[#1E293B] text-white shadow-sm' : 'text-[#64748B] hover:bg-[#E2E8F0]'}`}>
              Caja Externa (Personal)
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setTipo('INGRESO')} className={`flex-1 py-2 text-xs font-black uppercase border-2 transition-colors rounded-none cursor-pointer ${tipo === 'INGRESO' ? 'bg-[#10B981] border-[#10B981] text-white' : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#10B981]'}`}>
              Ingreso Extra
            </button>
            <button onClick={() => setTipo('EGRESO')} className={`flex-1 py-2 text-xs font-black uppercase border-2 transition-colors rounded-none cursor-pointer ${tipo === 'EGRESO' ? 'bg-[#EF4444] border-[#EF4444] text-white' : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#EF4444]'}`}>
              Gasto / Retiro
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">Monto (S/)</label>
            <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" className="w-full bg-[#F8FAFC] border-2 border-[#1E293B] p-2 text-lg font-black outline-none focus:border-[#3B82F6] rounded-none"/>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">Motivo / Descripción</label>
            <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej. Pago a proveedor, Pasajes..." className="w-full bg-[#F8FAFC] border-2 border-[#1E293B] p-2 text-xs font-black uppercase outline-none focus:border-[#3B82F6] rounded-none"/>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">Método</label>
            <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="w-full bg-[#F8FAFC] border-2 border-[#1E293B] p-2 text-xs font-black uppercase outline-none focus:border-[#3B82F6] rounded-none cursor-pointer">
              <option value="EFECTIVO">EFECTIVO</option>
              <option value="YAPE">YAPE</option>
              <option value="TARJETA">TARJETA / PLIN</option>
            </select>
          </div>
        </div>

        <div className="p-4 bg-[#F8FAFC] border-t-2 border-[#1E293B]">
          <button onClick={handleGuardar} disabled={!monto || !descripcion || isSubmitting} className="w-full bg-[#1E293B] text-white p-3 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#3B82F6] transition-colors disabled:opacity-50 border-2 border-[#1E293B] shadow-[4px_4px_0_0_#1E293B] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] cursor-pointer rounded-none">
            {isSubmitting ? 'Guardando...' : <><CheckCircle2 size={18} /> Confirmar Movimiento</>}
          </button>
        </div>

      </div>
    </div>
  );
};