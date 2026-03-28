import React, { useState, useEffect } from 'react';
import { Eye, Edit,  Banknote, RotateCcw, FilterX, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Fiado } from '../types';

interface Props {
  fiados: Fiado[];
  onView: (fiado: Fiado) => void;
  onEdit: (fiado: Fiado) => void;
  onPay: (fiado: Fiado) => void;
  onRevertir: (fiado: Fiado) => void;
}

export const TablaFiados: React.FC<Props> = ({ fiados, onView, onEdit, onPay, onRevertir }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'ACTIVOS' | 'TODOS' | 'PENDIENTE' | 'PAGADO'>('ACTIVOS');
  const [ordenPor, setOrdenPor] = useState<'RECIENTES' | 'ANTIGUOS' | 'MAYOR_DEUDA' | 'MENOR_DEUDA' | 'PROXIMO_VENCER'>('RECIENTES');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // Resetear la página si los filtros cambian
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroEstado, ordenPor, fiados.length]);

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFiltroEstado('ACTIVOS');
    setOrdenPor('RECIENTES');
    setCurrentPage(1);
  };

  // 1. Filtrado
  let fiadosProcesados = fiados.filter(f => {
    // PROTECCIÓN: Si el nombre del cliente viene nulo o vacío por un error, no crashea
    const nombreCliente = f.clienteNombre || ''; 
    const matchBusqueda = nombreCliente.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Lógica de estado técnica simplificada
    let matchEstado = false;
    if (filtroEstado === 'TODOS') matchEstado = true;
    else if (filtroEstado === 'ACTIVOS') matchEstado = (f.estado === 'PENDIENTE');
    else matchEstado = (f.estado === filtroEstado);

    return matchBusqueda && matchEstado;
  });

  // 2. Ordenamiento
  fiadosProcesados.sort((a, b) => {
    if (ordenPor === 'RECIENTES') return new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime();
    if (ordenPor === 'ANTIGUOS') return new Date(a.fechaEmision).getTime() - new Date(b.fechaEmision).getTime();
    if (ordenPor === 'MAYOR_DEUDA') return b.saldoPendiente - a.saldoPendiente;
    if (ordenPor === 'MENOR_DEUDA') return a.saldoPendiente - b.saldoPendiente;
    if (ordenPor === 'PROXIMO_VENCER') return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime();
    return 0;
  });

  // 3. Paginación
  const totalPages = Math.max(1, Math.ceil(fiadosProcesados.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentFiados = fiadosProcesados.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const hayFiltrosActivos = searchTerm !== '' || filtroEstado !== 'TODOS' || ordenPor !== 'RECIENTES';

  const PaginacionControles = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="p-3 border-y-2 border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center shrink-0">
        <p className="text-[10px] font-black text-[#64748B] uppercase">
          Mostrando {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, fiadosProcesados.length)} de {fiadosProcesados.length}
        </p>
        <div className="flex gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border-2 border-[#E2E8F0] bg-white text-[#1E293B] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F8FAFC] cursor-pointer rounded-none"><ChevronLeft size={16} /></button>
          <span className="flex items-center justify-center px-4 border-2 border-[#E2E8F0] bg-white text-xs font-black text-[#1E293B] rounded-none">Pág {currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border-2 border-[#E2E8F0] bg-white text-[#1E293B] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F8FAFC] cursor-pointer rounded-none"><ChevronRight size={16} /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border-2 border-[#E2E8F0] shadow-[8px_8px_0_0_#E2E8F0] flex flex-col font-mono rounded-none">
      
      {/* BARRA DE FILTROS AUMENTADA */}
      <div className="p-6 border-b-2 border-[#E2E8F0] flex flex-wrap lg:flex-nowrap gap-4 shrink-0 bg-[#F8FAFC]">
        <input 
          type="text" 
          placeholder="BUSCAR CLIENTE..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px] border-2 border-[#E2E8F0] px-4 py-3 text-sm font-black uppercase outline-none focus:border-[#3B82F6] transition-colors rounded-none"
        />
        
        <select 
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as any)}
          className="w-full lg:w-48 border-2 border-[#E2E8F0] px-4 py-3 text-sm font-black uppercase outline-none focus:border-[#3B82F6] bg-white cursor-pointer rounded-none"
        >
          <option value="ACTIVOS">SOLO ACTIVOS</option>
          <option value="TODOS">HISTORIAL COMPLETO</option>
          <option value="PENDIENTE">PENDIENTES</option>
          <option value="PAGADO">PAGADOS</option>
        </select>

        <select 
          value={ordenPor}
          onChange={(e) => setOrdenPor(e.target.value as any)}
          className="w-full lg:w-64 border-2 border-[#E2E8F0] px-4 py-3 text-sm font-black uppercase outline-none focus:border-[#3B82F6] bg-white cursor-pointer rounded-none"
        >
          <option value="RECIENTES">MÁS RECIENTES</option>
          <option value="ANTIGUOS">MÁS ANTIGUOS</option>
          <option value="MAYOR_DEUDA">MAYOR DEUDA</option>
          <option value="MENOR_DEUDA">MENOR DEUDA</option>
          <option value="PROXIMO_VENCER">PRÓXIMOS A VENCER</option>
        </select>

        {hayFiltrosActivos && (
          <button 
            onClick={limpiarFiltros} 
            className="p-2 border-2 border-[#E2E8F0] bg-[#FEF2F2] text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition-colors cursor-pointer rounded-none" 
            title="Limpiar Filtros"
          >
            <FilterX size={16} />
          </button>
        )}
      </div>

      <PaginacionControles />

      {/* TABLA SIN SCROLL VERTICAL INTERNO */}
      <div className="w-full overflow-x-auto bg-white">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-[#1E293B] text-white sticky top-0 z-10">
            <tr>
              <th className="p-4 text-xs font-black tracking-widest uppercase border-b-2 border-[#1E293B]">Cliente</th>
              <th className="p-4 text-xs font-black tracking-widest uppercase border-b-2 border-[#1E293B]">Emisión</th>
              <th className="p-4 text-xs font-black tracking-widest uppercase border-b-2 border-[#1E293B]">Vence</th>
              <th className="p-4 text-xs font-black tracking-widest uppercase border-b-2 border-[#1E293B]">Estado</th>
              <th className="p-4 text-xs font-black tracking-widest uppercase text-right border-b-2 border-[#1E293B]">Deuda</th>
              <th className="p-4 text-xs font-black tracking-widest uppercase text-right border-b-2 border-[#1E293B]">Saldo</th>
              <th className="p-4 text-xs font-black tracking-widest uppercase text-center border-b-2 border-[#1E293B]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentFiados.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#94A3B8] font-bold text-xs uppercase bg-white">
                  No se encontraron deudas
                </td>
              </tr>
            ) : (
              currentFiados.map(fiado => (
                <tr key={fiado.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                  <td className="p-4">
                    <p className="text-base font-black text-[#1E293B] uppercase">{fiado.clienteNombre}</p>
                    {fiado.clienteTelefono && <p className="text-xs text-[#64748B] font-bold">Cel: {fiado.clienteTelefono}</p>}
                  </td>
                  <td className="p-4 text-sm font-bold text-[#64748B]">
                    {new Date(fiado.fechaEmision).toLocaleDateString('es-PE')}
                  </td>
                  <td className="p-4 text-sm font-bold text-[#1E293B]">
                    {/* Inyección Técnica: Agregamos T12:00:00 para anular el desfase de zona horaria de UTC-5 */}
                    {new Date(fiado.fechaVencimiento.includes('T') ? fiado.fechaVencimiento : `${fiado.fechaVencimiento}T12:00:00`).toLocaleDateString('es-PE')}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1.5 text-xs font-black tracking-widest border-2 rounded-none ${
                      fiado.estado === 'PAGADO' ? 'bg-[#ECFDF5] text-[#10B981] border-[#10B981]' : 
                      'bg-[#FFFBEB] text-[#F59E0B] border-[#F59E0B]'
                    }`}>
                      {fiado.estado}
                    </span>
                  </td>
                  <td className="p-4 text-right text-base font-black text-[#64748B]">S/ {fiado.montoOriginal.toFixed(2)}</td>
                  <td className="p-4 text-right text-lg font-black text-[#EF4444]">S/ {fiado.saldoPendiente.toFixed(2)}</td>
                  
                  {/* ACCIONES */}
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => onView(fiado)} className="p-2 bg-white text-[#94A3B8] border-2 border-[#E2E8F0] hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors cursor-pointer rounded-none" title="Ver Detalles">
                        <Eye size={16} />
                      </button>
                      
                      {fiado.estado !== 'PAGADO' && (
                        <>
                          <button onClick={() => onEdit(fiado)} className="p-2 bg-white text-[#94A3B8] border-2 border-[#E2E8F0] hover:border-[#F59E0B] hover:text-[#F59E0B] transition-colors cursor-pointer rounded-none" title="Editar Deuda">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => onPay(fiado)} className="p-2 bg-white text-[#94A3B8] border-2 border-[#E2E8F0] hover:border-[#10B981] hover:text-[#10B981] transition-colors cursor-pointer rounded-none" title="Registrar Abono">
                            <Banknote size={16} />
                          </button>
                        </>
                      )}

                      {fiado.pagos && fiado.pagos.length > 0 && (
                        <button 
                          onClick={() => onRevertir(fiado)} 
                          className="p-2 bg-white text-[#94A3B8] border-2 border-[#E2E8F0] hover:border-[#F59E0B] hover:text-[#F59E0B] transition-colors cursor-pointer rounded-none" 
                          title="Ver Historial de Pagos / Anular Pago"
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}

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
  );
};