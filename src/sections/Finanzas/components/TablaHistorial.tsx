// src/sections/Finanzas/components/TablaHistorial.tsx
import React from 'react';
import { ReceiptText, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { ModalDetalleCaja } from './ModalDetalleCaja';
import type { CashSession } from '../types';

interface Props {
  historialCajas: CashSession[];
  paginaActual: number;
  totalPaginas: number;
  onPageChange: (page: number) => void;
}

export const TablaHistorial: React.FC<Props> = ({ historialCajas, paginaActual, totalPaginas, onPageChange }) => {
  const [selectedCaja, setSelectedCaja] = React.useState<CashSession | null>(null);

  // EXTRAEMOS LA PAGINACIÓN PARA USARLA ARRIBA Y ABAJO SIN REPETIR CÓDIGO
  const ControlesPaginacion = () => (
    <div className="bg-[#FFFFFF] border-b-2 border-[#1E293B] p-4 flex justify-between items-center shrink-0 rounded-none">
      <button
        disabled={paginaActual === 1}
        onClick={() => onPageChange(paginaActual - 1)}
        className="flex items-center gap-2 bg-[#FFFFFF] border-2 border-[#1E293B] text-[#1E293B] px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-[#1E293B] hover:text-[#FFFFFF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
      >
        <ChevronLeft size={16} /> Anterior
      </button>
      <div className="text-xs font-black text-[#1E293B] tracking-widest uppercase">
        Página <span className="text-[#3B82F6]">{paginaActual}</span> de {totalPaginas || 1}
      </div>
      <button
        disabled={paginaActual >= totalPaginas}
        onClick={() => onPageChange(paginaActual + 1)}
        className="flex items-center gap-2 bg-[#FFFFFF] border-2 border-[#1E293B] text-[#1E293B] px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-[#1E293B] hover:text-[#FFFFFF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
      >
        Siguiente <ChevronRight size={16} />
      </button>
    </div>
  );

  return (
    // ELIMINADO: flex-1, overflow-hidden, h-full para permitir que crezca completo sin scroll interno
    <div className="bg-[#FFFFFF] border-2 border-[#1E293B] shadow-[8px_8px_0_0_#1E293B] flex flex-col animate-fade-in rounded-none mb-8">
      
      {/* HEADER */}
      <div className="bg-[#1E293B] text-[#FFFFFF] p-4 flex justify-between items-center shrink-0 rounded-none">
        <h2 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
          <ReceiptText size={18} /> Historial de Cajas Cerradas
        </h2>
        <span className="text-[#64748B] text-[10px] font-bold uppercase tracking-widest">
          Mostrando {historialCajas.length} registros
        </span>
      </div>

      {/* PAGINACIÓN SUPERIOR */}
      <ControlesPaginacion />
      
      {/* TABLA SIN SCROLL INTERNO (Se eliminó overflow-auto custom-scrollbar) */}
      <div className="w-full bg-[#FFFFFF] overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#FFFFFF] text-[#1E293B] border-b-2 border-[#1E293B]">
            <tr>
              <th className="p-4 text-[10px] font-black tracking-widest uppercase border-r-2 border-[#E2E8F0] bg-[#FFFFFF]">Apertura</th>
              <th className="p-4 text-[10px] font-black tracking-widest uppercase border-r-2 border-[#E2E8F0] bg-[#FFFFFF]">Cierre</th>
              <th className="p-4 text-[10px] font-black tracking-widest uppercase border-r-2 border-[#E2E8F0] text-center bg-[#FFFFFF]">Fondo Inicial</th>
              <th className="p-4 text-[10px] font-black tracking-widest uppercase border-r-2 border-[#E2E8F0] text-center bg-[#FFFFFF]">Físico Registrado</th>
              <th className="p-4 text-[10px] font-black tracking-widest uppercase border-r-2 border-[#E2E8F0] text-center bg-[#FFFFFF]">Diferencia</th>
              <th className="p-4 text-[10px] font-black tracking-widest uppercase text-center bg-[#FFFFFF]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {historialCajas.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#64748B] text-xs font-bold uppercase tracking-widest border-b-2 border-[#E2E8F0]">
                  No se encontraron registros para estas fechas.
                </td>
              </tr>
            ) : (
              historialCajas.map((caja) => {
                const esperado = Number(caja.expected_balance || 0);
                const real = Number(caja.closing_balance || 0);
                const diferencia = real - esperado;
                
                return (
                  <tr key={caja.id} className="border-b-2 border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-4 text-xs font-bold text-[#64748B] border-r-2 border-[#E2E8F0]">
                      {new Date(caja.opened_at).toLocaleString('es-PE')}
                    </td>
                    <td className="p-4 text-xs font-bold text-[#64748B] border-r-2 border-[#E2E8F0]">
                      {caja.closed_at ? new Date(caja.closed_at).toLocaleString('es-PE') : '---'}
                    </td>
                    <td className="p-4 text-sm font-black text-[#1E293B] text-center border-r-2 border-[#E2E8F0]">
                      S/ {Number(caja.opening_balance).toFixed(2)}
                    </td>
                    <td className="p-4 text-sm font-black text-[#10B981] text-center border-r-2 border-[#E2E8F0]">
                      S/ {real.toFixed(2)}
                    </td>
                    <td className={`p-4 text-sm font-black text-center border-r-2 border-[#E2E8F0] ${diferencia < 0 ? 'text-[#EF4444]' : (diferencia > 0 ? 'text-[#3B82F6]' : 'text-[#64748B]')}`}>
                      {diferencia !== 0 ? (diferencia > 0 ? `+ S/ ${diferencia.toFixed(2)}` : `- S/ ${Math.abs(diferencia).toFixed(2)}`) : 'CUADRE EXACTO'}
                    </td>
                    <td className="p-4 text-center flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setSelectedCaja(caja)}
                        className="bg-[#FFFFFF] border-2 border-[#1E293B] p-2 text-[#1E293B] hover:bg-[#1E293B] hover:text-[#FFFFFF] transition-colors cursor-pointer shadow-[2px_2px_0_0_#1E293B] active:translate-y-[2px] active:shadow-none rounded-none"
                        title="Ver Detalles de la Caja"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN INFERIOR (Reutilizamos la misma función de arriba, cambiando borde) */}
      <div className="border-t-2 border-[#1E293B]">
        <ControlesPaginacion />
      </div>

      <ModalDetalleCaja 
        isOpen={!!selectedCaja}
        onClose={() => setSelectedCaja(null)}
        caja={selectedCaja}
      />
    </div>
  );
};