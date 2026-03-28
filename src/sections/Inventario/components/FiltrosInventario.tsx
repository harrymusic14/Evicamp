import React, { useState, useEffect } from 'react';
import { Search, X, FilterX } from 'lucide-react';

interface Props {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  matchCount: number;
  categorias: string[];
  filtroCategoria: string;
  setFiltroCategoria: (val: string) => void;
  filtroEstado: string;
  setFiltroEstado: (val: string) => void;
  filtroOrden: string;
  setFiltroOrden: (val: string) => void;
  onClearFilters: () => void;
}

export const FiltrosInventario: React.FC<Props> = ({ 
  searchQuery, setSearchQuery, matchCount,
  categorias, filtroCategoria, setFiltroCategoria,
  filtroEstado, setFiltroEstado,
  filtroOrden, setFiltroOrden, onClearFilters
}) => {
  // === NUEVO: ESTADO LOCAL Y DEBOUNCE PARA VELOCIDAD EXTREMA ===
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Sincronizar si los filtros se limpian desde afuera
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Esperar 300ms después de que el usuario deje de teclear para procesar la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery]);
  return (
    <div className="flex flex-col xl:flex-row gap-4 px-8 shrink-0 items-center justify-between">
      
      {/* BARRA DE BÚSQUEDA (Toma el espacio restante) */}
      <div className="w-full flex-1 h-14 flex border border-[#E2E8F0] bg-white focus-within:border-[#1E293B] focus-within:ring-1 focus-within:ring-[#1E293B] transition-all group shadow-sm">
        <div className="w-14 h-full flex items-center justify-center bg-[#F8FAFC] border-r border-[#E2E8F0] text-[#94A3B8] group-focus-within:bg-[#1E293B] group-focus-within:text-[#10B981] group-focus-within:border-[#1E293B] transition-colors shrink-0">
          <div className="mt-[-6px]"><Search size={18} /></div>
        </div>
        <div className="flex-1 relative h-full flex items-center">
          <input 
            type="text"
            placeholder="ESCANEAR BARCODE O BUSCAR POR NOMBRE / CÓDIGO..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="w-full h-full pl-4 pr-32 bg-transparent font-black text-xs uppercase outline-none text-[#1E293B] placeholder:text-[#CBD5E1]"
          />
          {localQuery && (
            <div className="absolute right-2 flex items-center gap-2">
              <div className="flex items-center border border-[#10B981] bg-[#1E293B] px-2 h-8">
                <div className="w-1.5 h-1.5 bg-[#10B981] animate-pulse mr-2"></div>
                <span className="text-[9px] font-black text-[#10B981] tracking-widest leading-none">
                  {matchCount} MATCH
                </span>
              </div>
              <button 
                onClick={() => {
                  setLocalQuery('');
                  setSearchQuery('');
                }}
                className="w-8 h-8 flex items-center justify-center border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors cursor-pointer rounded-none"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BLOQUE DE FILTROS Y ORDENAMIENTO (A la derecha) */}
      <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
        
        {/* SELECT CATEGORÍA */}
        <select 
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="h-14 bg-white border border-[#E2E8F0] text-[10px] font-bold text-[#1E293B] uppercase px-3 outline-none focus:border-[#10B981] transition-colors cursor-pointer"
        >
          <option value="">Todas las Categorías</option>
          {categorias.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* SELECT ESTADO */}
        <select 
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="h-14 bg-white border border-[#E2E8F0] text-[10px] font-bold text-[#1E293B] uppercase px-3 outline-none focus:border-[#10B981] transition-colors cursor-pointer"
        >
          <option value="">Todos los Estados</option>
          <option value="CON_STOCK">Con Stock General</option>
          <option value="CRITICO">Nivel Crítico</option>
          <option value="SIN_STOCK">Agotados (0 Stock)</option>
        </select>

        {/* SELECT ORDENAMIENTO */}
        <select 
          value={filtroOrden}
          onChange={(e) => setFiltroOrden(e.target.value)}
          className="h-14 bg-white border border-[#E2E8F0] text-[10px] font-bold text-[#1E293B] uppercase px-3 outline-none focus:border-[#10B981] transition-colors cursor-pointer"
        >
          <option value="NOMBRE_ASC">Nombre (A - Z)</option>
          <option value="NOMBRE_DESC">Nombre (Z - A)</option>
          <option value="STOCK_DESC">Mayor Stock</option>
          <option value="STOCK_ASC">Menor Stock</option>
          <option value="PRECIO_DESC">Mayor Precio</option>
          <option value="PRECIO_ASC">Menor Precio</option>
        </select>

        {/* BOTÓN LIMPIAR FILTROS */}
        <button 
          onClick={onClearFilters}
          title="Limpiar todos los filtros"
          className="h-14 px-4 flex items-center justify-center border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:bg-[#1E293B] hover:text-white hover:border-[#1E293B] transition-all cursor-pointer"
        >
          <FilterX size={16} />
        </button>
      </div>

    </div>
  );
};