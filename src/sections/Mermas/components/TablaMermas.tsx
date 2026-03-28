import React, { useState } from 'react';
import { Layers, ChevronLeft, ChevronRight, Package, Edit, Trash2 } from 'lucide-react';
import type { Merma } from '../types';

interface Props {
  mermas: Merma[];
  onEdit?: (merma: Merma) => void;
  onDelete?: (merma: Merma) => void;
}

export const TablaMermas: React.FC<Props> = ({ mermas, onEdit, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const totalPages = Math.ceil(mermas.length / ITEMS_PER_PAGE);
  const paginatedData = mermas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const renderPagination = (position: 'top' | 'bottom') => {
    if (totalPages <= 0) return null;
    return (
      <div className={`${position === 'top' ? 'border-b' : 'border-t'} border-[#E2E8F0] bg-[#FFFFFF] p-4 flex items-center justify-between shrink-0 rounded-none`}>
        <span className="text-xs font-black text-[#64748B] uppercase tracking-widest">
          Página {currentPage} de {totalPages}
        </span>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center bg-[#FFFFFF] border border-[#E2E8F0] text-[#1E293B] hover:bg-[#1E293B] hover:text-[#FFFFFF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-none cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center bg-[#FFFFFF] border border-[#E2E8F0] text-[#1E293B] hover:bg-[#1E293B] hover:text-[#FFFFFF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-none cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="border border-[#E2E8F0] flex-1 flex flex-col bg-[#FFFFFF] relative w-full rounded-none">
      
      {renderPagination('top')}

      {/* CABECERA */}
      <div className="grid grid-cols-12 gap-3 bg-[#1E293B] text-[#FFFFFF] p-4 text-xs md:text-sm font-black uppercase tracking-[0.1em] shrink-0 rounded-none">
        <div className="col-span-2 min-w-0 truncate">Fecha / Usu.</div>
        <div className="col-span-2 min-w-0 truncate">Producto</div>
        <div className="col-span-2 min-w-0 truncate">Detalle</div>
        <div className="col-span-2 min-w-0 truncate">Motivo</div>
        <div className="col-span-1 min-w-0 text-center truncate">Unid.</div>
        <div className="col-span-1 min-w-0 text-right truncate">Costo</div>
        <div className="col-span-1 min-w-0 text-right truncate">Total</div>
        <div className="col-span-1 min-w-0 text-center truncate">Acción</div>
      </div>

      {/* CUERPO */}
      <div className="w-full flex-1 bg-[#FFFFFF]">
        {paginatedData.length === 0 ? (
          <div className="p-12 text-center text-[#64748B] font-bold uppercase text-[10px] tracking-widest flex flex-col items-center justify-center h-full gap-2 bg-[#FFFFFF]">
            <Layers size={32} className="text-[#E2E8F0] mb-2" />
            <p>No hay registros de mermas con estos filtros.</p>
          </div>
        ) : (
          paginatedData.map((merma, index) => (
            <div key={merma.id || `merma-${index}`} className="grid grid-cols-12 gap-3 items-center p-4 border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors text-sm rounded-none">
              
              {/* FECHA Y USUARIO */}
              <div className="col-span-2 min-w-0 flex flex-col gap-1">
                <span className="text-[#1E293B] text-base font-black truncate">{merma.created_at.split(',')[0]}</span>
                <span className="text-xs font-black text-[#64748B] uppercase flex items-center gap-1 truncate">
                  {merma.created_at.split(',')[1]}
                </span>
                <span className="text-xs font-black text-[#10B981] uppercase flex items-center gap-1 truncate">
                  Por: {merma.user_name || 'SISTEMA'}
                </span>
              </div>

              {/* PRODUCTO */}
              <div className="col-span-2 min-w-0 flex flex-col gap-1 overflow-hidden">
                <p className="font-black text-sm uppercase text-[#1E293B] truncate flex items-center gap-2" title={merma.product_name}>
                  <Package size={16} className="text-[#64748B] shrink-0" />
                  <span className="truncate">{merma.product_name || 'DESCONOCIDO'}</span>
                </p>
              </div>

              {/* DETALLE */}
              <div className="col-span-2 min-w-0 pr-2">
                {merma.notes ? (
                  <p className="text-xs font-black text-[#64748B] line-clamp-2" title={merma.notes}>
                    {merma.notes}
                  </p>
                ) : (
                  <span className="text-xs font-black text-[#CBD5E1] italic truncate block">SIN DETALLE</span>
                )}
              </div>

              {/* MOTIVO */}
              <div className="col-span-2 min-w-0 pr-2">
                <span className="text-xs font-black uppercase px-2 py-1 border-2 inline-block bg-[#FFFFFF] text-[#1E293B] border-[#E2E8F0] truncate max-w-full rounded-none">
                  {merma.reason}
                </span>
              </div>

              {/* UNIDADES */}
              <div className="col-span-1 min-w-0 flex justify-center">
                <div className="inline-flex items-center justify-center px-2 py-1 border-2 border-[#1E293B] bg-[#FFFFFF] font-black text-[#1E293B] text-xs w-full max-w-[50px] truncate rounded-none">
                  {merma.quantity}
                </div>
              </div>

              {/* COSTO */}
              <div className="col-span-1 min-w-0 text-right">
                <p className="font-black text-[#64748B] text-xs truncate" title={`S/ ${merma.cost_unit.toFixed(2)}`}>
                  S/{merma.cost_unit.toFixed(2)}
                </p>
              </div>

              {/* TOTAL */}
              <div className="col-span-1 min-w-0 text-right">
                <p className="font-black text-[#1E293B] text-sm truncate" title={`S/ ${merma.total_loss.toFixed(2)}`}>
                  S/{merma.total_loss.toFixed(2)}
                </p>
              </div>

              {/* ACCIONES */}
              <div className="col-span-1 min-w-0 flex items-center justify-center gap-2">
                <button 
                  onClick={() => onEdit?.(merma)}
                  className="p-2 border border-[#E2E8F0] text-[#64748B] hover:text-[#FFFFFF] hover:bg-[#1E293B] transition-colors rounded-none bg-[#FFFFFF]"
                  title="Editar Merma"
                >
                  <Edit size={14} />
                </button>
                <button 
                  onClick={() => onDelete?.(merma)}
                  className="p-2 border border-[#E2E8F0] text-[#64748B] hover:text-[#FFFFFF] hover:bg-[#EF4444] hover:border-[#EF4444] transition-colors rounded-none bg-[#FFFFFF]"
                  title="Eliminar Merma"
                >
                  <Trash2 size={14} />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {renderPagination('bottom')}
    </div>
  );
};