import React, { useState, useEffect } from 'react';
import { Database,Layers, Edit, Trash2, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../../db/supabase';

interface Lote {
  id: string;
  product_id: string;
  quantity: number;
  initial_quantity: number;
  expiration_date: string | null;
  created_at: string;
  cost_unit: number;
  product_name: string;
  document_ref: string;
  category: string;
  mermas_count?: number; // Cantidad de veces que se registró merma
  mermas_total?: number; // Suma total de unidades perdidas
  unit?: string; // <-- AÑADIDO PARA LA UNIDAD
  supplier?: string; // <-- AÑADIDO PARA EL PROVEEDOR
}

interface Props {
  searchQuery: string;
  filtroCategoria: string;
  filtroEstado: string;
  filtroOrden: string;
  nuevoLoteInyectado?: any;
  onViewMermas?: (lote: any) => void;
  onEditLote?: (lote: any) => void;
  onLoteDeleted?: (productId: string, quantityRemoved: number) => void; // <-- AÑADIR ESTA LÍNEA
}

export const TablaLotes: React.FC<Props> = ({ 
  searchQuery, filtroCategoria, filtroEstado, filtroOrden, nuevoLoteInyectado, onViewMermas, onEditLote, onLoteDeleted // <-- AÑADIR AQUÍ
}) => {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLotes = async () => {
      setLoading(true);
      try {
        // 🛡️ OPTIMIZACIÓN: JOIN con products + Filtro Geométrico (> 0)
        const { data, error } = await supabase
          .from('batches')
          .select(`
            *,
            products!batches_product_id_fkey (*)
          `)
          .gt('quantity', 0) // <-- ESTE ES EL FILTRO ESTRICTO QUE OCULTA LOS LOTES VACÍOS
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const mapeados: Lote[] = data.map((b: any) => ({
            id: b.id,
            product_id: b.product_id,
            quantity: Number(b.quantity) || 0,
            initial_quantity: Number(b.initial_quantity) || 0,
            expiration_date: b.expiration_date,
            created_at: new Date(b.created_at).toLocaleDateString(),
            cost_unit: Number(b.cost_unit) || 0,
            product_name: b.products?.name || 'PRODUCTO DESCONOCIDO',
            document_ref: b.document_ref || 'INT-S/R',
            supplier: b.supplier || '',
            category: b.products?.category || 'GENERAL',
            unit: b.products?.unit === 'CONSUMO' || b.products?.control_type === 'CONSUMO' || b.products?.control_type === 'SERVICE' ? 'CONSUMO' : (b.products?.unit || b.products?.weight_unit || (b.products?.control_type === 'WEIGHT' ? 'KG' : 'UND'))
          }));
          setLotes(mapeados);
        }
      } catch (error: any) {
        console.error("Error cargando lotes:", error.message || error.details || JSON.stringify(error));
      } finally {
        setLoading(false);
      }
    };

    fetchLotes();
  }, []);
  // === INYECCIÓN OPTIMISTA (AGREGA O EDITA EL LOTE SIN RECARGAR LA PANTALLA) ===
  useEffect(() => {
    if (nuevoLoteInyectado) {
      
      // INTERCEPCIÓN TÉCNICA: Formateamos la fecha si viene cruda desde Supabase (ISO 8601)
      const loteFormateado = {
        ...nuevoLoteInyectado,
        created_at: nuevoLoteInyectado.created_at && nuevoLoteInyectado.created_at.includes('T') 
          ? new Date(nuevoLoteInyectado.created_at).toLocaleDateString() 
          : nuevoLoteInyectado.created_at
      };

      setLotes(prev => {
        const existe = prev.some(l => l.id === loteFormateado.id);
        if (existe) {
          // Si el lote ya existe, lo ACTUALIZAMOS (Modo Edición)
          return prev.map(l => l.id === loteFormateado.id ? { ...l, ...loteFormateado } : l);
        }
        // Si no existe, lo AGREGAMOS al inicio (Modo Creación)
        return [loteFormateado, ...prev];
      });
    }
  }, [nuevoLoteInyectado]);

  // === MOTOR DE FILTRADO Y ORDENAMIENTO PARA LOS LOTES ===
  const filteredLotes = lotes.filter(lote => {
    // 1. Filtro de Búsqueda de Texto
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!lote.product_name.toLowerCase().includes(q) && !lote.document_ref.toLowerCase().includes(q)) {
        return false;
      }
    }
    
    // 2. Filtro por Categoría
    if (filtroCategoria && lote.category !== filtroCategoria) {
      return false;
    }

    // 3. Filtro por Estado 
    if (filtroEstado === 'CON_STOCK' && lote.quantity <= 0) return false;
    if (filtroEstado === 'SIN_STOCK' && lote.quantity > 0) return false;
    if (filtroEstado === 'CRITICO') {
      // Un lote es crítico si está vencido o le queda el 20% o menos de su capacidad inicial
      const isExpired = lote.expiration_date && new Date(lote.expiration_date) < new Date();
      const isLow = lote.quantity > 0 && lote.quantity <= (lote.initial_quantity * 0.2);
      if (!isExpired && !isLow) return false;
    }

    return true;
  }).sort((a, b) => {
    // 4. Filtro de Ordenamiento Alfabético o Matemático
    if (filtroOrden === 'NOMBRE_ASC') return a.product_name.localeCompare(b.product_name);
    if (filtroOrden === 'NOMBRE_DESC') return b.product_name.localeCompare(a.product_name);
    if (filtroOrden === 'STOCK_ASC') return a.quantity - b.quantity;
    if (filtroOrden === 'STOCK_DESC') return b.quantity - a.quantity;
    if (filtroOrden === 'PRECIO_ASC') return a.cost_unit - b.cost_unit;
    if (filtroOrden === 'PRECIO_DESC') return b.cost_unit - a.cost_unit;
    return 0;
  });

  // === ESTADOS Y LÓGICA DE PAGINACIÓN ===
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // Reiniciar a la página 1 si cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filtroCategoria, filtroEstado, filtroOrden]);

  const totalPages = Math.ceil(filteredLotes.length / ITEMS_PER_PAGE);
  const paginatedLotes = filteredLotes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Generador de controles de paginación
  const renderPagination = (position: 'top' | 'bottom') => {
    if (loading || totalPages <= 0) return null;
    return (
      <div className={`${position === 'top' ? 'border-b' : 'border-t'} border-[#E2E8F0] bg-[#F8FAFC] p-3 flex items-center justify-between shrink-0`}>
        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
          Página {currentPage} de {totalPages}
        </span>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center bg-white border border-[#E2E8F0] text-[#1E293B] hover:bg-[#1E293B] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-none cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center bg-white border border-[#E2E8F0] text-[#1E293B] hover:bg-[#1E293B] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-none cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="border border-[#E2E8F0] flex-1 flex flex-col bg-white relative">
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Database size={24} className="text-[#10B981] animate-bounce" />
            <span className="text-[10px] font-black text-[#1E293B] uppercase tracking-[0.2em]">Cargando Lotes...</span>
          </div>
        </div>
      )}

      {/* Paginación Superior */}
      {renderPagination('top')}

      {/* Cabecera de la Tabla (TEXTO AGRANDADO a text-sm) */}
      <div className="grid grid-cols-12 bg-[#1E293B] text-white p-4 text-sm font-black uppercase tracking-[0.1em] shrink-0">
        <div className="col-span-2">Fecha / Doc / Prov.</div>
        <div className="col-span-3">Producto</div>
        <div className="col-span-2 text-center">Estado / Vence</div>
        <div className="col-span-1 text-right">Costo U.</div>
        <div className="col-span-1 text-right">T. Compra</div>
        <div className="col-span-1 text-center">Mermas</div>
        <div className="col-span-1 text-center">Stock</div>
        <div className="col-span-1 text-center">Acción</div>
      </div>

      {/* Cuerpo Scrolleable */}
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        {!loading && paginatedLotes.length === 0 ? (
          <div className="p-12 text-center text-[#94A3B8] font-bold uppercase text-[10px] tracking-widest flex flex-col items-center justify-center h-full gap-2">
            <Layers size={32} className="text-[#E2E8F0] mb-2" />
            No hay lotes que coincidan con la búsqueda.
          </div>
        ) : (
          paginatedLotes.map((lote) => {
  // LÓGICA DE VIGENCIA Y CÁLCULOS TÉCNICOS
  const isExpired = lote.expiration_date && new Date(lote.expiration_date) < new Date();
  const isVigente = lote.quantity > 0 && !isExpired;
  const totalCompra = (lote.initial_quantity * lote.cost_unit).toFixed(2);

  return (
    // SE AGRANDÓ LA LETRA BASE DE LA FILA (text-base)
    <div key={lote.id} className="grid grid-cols-12 items-center p-4 border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors group text-base">
      
      {/* 1. INGRESO Y REFERENCIA / SUSTENTO / PROVEEDOR */}
      <div className="col-span-2 flex flex-col gap-1 pr-2">
        <span className="text-[#1E293B] font-black">{lote.created_at}</span>
        
        {/* Documento o Sustento Guardado */}
        <span className="text-xs font-black text-[#64748B] uppercase truncate" title={lote.document_ref}>
          {lote.document_ref}
        </span>
        
        {/* Proveedor en color azul para resaltarlo */}
        {lote.supplier && (
          <span className="text-[10px] font-black text-[#3B82F6] uppercase truncate" title={lote.supplier}>
            PROV: {lote.supplier}
          </span>
        )}
      </div>

      {/* 2. PRODUCTO Y CATEGORÍA */}
      <div className="col-span-3 pr-4">
        <p className="font-black uppercase text-[#1E293B] truncate" title={lote.product_name}>
          {lote.product_name}
        </p>
        <span className="text-xs font-black bg-[#E2E8F0] px-2 py-1 text-[#64748B] uppercase mt-1 inline-block w-max">
          {lote.category}
        </span>
      </div>

      {/* 3. ESTADO DINÁMICO Y VENCIMIENTO */}
      <div className="col-span-2 flex flex-col items-center gap-1">
        <div className={`px-3 py-1 text-xs font-black uppercase border-2 ${
          isVigente ? 'bg-[#ECFDF5] text-[#10B981] border-[#10B981]' : 'bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]'
        }`}>
          {isVigente ? 'VIGENTE' : isExpired ? 'CADUCADO' : 'AGOTADO'}
        </div>
        <span className="text-xs font-black text-[#64748B]">
          {lote.expiration_date || 'SIN VENC.'}
        </span>
      </div>

      {/* 4. COSTO UNITARIO */}
      <div className="col-span-1 text-right">
        <p className="font-black text-[#64748B]">S/ {lote.cost_unit.toFixed(2)}</p>
      </div>

      {/* 5. TOTAL COMPRA */}
      <div className="col-span-1 text-right">
        <p className="font-black text-[#1E293B]">S/ {totalCompra}</p>
      </div>

      {/* 6. TRAZABILIDAD DE MERMAS */}
      <div className="col-span-1 text-center">
        {lote.mermas_total && lote.mermas_total > 0 ? (
          <div className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 text-[11px] font-black inline-block mx-auto rounded-none" title={`Eventos: ${lote.mermas_count}`}>
            -{lote.mermas_total}
          </div>
        ) : (
          <span className="text-[#CBD5E1] font-bold text-xs">-</span>
        )}
      </div>

      {/* 7. STOCK ACTUAL (Con Unidad de Medida) */}
      <div className="col-span-1 text-center flex flex-col items-center px-1">
        <div 
          className={`flex flex-col items-center justify-center px-1 py-0.5 text-sm font-black border-2 w-full max-w-[60px] overflow-hidden text-ellipsis ${
            isVigente ? 'border-[#1E293B] bg-white text-[#1E293B]' : 'border-[#CBD5E1] bg-[#F1F5F9] text-[#94A3B8]'
          }`} 
          title={`Stock exacto en DB: ${lote.quantity} ${lote.unit || 'UND'}`}
        >
          <span className="leading-none">{Number(Number(lote.quantity || 0).toFixed(3))}</span>
          <span className="text-[8px] opacity-70 leading-tight mt-0.5">{lote.unit || 'UND'}</span>
        </div>
      </div>

      {/* 8. ACCIONES: HISTORIAL, EDITAR Y ELIMINAR (Íconos más grandes) */}
      <div className="col-span-1 text-center flex items-center justify-center gap-3">
        {/* BOTÓN HISTORIAL DE MERMA */}
        <button 
          onClick={() => {
            if (onViewMermas) {
              onViewMermas(lote); // <-- Ahora TypeScript aceptará el argumento
            }
          }}
          className="text-[#94A3B8] hover:text-[#F59E0B] transition-colors cursor-pointer"
          title="Ver Historial de Mermas"
        >
          <History size={18} />
        </button>

        <button 
          onClick={() => onEditLote && onEditLote(lote)}
          className="text-[#94A3B8] hover:text-[#10B981] transition-colors cursor-pointer"
          title="Editar datos del Lote"
        >
          <Edit size={18} />
        </button>

        <button 
          onClick={async () => {
            if (window.confirm(`MANTENIMIENTO DE INTEGRIDAD\n\n¿Confirma el retiro del lote de "${lote.product_name}"?\n\nEsta acción descargará el stock actual pero mantendrá intacto el historial de ventas, utilidades y contabilidad.`)) {
              try {
                // 1. EJECUCIÓN TÉCNICA: Borrado Lógico mediante Supabase RPC
                const { error } = await supabase.rpc('soft_delete_batch', {
                  p_batch_id: lote.id,
                  p_user_name: 'Admin'
                });
                
                if (error) throw error;

                // 2. Sincronizar memoria visual (TablaProductos)
                if (onLoteDeleted) {
                  onLoteDeleted(lote.product_id, Number(lote.quantity));
                }

                // 3. Remover el lote oculto de la pantalla actual
                setLotes(prev => prev.filter(l => l.id !== lote.id));
                
              } catch (err: any) {
                console.error("[ DB ERROR ]:", err);
                alert("⚠️ ERROR DE RED: No se pudo procesar la solicitud de retiro técnico.");
              }
            }
          }}
          className="text-[#1E293B] hover:bg-[#1E293B] hover:text-[#FFFFFF] border border-transparent hover:border-[#E2E8F0] p-1 rounded-none transition-colors cursor-pointer"
          title="Eliminar Lote"
        >
          <Trash2 size={18} />
        </button>
      </div>

    </div>
  );
})
        )}
      </div>
      
      {/* Paginación Inferior */}
      {renderPagination('bottom')}
    </div>
  );
};