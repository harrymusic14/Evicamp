// src/sections/Reportes/components/TablaTickets.tsx
import React, { useState, useEffect } from 'react';
import { RotateCcw, Trash2, Receipt, ChevronLeft, ChevronRight, Eye, X } from 'lucide-react';
import { supabase } from '../../../db/supabase'; 
import type { TicketVenta } from '../types';

interface Props {
  tickets: TicketVenta[];
  onAnular: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TablaTickets: React.FC<Props> = ({ tickets, onAnular, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [ticketSeleccionado, setTicketSeleccionado] = useState<string | null>(null);
  const [detallesTicket, setDetallesTicket] = useState<any[]>([]);
  const [isLoadingDetalles, setIsLoadingDetalles] = useState(false);
  
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [tickets.length]);

  const totalPages = Math.max(1, Math.ceil(tickets.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentTickets = tickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const verDetalles = async (id: string) => {
    setTicketSeleccionado(id);
    setIsLoadingDetalles(true);

    if (id.startsWith('ERR-')) {
      setDetallesTicket([]);
      setIsLoadingDetalles(false);
      return;
    }

    const { data, error } = await supabase
      .from('sale_details')
      .select('product_name, quantity, price_at_moment, subtotal')
      .eq('sale_id', id);
    
    if (!error && data) {
      setDetallesTicket(data);
    } else {
      setDetallesTicket([]);
    }
    setIsLoadingDetalles(false);
  };

  const PaginacionControles = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="p-3 border-y-2 border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center shrink-0">
        <p className="text-[10px] font-black text-[#64748B] uppercase">
          Mostrando {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, tickets.length)} de {tickets.length}
        </p>
        <div className="flex gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border-2 border-[#E2E8F0] bg-[#FFFFFF] text-[#1E293B] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F8FAFC] cursor-pointer rounded-none">
            <ChevronLeft size={16} />
          </button>
          <span className="flex items-center justify-center px-4 border-2 border-[#E2E8F0] bg-[#FFFFFF] text-xs font-black text-[#1E293B] rounded-none">
            Pág {currentPage} / {totalPages}
          </span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border-2 border-[#E2E8F0] bg-[#FFFFFF] text-[#1E293B] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F8FAFC] cursor-pointer rounded-none">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-[#FFFFFF] border-2 border-[#E2E8F0] shadow-[8px_8px_0_0_#E2E8F0] flex flex-col font-mono rounded-none">
        
        <PaginacionControles />

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-[#1E293B] text-[#FFFFFF]">
              <tr>
                <th className="p-4 text-xs font-black tracking-widest uppercase border-b-2 border-[#1E293B]">Fecha y Hora</th>
                <th className="p-4 text-xs font-black tracking-widest uppercase border-b-2 border-[#1E293B]">Nro. Ticket</th>
                <th className="p-4 text-xs font-black tracking-widest uppercase border-b-2 border-[#1E293B]">Pago</th>
                <th className="p-4 text-xs font-black tracking-widest uppercase border-b-2 border-[#1E293B]">Estado</th>
                <th className="p-4 text-xs font-black tracking-widest uppercase border-b-2 border-[#1E293B] text-right">Pagado</th>
                <th className="p-4 text-xs font-black tracking-widest uppercase border-b-2 border-[#1E293B] text-right">Deuda</th>
                <th className="p-4 text-xs font-black tracking-widest uppercase border-b-2 border-[#1E293B] text-right">Total</th>
                <th className="p-4 text-xs font-black tracking-widest uppercase border-b-2 border-[#1E293B] text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#64748B] font-bold text-xs uppercase bg-[#FFFFFF]">
                    No hay tickets registrados en este mes.
                  </td>
                </tr>
              ) : (
                currentTickets.map((t) => (
                  <tr key={t.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-4 text-xs font-bold text-[#64748B]">
                      {new Date(t.created_at).toLocaleString('es-PE')}
                    </td>
                    <td className="p-4 text-sm font-black text-[#1E293B] uppercase">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Receipt size={14} className="text-[#64748B]" />
                          #{t.id.slice(-6)}
                        </div>
                        {t.es_fiado && t.cliente_nombre && (
                          <span className="text-[10px] text-[#64748B] font-bold tracking-widest">[{t.cliente_nombre}]</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-xs font-bold text-[#64748B] uppercase">{t.metodo_pago}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[10px] font-black tracking-wider border rounded-none ${
                        t.estado === 'ANULADO' ? 'bg-[#FFFFFF] text-[#EF4444] border-[#EF4444]' : 'bg-[#FFFFFF] text-[#1E293B] border-[#1E293B]'
                      }`}>
                        {t.estado}
                      </span>
                    </td>
                    {/* COLUMNA PAGADO */}
                    <td className="p-4 text-right text-base font-bold text-[#64748B]">
                      S/ {Number(t.monto_pagado || 0).toFixed(2)}
                    </td>
                    {/* COLUMNA DEUDA */}
                    <td className="p-4 text-right text-lg font-black text-[#EF4444]">
                      {(t.monto_deuda && t.monto_deuda > 0) ? `S/ ${Number(t.monto_deuda).toFixed(2)}` : '-'}
                    </td>
                    <td className="p-4 text-right text-lg font-black text-[#1E293B]">
                      S/ {Number(t.total).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => verDetalles(t.id)} className="p-2 bg-[#FFFFFF] text-[#1E293B] border border-[#E2E8F0] hover:border-[#1E293B] transition-colors cursor-pointer rounded-none" title="Ver Productos">
                          <Eye size={16} />
                        </button>
                        {t.estado !== 'ANULADO' && (
                          <button onClick={() => onAnular(t.id)} className="p-2 bg-[#FFFFFF] text-[#64748B] border border-[#E2E8F0] hover:border-[#F59E0B] hover:text-[#F59E0B] transition-colors cursor-pointer rounded-none" title="Anular / Devolver">
                            <RotateCcw size={16} />
                          </button>
                        )}
                        <button onClick={() => onDelete(t.id)} className="p-2 bg-[#FFFFFF] text-[#64748B] border border-[#E2E8F0] hover:border-[#EF4444] hover:text-[#EF4444] transition-colors cursor-pointer rounded-none" title="Eliminar Permanente">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <PaginacionControles />

      </div>

      {/* VENTANA FLOTANTE (MODAL PLATO TÉCNICO) */}
      {ticketSeleccionado && (
        <div className="fixed inset-0 bg-[#1E293B]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFFFF] border-2 border-[#1E293B] shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] rounded-none w-full max-w-lg flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center border-b-2 border-[#1E293B] bg-[#F8FAFC] p-4 shrink-0">
              <div>
                <p className="text-[#64748B] text-[10px] font-mono tracking-widest uppercase mb-1">Inspección Operativa</p>
                <h2 className="text-[#1E293B] font-black text-lg uppercase tracking-widest">TICKET #{ticketSeleccionado.slice(-6)}</h2>
              </div>
              <button onClick={() => setTicketSeleccionado(null)} className="p-2 bg-[#FFFFFF] border border-[#1E293B] text-[#1E293B] hover:bg-[#1E293B] hover:text-[#FFFFFF] transition-colors rounded-none">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#FFFFFF]">
              {isLoadingDetalles ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-[#1E293B] border-t-transparent animate-spin rounded-full mb-3"></div>
                  <p className="text-[#64748B] text-xs font-black uppercase tracking-widest">Descargando registros...</p>
                </div>
              ) : detallesTicket.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-[#E2E8F0]">
                  <p className="text-[#EF4444] text-xs font-black uppercase tracking-widest">No hay productos registrados para este ticket.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#1E293B] text-[#FFFFFF]">
                    <tr>
                      <th className="p-2 text-[9px] font-black tracking-widest uppercase">Cant/Kg</th>
                      <th className="p-2 text-[9px] font-black tracking-widest uppercase">Producto</th>
                      <th className="p-2 text-[9px] font-black tracking-widest uppercase text-right">P. Unit</th>
                      <th className="p-2 text-[9px] font-black tracking-widest uppercase text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detallesTicket.map((item, index) => (
                      <tr key={index} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                        <td className="p-2 text-xs font-black text-[#1E293B]">{Number(item.quantity).toString()}</td>
                        <td className="p-2 text-xs font-bold text-[#64748B] uppercase">{item.product_name}</td>
                        <td className="p-2 text-xs font-mono text-[#64748B] text-right">S/ {Number(item.price_at_moment).toFixed(2)}</td>
                        <td className="p-2 text-sm font-black font-mono text-[#1E293B] text-right">S/ {Number(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="border-t-2 border-[#1E293B] p-4 bg-[#F8FAFC] flex justify-between items-center shrink-0">
               <span className="text-[#64748B] text-xs font-black uppercase tracking-widest">Total Facturado</span>
               <span className="text-[#1E293B] text-xl font-black font-mono">
                 S/ {detallesTicket.reduce((acc, item) => acc + Number(item.subtotal), 0).toFixed(2)}
               </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};