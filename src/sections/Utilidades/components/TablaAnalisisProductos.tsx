// src/sections/Utilidades/components/TablaAnalisisProductos.tsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, TrendingDown, TrendingUp, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AnalisisProducto } from '../types';

interface Props {
  datos: AnalisisProducto[];
}

export const TablaAnalisisProductos: React.FC<Props> = ({ datos }) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroCat, setFiltroCat] = useState('TODAS');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  
  // NUEVO: Estado para controlar en qué página estamos
  const [paginaActual, setPaginaActual] = useState(1);

  const categoriasUnicas = Array.from(new Set(datos.map(d => d.categoria))).sort();

  const datosFiltrados = datos.filter(prod => {
    // Blindaje contra valores null o undefined
    const nombreSeguro = prod.nombre || '';
    const busquedaSegura = busqueda || '';
    
    const coincideBusqueda = nombreSeguro.toLowerCase().includes(busquedaSegura.toLowerCase());
    const coincideCat = filtroCat === 'TODAS' || prod.categoria === filtroCat;
    const coincideEstado = filtroEstado === 'TODOS' || prod.estado === filtroEstado;
    return coincideBusqueda && coincideCat && coincideEstado;
  });

  // NUEVO: Si el usuario busca algo, lo regresamos a la página 1 automáticamente
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroCat, filtroEstado]);

  // NUEVO: Lógica de recortes (Paginación)
  const itemsPorPagina = 10;
  const totalPaginas = Math.ceil(datosFiltrados.length / itemsPorPagina) || 1;
  const startIndex = (paginaActual - 1) * itemsPorPagina;
  const datosPaginados = datosFiltrados.slice(startIndex, startIndex + itemsPorPagina);

  const limpiarFiltrosTabla = () => {
    setBusqueda('');
    setFiltroCat('TODAS');
    setFiltroEstado('TODOS');
  };

  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl shadow-sm flex flex-col font-sans">
      
      <div className="p-4 bg-slate-50 border-b-2 border-slate-200 flex flex-wrap gap-4 items-center justify-between shrink-0">
        <h2 className="text-slate-700 font-bold uppercase tracking-wider flex items-center gap-2 text-sm">
          <Filter size={18} className="text-emerald-500" /> Rentabilidad Detallada de Productos
        </h2>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <div className="flex bg-white border-2 border-slate-200 rounded-lg overflow-hidden focus-within:border-emerald-500 flex-1 lg:w-64 transition-all">
            <div className="p-2 flex items-center justify-center text-slate-400"><Search size={16}/></div>
            <input 
              type="text" placeholder="Buscar producto..." 
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="w-full text-xs font-bold text-slate-700 outline-none p-2 bg-transparent"
            />
          </div>
          <select 
            value={filtroCat} onChange={(e) => setFiltroCat(e.target.value)}
            className="bg-white text-xs font-bold text-slate-600 outline-none p-2 border-2 border-slate-200 rounded-lg focus:border-emerald-500 cursor-pointer transition-all"
          >
            <option value="TODAS">Categoría: TODAS</option>
            {categoriasUnicas.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select 
            value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-white text-xs font-bold text-slate-600 outline-none p-2 border-2 border-slate-200 rounded-lg focus:border-emerald-500 cursor-pointer transition-all"
          >
            <option value="TODOS">Rotación: TODAS</option>
            <option value="BUENO">Venta: BUENO</option>
            <option value="REGULAR">Venta: REGULAR</option>
            <option value="BAJO">Venta: BAJO</option>
            <option value="SIN VENTAS">SIN VENTAS</option>
          </select>
          
          <button 
            onClick={limpiarFiltrosTabla} 
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg transition-colors cursor-pointer border-2 border-slate-200 flex items-center justify-center"
            title="Limpiar Filtros de la Tabla"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* --- CONTROLES DE PAGINACIÓN (ARRIBA) --- */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-white border-b-2 border-slate-200 gap-4">
        <span className="text-xs font-bold text-slate-500">
          Mostrando {datosFiltrados.length === 0 ? 0 : startIndex + 1} a {Math.min(startIndex + itemsPorPagina, datosFiltrados.length)} de {datosFiltrados.length} productos
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1} className="px-3 py-1.5 border-2 border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors">
            <ChevronLeft size={14}/> Anterior
          </button>
          <span className="px-3 py-1 text-xs font-black text-slate-700 bg-slate-100 rounded-lg">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} className="px-3 py-1.5 border-2 border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors">
            Siguiente <ChevronRight size={14}/>
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="bg-white text-slate-400 sticky top-0 shadow-md z-10">
            <tr>
              <th className="p-4 text-[10px] font-bold tracking-wider uppercase border-b-2 border-slate-200">Producto</th>
              <th className="p-4 text-[10px] font-bold tracking-wider uppercase border-b-2 border-slate-200 text-center">Stock Actual</th>
              <th className="p-4 text-[10px] font-bold tracking-wider uppercase border-b-2 border-slate-200 text-center">Vendidos</th>
              <th className="p-4 text-[10px] font-bold tracking-wider uppercase border-b-2 border-slate-200 text-right">Ingreso Bruto</th>
              <th className="p-4 text-[10px] font-bold tracking-wider uppercase border-b-2 border-slate-200 text-right">Costo Ventas</th>
              <th className="p-4 text-[10px] font-bold tracking-wider uppercase border-b-2 border-slate-200 text-right text-red-400">Mermas</th>
              <th className="p-4 text-[10px] font-bold tracking-wider uppercase border-b-2 border-slate-200 text-right bg-emerald-50 text-emerald-600">Utilidad Neta</th>
              <th className="p-4 text-[10px] font-bold tracking-wider uppercase border-b-2 border-slate-200 text-center w-24">Margen</th>
            </tr>
          </thead>
          <tbody>
            {datosPaginados.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-slate-400 font-bold text-xs uppercase">No se encontraron productos.</td></tr>
            ) : (
              datosPaginados.map((prod) => (
                <tr key={prod.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="text-xs font-bold text-slate-700 uppercase">{prod.nombre}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">{prod.categoria}</span>
                      
                      {/* ETIQUETA DINÁMICA DE ESTADO */}
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        prod.estado === 'BUENO' ? 'text-emerald-700 bg-emerald-100' : 
                        prod.estado === 'REGULAR' ? 'text-amber-700 bg-amber-100' : 
                        prod.estado === 'BAJO' ? 'text-orange-700 bg-orange-100' : 
                        'text-red-700 bg-red-100'
                      }`}>
                        {prod.estado}
                      </span>
                    </div>
                  </td>
                  
                  {/* NUEVA CELDA: ALERTA DE REABASTECIMIENTO */}
                  <td className="p-4 text-center">
                    {prod.tipoControl === 'CONSUMO' ? (
                      <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-blue-100 text-blue-700 shadow-sm">
                        🍽️ Consumo
                      </span>
                    ) : (
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                        (prod.stockActual || 0) <= 5 ? 'bg-red-100 text-red-700' : 
                        (prod.stockActual || 0) <= 15 ? 'bg-orange-100 text-orange-700' : 
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {(prod.stockActual || 0) <= 5 ? `⚠️ Crítico (${prod.stockActual})` : 
                         (prod.stockActual || 0) <= 15 ? `📦 Bajo (${prod.stockActual})` : 
                         `🔥 OK (${prod.stockActual})`}
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-center text-sm font-bold text-slate-600">{prod.unidadesVendidas}</td>
                  <td className="p-4 text-right text-xs font-bold text-slate-600">S/ {prod.ingresosTotales.toFixed(2)}</td>
                  <td className="p-4 text-right text-xs font-bold text-slate-600">S/ {prod.costoTotalVentas.toFixed(2)}</td>
                  <td className="p-4 text-right text-xs font-bold text-red-500">
                    {prod.perdidaMerma > 0 ? `- S/ ${prod.perdidaMerma.toFixed(2)}` : 'S/ 0.00'}
                  </td>
                  <td className="p-4 text-right text-sm font-bold bg-emerald-50/30">
                    <span className={prod.utilidadReal >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                      S/ {prod.utilidadReal.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`flex items-center justify-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${
                      prod.margen >= 30 ? 'text-emerald-700 bg-emerald-100' : 
                      prod.margen > 0 ? 'text-amber-700 bg-amber-100' : 
                      'text-red-700 bg-red-100'
                    }`}>
                      {prod.margen >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                      {prod.margen.toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- CONTROLES DE PAGINACIÓN (ABAJO) --- */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-white border-t-2 border-slate-200 gap-4">
        <span className="text-xs font-bold text-slate-500">
          Mostrando {datosFiltrados.length === 0 ? 0 : startIndex + 1} a {Math.min(startIndex + itemsPorPagina, datosFiltrados.length)} de {datosFiltrados.length} productos
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1} className="px-3 py-1.5 border-2 border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors">
            <ChevronLeft size={14}/> Anterior
          </button>
          <span className="px-3 py-1 text-xs font-black text-slate-700 bg-slate-100 rounded-lg">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} className="px-3 py-1.5 border-2 border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors">
            Siguiente <ChevronRight size={14}/>
          </button>
        </div>
      </div>

    </div>
  );
};