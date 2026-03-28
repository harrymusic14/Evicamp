import React, { useState, useEffect } from 'react';
import { X, Banknote, CreditCard, Smartphone, Calculator } from 'lucide-react';
import { supabase } from '../../../db/supabase';
import type { Fiado } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // Ahora enviamos un objeto con el desglose del pago
  onConfirm: (pagos: { efectivo: number; yape: number; tarjeta: number }) => void;
  fiado: Fiado | null;
}

export const ModalAbono: React.FC<Props> = ({ isOpen, onClose, onConfirm, fiado }) => {
  const [efectivo, setEfectivo] = useState<string>('');
  const [yape, setYape] = useState<string>('');
  const [tarjeta, setTarjeta] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false); // Escudo contra doble clic

  useEffect(() => {
    if (isOpen && fiado) {
      // Por defecto sugerimos pagar todo en efectivo para hacerlo rápido
      setEfectivo(fiado.saldoPendiente.toString());
      setYape('');
      setTarjeta('');
    }
  }, [isOpen, fiado]);

  if (!isOpen || !fiado) return null;

  const valEfectivo = Number(efectivo) || 0;
  const valYape = Number(yape) || 0;
  const valTarjeta = Number(tarjeta) || 0;
  const totalAbono = valEfectivo + valYape + valTarjeta;
  const nuevoSaldo = fiado.saldoPendiente - totalAbono;

  const handleConfirm = async () => {
    if (isSaving) return; // Si ya está guardando, bloquea cualquier otro clic
    if (totalAbono <= 0) return alert('El monto debe ser mayor a 0.');
    if (totalAbono > fiado.saldoPendiente) return alert('El abono supera la deuda.');

    setIsSaving(true); // Activa el escudo inmediatamente
    try {
      // 1. Obtener la sesión activa PRIMERO para que el Reporte lo reconozca
      const { data: session } = await supabase.from('cash_sessions').select('id').eq('status', 'OPEN').single();

      // 2. Insertar el Pago en el historial (Atando el session_id para los Reportes)
      const { error: pagoError } = await supabase.from('debt_payments').insert([{
        id: Date.now(),
        fiado_id: Number(fiado.id),
        customer_id: fiado.clienteId ? Number(fiado.clienteId) : null,
        amount: totalAbono,
        amount_cash: valEfectivo,
        amount_yape: valYape,
        amount_card: valTarjeta,
        payment_type: valEfectivo > 0 ? 'efectivo' : (valYape > 0 ? 'yape' : 'tarjeta'),
        session_id: session ? session.id : null, // 🔥 CLAVE DE INTEGRIDAD PARA REPORTES
        created_at: new Date().toISOString(), // 🕒 INYECCIÓN TÉCNICA: Sello de tiempo exacto para evitar valores NULL
        is_synced: 1
      }]);
      if (pagoError) throw pagoError;

      // 3. DELEGACIÓN DE ARQUITECTURA: La base de datos (Trigger) descontará la deuda automáticamente.
      // Al no enviar una actualización manual desde aquí, evitamos el "choque de datos" que congelaba tu deuda.
      
      // 4. SINCRONIZACIÓN DE CAJA: Finanzas ya suma los pagos desde la tabla 'debt_payments' automáticamente.
      // Al no inyectar un 'cash_movement' duplicado aquí, evitamos que el dinero se doble en tu caja.

      alert('✅ Abono registrado en la base de datos y sumado a la caja actual.');
      onConfirm({ efectivo: valEfectivo, yape: valYape, tarjeta: valTarjeta });
      setIsSaving(false);
    } catch (e: any) {
      alert('Error al registrar abono en BD: ' + e.message);
      setIsSaving(false); // Desbloqueamos si hubo error de internet
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1E293B]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono">
      <div className="bg-white w-full max-w-md border-2 border-[#1E293B] shadow-[8px_8px_0_0_#1E293B] flex flex-col">
        
        {/* HEADER */}
        <div className="bg-[#10B981] text-[#1E293B] px-6 py-4 flex justify-between items-center shrink-0 border-b-2 border-[#1E293B]">
          <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <Calculator size={20} /> Abono Mixto
          </h2>
          <button onClick={onClose} className="hover:text-white transition-colors cursor-pointer"><X size={20} /></button>
        </div>

        {/* BODY */}
        <div className="p-6 bg-[#F8FAFC] flex flex-col gap-4">
          <div className="bg-[#1E293B] text-white p-4 text-center border-2 border-[#1E293B]">
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Saldo Actual de la Deuda</p>
            <p className="text-3xl font-black text-[#EF4444]">S/ {fiado.saldoPendiente.toFixed(2)}</p>
            <p className="text-[10px] font-bold uppercase mt-1">Cliente: {fiado.clienteNombre}</p>
          </div>

          <div className="space-y-3 mt-2">
            <p className="text-[10px] font-black uppercase text-[#64748B] mb-2">Ingresa los montos por método de pago:</p>
            
            {/* EFECTIVO */}
            <div className="flex items-center gap-3 bg-white p-2 border-2 border-[#E2E8F0] focus-within:border-[#10B981] transition-colors">
              <div className="w-8 h-8 bg-[#ECFDF5] flex items-center justify-center text-[#10B981]"><Banknote size={16}/></div>
              <span className="text-xs font-black uppercase flex-1 text-[#1E293B]">Efectivo</span>
              <div className="flex items-center gap-1">
                <span className="text-[#94A3B8] font-bold text-xs">S/</span>
                <input 
                  type="number" 
                  value={efectivo} 
                  onChange={(e) => setEfectivo(e.target.value)}
                  className="w-24 text-right text-sm font-black outline-none text-[#1E293B]"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* YAPE */}
            <div className="flex items-center gap-3 bg-white p-2 border-2 border-[#E2E8F0] focus-within:border-[#8B5CF6] transition-colors">
              <div className="w-8 h-8 bg-[#F5F3FF] flex items-center justify-center text-[#8B5CF6]"><Smartphone size={16}/></div>
              <span className="text-xs font-black uppercase flex-1 text-[#1E293B]">Yape</span>
              <div className="flex items-center gap-1">
                <span className="text-[#94A3B8] font-bold text-xs">S/</span>
                <input 
                  type="number" 
                  value={yape} 
                  onChange={(e) => setYape(e.target.value)}
                  className="w-24 text-right text-sm font-black outline-none text-[#1E293B]"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* TARJETA */}
            <div className="flex items-center gap-3 bg-white p-2 border-2 border-[#E2E8F0] focus-within:border-[#3B82F6] transition-colors">
              <div className="w-8 h-8 bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6]"><CreditCard size={16}/></div>
              <span className="text-xs font-black uppercase flex-1 text-[#1E293B]">Tarjeta</span>
              <div className="flex items-center gap-1">
                <span className="text-[#94A3B8] font-bold text-xs">S/</span>
                <input 
                  type="number" 
                  value={tarjeta} 
                  onChange={(e) => setTarjeta(e.target.value)}
                  className="w-24 text-right text-sm font-black outline-none text-[#1E293B]"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* RESUMEN DEL ABONO */}
          <div className="mt-2 bg-[#FEF2F2] border-2 border-[#EF4444] p-3 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black uppercase text-[#EF4444]">Total a Abonar</p>
              <p className="text-sm font-black text-[#1E293B]">S/ {totalAbono.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-[#EF4444]">Deuda Restante</p>
              <p className="text-lg font-black text-[#EF4444] leading-none">S/ {Math.max(0, nuevoSaldo).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-white border-t-2 border-[#E2E8F0] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-white border-2 border-[#E2E8F0] text-[#64748B] text-[10px] font-black uppercase hover:border-[#1E293B] hover:text-[#1E293B] transition-colors cursor-pointer">Cancelar</button>
          <button 
            onClick={handleConfirm} 
            disabled={isSaving}
            className={`px-6 py-2 border-2 border-[#1E293B] text-[10px] font-black uppercase transition-all shadow-[2px_2px_0_0_#1E293B] ${
              isSaving 
                ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed shadow-none translate-x-[2px] translate-y-[2px]' 
                : 'bg-[#10B981] text-[#1E293B] hover:bg-[#1E293B] hover:text-[#10B981] cursor-pointer hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
            }`}
          >
            {isSaving ? 'Procesando...' : 'Confirmar Abono'}
          </button>
        </div>

      </div>
    </div>
  );
};