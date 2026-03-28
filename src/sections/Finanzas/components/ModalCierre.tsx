// src/sections/Finanzas/components/ModalCierre.tsx
import React, { useState } from 'react';
import { X, Lock, Calculator, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../db/supabase';
import type { CashSession, MetricasCaja } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sessionActiva: CashSession;
  metricas: MetricasCaja;
}

export const ModalCierre: React.FC<Props> = ({ isOpen, onClose, onSuccess, sessionActiva, metricas }) => {
  const [montoReal, setMontoReal] = useState('');
  const [justificacion, setJustificacion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Lógica de cuadre
  const esperado = Number(sessionActiva.opening_balance) + metricas.totalIngresos - metricas.totalEgresos;
  const numReal = Number(montoReal) || 0;
  const diferencia = numReal - esperado;
  const hayDescuadre = montoReal !== '' && diferencia !== 0;

  const handleCierre = async () => {
    if (montoReal === '') return;
    if (hayDescuadre && !justificacion) {
      alert("Debes justificar la diferencia de dinero.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from('cash_sessions').update({
      closing_balance: numReal,
      expected_balance: esperado,
      status: 'CLOSED',
      closed_at: new Date().toISOString(),
      justification: justificacion.toUpperCase() || null
    }).eq('id', sessionActiva.id);

    setIsSubmitting(false);

    if (error) {
      alert("Error al cerrar caja: " + error.message);
    } else {
      alert(`✅ Caja Cerrada Exitosamente.\nDiferencia: S/ ${diferencia.toFixed(2)}`);
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1E293B]/90 backdrop-blur-md flex items-center justify-center z-[9999] p-4 font-mono">
      <div className="bg-white border-2 border-[#1E293B] shadow-[8px_8px_0_0_#1E293B] w-full max-w-lg flex flex-col rounded-none animate-fade-in">
        
        <div className="bg-[#EF4444] p-4 border-b-2 border-[#1E293B] flex justify-between items-center text-white">
          <h2 className="font-black uppercase tracking-widest flex items-center gap-2 text-sm">
            <Lock size={18} /> Arqueo y Cierre de Caja
          </h2>
          <button onClick={onClose} className="hover:text-[#1E293B] transition-colors cursor-pointer">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          
          <div className="bg-[#F8FAFC] border-2 border-[#E2E8F0] p-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-[#64748B]">
              <Calculator size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">El Sistema Espera:</span>
            </div>
            <span className="text-2xl font-black text-[#1E293B]">S/ {esperado.toFixed(2)}</span>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">Efectivo Real en Caja (S/) *</label>
            <input 
              type="number" 
              value={montoReal}
              onChange={(e) => setMontoReal(e.target.value)}
              placeholder="¿Cuánto dinero hay físicamente?"
              className={`w-full p-4 text-2xl font-black text-center outline-none transition-colors border-2 rounded-none ${
                montoReal === '' ? 'bg-[#F8FAFC] border-[#1E293B] focus:border-[#EF4444]' :
                diferencia === 0 ? 'bg-[#ECFDF5] border-[#10B981] text-[#10B981]' : 'bg-[#FEF2F2] border-[#EF4444] text-[#EF4444]'
              }`}
            />
          </div>

          {hayDescuadre && (
            <div className="bg-[#FFFBEB] border-2 border-[#F59E0B] p-4 animate-fade-in space-y-3">
              <div className="flex items-center gap-2 text-[#D97706]">
                <AlertTriangle size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Descuadre Detectado: {diferencia > 0 ? `Sobra S/ ${Math.abs(diferencia).toFixed(2)}` : `Falta S/ ${Math.abs(diferencia).toFixed(2)}`}
                </span>
              </div>
              <input 
                type="text" 
                value={justificacion}
                onChange={(e) => setJustificacion(e.target.value)}
                placeholder="Explica el motivo de la diferencia..."
                className="w-full bg-white border border-[#FCD34D] p-2 text-xs font-black uppercase outline-none focus:border-[#F59E0B] rounded-none"
              />
            </div>
          )}

        </div>

        <div className="p-4 bg-[#F8FAFC] border-t-2 border-[#1E293B]">
          <button 
            onClick={handleCierre}
            disabled={montoReal === '' || isSubmitting}
            className="w-full bg-[#1E293B] text-white p-3 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#EF4444] transition-colors disabled:opacity-50 border-2 border-[#1E293B] shadow-[4px_4px_0_0_#1E293B] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] cursor-pointer rounded-none"
          >
            {isSubmitting ? 'Cerrando Bóveda...' : <><Lock size={18} /> Finalizar Día y Cerrar</>}
          </button>
        </div>

      </div>
    </div>
  );
};