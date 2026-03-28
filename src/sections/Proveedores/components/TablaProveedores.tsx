import React, { useState } from 'react';
import { Edit, Trash2, Truck, Phone, Mail, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Proveedor } from '../types';

interface Props {
  proveedores: Proveedor[];
  onEdit: (proveedor: Proveedor) => void;
  onDelete: (proveedor: Proveedor) => void;
}

export const TablaProveedores: React.FC<Props> = ({ proveedores, onEdit, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const totalPages = Math.ceil(proveedores.length / ITEMS_PER_PAGE);
  const paginatedData = proveedores.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="border border-[#E2E8F0] flex-1 flex flex-col bg-white relative w-full">
      
      {/* CABECERA */}
      <div className="grid grid-cols-12 gap-3 bg-[#1E293B] text-white p-4 text-[10px] md:text-xs font-black uppercase tracking-[0.1em] shrink-0">
        <div className="col-span-2 min-w-0 truncate">RUC</div>
        <div className="col-span-4 min-w-0 truncate">Razón Social / Comercial</div>
        <div className="col-span-3 min-w-0 truncate">Contacto</div>
        <div className="col-span-2 min-w-0 text-center truncate">Estado</div>
        <div className="col-span-1 min-w-0 text-center truncate">Acción</div>
      </div>

      {/* CUERPO */}
      <div className="w-full flex-1 overflow-y-auto custom-scrollbar">
        {paginatedData.length === 0 ? (
          <div className="p-12 text-center text-[#94A3B8] font-bold uppercase text-[10px] tracking-widest flex flex-col items-center justify-center h-full gap-2">
            <Truck size={32} className="text-[#E2E8F0] mb-2" />
            <p>No se encontraron proveedores.</p>
          </div>
        ) : (
          paginatedData.map((prov) => (
            <div key={prov.id} className="grid grid-cols-12 gap-3 items-center p-4 border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors group text-sm">
              
              {/* RUC */}
              <div className="col-span-2 min-w-0">
                <span className="text-[#1E293B] font-black truncate bg-[#F1F5F9] px-2 py-1 border border-[#E2E8F0]">{prov.ruc}</span>
              </div>

              {/* EMPRESA */}
              <div className="col-span-4 min-w-0 flex flex-col gap-1 pr-2">
                <p className="font-black uppercase text-[#1E293B] truncate" title={prov.razon_social}>
                  {prov.razon_social}
                </p>
                {prov.nombre_comercial && (
                  <p className="text-[10px] font-bold text-[#64748B] uppercase truncate" title={prov.nombre_comercial}>
                    Comercial: {prov.nombre_comercial}
                  </p>
                )}
                {prov.direccion && (
                  <p className="text-[9px] font-bold text-[#94A3B8] uppercase truncate flex items-center gap-1 mt-1" title={prov.direccion}>
                    <MapPin size={10} /> {prov.direccion}
                  </p>
                )}
              </div>

              {/* CONTACTO */}
              <div className="col-span-3 min-w-0 flex flex-col gap-1 pr-2">
                {prov.telefono ? (
                  <span className="text-[10px] font-bold text-[#3B82F6] flex items-center gap-1 truncate">
                    <Phone size={12} /> {prov.telefono}
                  </span>
                ) : <span className="text-[10px] text-[#CBD5E1] italic">Sin teléfono</span>}
                
                {prov.email ? (
                  <span className="text-[10px] font-bold text-[#64748B] flex items-center gap-1 truncate">
                    <Mail size={12} /> {prov.email}
                  </span>
                ) : null}
              </div>

              {/* ESTADO */}
              <div className="col-span-2 min-w-0 flex justify-center">
                {prov.estado === 'ACTIVO' ? (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 border inline-block bg-[#ECFDF5] text-[#10B981] border-[#10B981]">
                    ACTIVO
                  </span>
                ) : (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 border inline-block bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]">
                    INACTIVO
                  </span>
                )}
              </div>

              {/* ACCIONES */}
              <div className="col-span-1 min-w-0 flex items-center justify-center gap-2">
                <button 
                  onClick={() => onEdit(prov)}
                  className="text-[#94A3B8] hover:text-[#3B82F6] transition-colors cursor-pointer"
                  title="Editar Proveedor"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => onDelete(prov)}
                  className="text-[#94A3B8] hover:text-[#EF4444] transition-colors cursor-pointer"
                  title="Eliminar Proveedor"
                >
                  <Trash2 size={16} />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* PAGINACIÓN */}
      {totalPages > 0 && (
        <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] p-3 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center bg-white border border-[#E2E8F0] text-[#1E293B] hover:bg-[#1E293B] hover:text-white disabled:opacity-50 transition-colors rounded-none cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center bg-white border border-[#E2E8F0] text-[#1E293B] hover:bg-[#1E293B] hover:text-white disabled:opacity-50 transition-colors rounded-none cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};