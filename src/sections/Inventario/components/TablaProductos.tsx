import React, { useState } from 'react';
import { Database, ArrowUpDown, Search, Edit, Trash2, ChevronLeft, ChevronRight, Check, X, History, Barcode, Image as ImageIcon } from 'lucide-react';
import { EtiquetaStock } from './EtiquetaStock';
import type { Product } from '../types';

interface Props {
  loading: boolean;
  productos: Product[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onUpdateProduct?: (updatedProduct: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void; 
  onViewHistory?: (product: Product) => void; // <-- NUEVA PROP AQUÍ
}

export const TablaProductos: React.FC<Props> = ({ 
  loading, productos, currentPage, totalPages, onPageChange, onUpdateProduct, onEditProduct, onDeleteProduct, onViewHistory // <-- AGREGAR AQUÍ
}) => {
  // ESTADOS PARA LA EDICIÓN EN LÍNEA
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});

  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setEditForm(product); // Copiamos los datos actuales a la memoria de edición
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEditing = () => {
    if (onUpdateProduct && editForm.id) {
      onUpdateProduct(editForm as Product);
    } else {
      alert("Simulación: Producto actualizado localmente. (Falta conectar a Supabase)");
    }
    setEditingId(null);
    setEditForm({});
  };

  // Función para dibujar la paginación
  const renderPagination = (position: 'top' | 'bottom') => {
    if (loading || totalPages <= 0) return null;
    
    return (
      <div className={`${position === 'top' ? 'border-b' : 'border-t'} border-[#E2E8F0] bg-[#F8FAFC] p-3 flex items-center justify-between shrink-0`}>
        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
          Página {currentPage} de {totalPages}
        </span>
        <div className="flex gap-2">
          <button 
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center bg-white border border-[#E2E8F0] text-[#1E293B] hover:bg-[#1E293B] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-none cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={() => onPageChange(currentPage + 1)}
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
            <span className="text-[10px] font-black text-[#1E293B] uppercase tracking-[0.2em]">Sincronizando con DB...</span>
          </div>
        </div>
      )}

      {/* === CONTROLES DE PAGINACIÓN ARRIBA === */}
      {renderPagination('top')}

      {/* CABECERAS DE LA TABLA REESTRUCTURADAS (CON COLUMNA DE IMAGEN) */}
      <div className="grid grid-cols-12 bg-[#1E293B] text-white p-4 text-sm font-black uppercase tracking-[0.2em] shrink-0 items-center">
        <div className="col-span-1 text-center">Img</div>
        <div className="col-span-2">Códigos</div>
        <div className="col-span-3">Producto / Categoría</div>
        <div className="col-span-2">Inversión (Costo)</div>
        <div className="col-span-1 text-right">Precio</div>
        <div className="col-span-1 text-center flex items-center justify-center gap-1" title="Stock">
          <ArrowUpDown size={10}/> Stock
        </div>
        <div className="col-span-2 text-center">Acciones</div>
      </div>

      {/* ÁREA SCROLLEABLE DE LOS PRODUCTOS */}
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        {!loading && productos.length === 0 ? (
          <div className="p-12 text-center text-[#94A3B8] font-bold uppercase text-[10px] tracking-widest flex flex-col items-center justify-center h-full gap-2">
            <Search size={32} className="text-[#E2E8F0] mb-2" />
            No se registran productos con esos parámetros.
          </div>
        ) : (
          productos.map((item) => {
            
            // CÁLCULO DE TOTAL DE COMPRA
            const totalCompra = ((item.cost || 0) * (item.quantity || 0)).toFixed(2);

            // === MODO EDICIÓN EN LÍNEA ===
            if (editingId === item.id) {
              return (
                <div key={item.id} className="grid grid-cols-12 items-center p-4 border-b-2 border-[#1E293B] bg-[#F8FAFC] shadow-inner">
                  {/* IMAGEN (NO EDITABLE DESDE AQUÍ) */}
                  <div className="col-span-1 flex justify-center pr-2">
                    {item.imageUrl && (item.imageUrl.startsWith('http') || item.imageUrl.startsWith('data:')) ? (
                      <img 
                        src={item.imageUrl} 
                        alt="img" 
                        className="w-10 h-10 object-cover rounded border border-[#E2E8F0]"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-[#E2E8F0] rounded flex items-center justify-center text-[#94A3B8]" title={item.imageUrl?.startsWith('media') ? 'Formato de App móvil no compatible en web' : 'Sin imagen'}>
                        <ImageIcon size={16}/>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 flex flex-col gap-1 items-start pr-2">
                    <span className="bg-[#E2E8F0] px-2 py-1 border border-[#CBD5E1] text-[9px] font-bold text-[#64748B] rounded-none cursor-not-allowed w-full truncate">
                      {item.code}
                    </span>
                    {item.barcode && (
                      <span className="flex items-center gap-1 text-[8px] font-bold text-[#94A3B8] truncate w-full">
                        <Barcode size={10} /> {item.barcode}
                      </span>
                    )}
                  </div>
                  
                  <div className="col-span-3 pr-2 flex flex-col gap-2">
                    <input 
                      type="text" 
                      value={editForm.name || ''} 
                      onChange={e => setEditForm({...editForm, name: e.target.value.toUpperCase()})}
                      placeholder="NOMBRE PRODUCTO"
                      className="w-full bg-white border-2 border-[#E2E8F0] p-1.5 text-[10px] font-black text-[#1E293B] uppercase outline-none focus:border-[#10B981] transition-colors rounded-none"
                    />
                  </div>

                  <div className="col-span-1 pr-2 flex flex-col gap-2">
                    <input 
                      type="number" 
                      value={editForm.cost || 0} 
                      onChange={e => setEditForm({...editForm, cost: Number(e.target.value)})}
                      className="w-full bg-white border-2 border-[#E2E8F0] p-1 text-[10px] font-bold text-[#1E293B] outline-none focus:border-[#10B981] transition-colors rounded-none"
                      title="Costo U."
                    />
                  </div>

                  <div className="col-span-1 flex items-center justify-end pr-2">
                    <input 
                      type="number" 
                      value={editForm.price || 0} 
                      onChange={e => setEditForm({...editForm, price: Number(e.target.value)})}
                      className="w-full bg-white border-2 border-[#E2E8F0] p-1 text-[10px] font-black text-[#10B981] outline-none focus:border-[#10B981] transition-colors rounded-none text-right"
                      title="Precio"
                    />
                  </div>

                  <div className="col-span-2 text-center flex items-center gap-1 justify-center pr-2">
                    <input 
                      type="number" 
                      value={editForm.minStock || 0} 
                      onChange={e => setEditForm({...editForm, minStock: Number(e.target.value)})}
                      className="w-10 bg-white border-2 border-[#E2E8F0] p-1 text-[10px] font-bold text-[#1E293B] outline-none focus:border-[#EF4444] transition-colors rounded-none text-center"
                      title="Stock Mínimo"
                    />
                    <select 
                      value={editForm.unit || 'UND'}
                      onChange={e => setEditForm({...editForm, unit: e.target.value})}
                      className="flex-1 bg-white border-2 border-[#E2E8F0] p-1 text-[8px] font-bold text-[#1E293B] uppercase outline-none focus:border-[#10B981] transition-colors rounded-none cursor-pointer"
                    >
                      <option value="UND">UND</option>
                      <option value="KG">KG</option>
                      <option value="GR">GR</option>
                      <option value="LT">LT</option>
                      <option value="ML">ML</option>
                      <option value="CONSUMO">CONS</option>
                    </select>
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2 pr-4 w-full ml-auto">
  <button 
    onClick={saveEditing} 
    className="bg-[#10B981] text-[#1E293B] p-2 border-2 border-[#1E293B] hover:bg-[#1E293B] hover:text-[#10B981] transition-colors cursor-pointer rounded-none shadow-[2px_2px_0_0_#1E293B] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]" 
    title="Guardar Cambios"
  >
    <Check size={16} />
  </button>
  <button 
    onClick={cancelEditing} 
    className="bg-white text-[#EF4444] p-2 border-2 border-[#EF4444] hover:bg-[#EF4444] hover:text-white transition-colors cursor-pointer rounded-none shadow-[2px_2px_0_0_#EF4444] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]" 
    title="Cancelar Edición"
  >
    <X size={16} />
  </button>
</div>
                </div>
              );
            }

            // === MODO VISTA NORMAL ===
            return (
              <div key={item.id} className="grid grid-cols-12 items-center p-4 border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors group">
                
                {/* 0. IMAGEN (BLINDADA CONTRA MEDIA://) */}
                <div className="col-span-1 flex items-center justify-center pr-2">
                  {item.imageUrl && (item.imageUrl.startsWith('http') || item.imageUrl.startsWith('data:')) ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-10 h-10 object-cover rounded-md border border-[#E2E8F0] shadow-sm" 
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-[#F1F5F9] rounded-md border border-[#E2E8F0] flex items-center justify-center text-[#CBD5E1]" title={item.imageUrl?.startsWith('media') ? 'Formato de App móvil no compatible en web' : 'Sin Imagen'}>
                      <ImageIcon size={18} />
                    </div>
                  )}
                </div>

                {/* 1. CÓDIGOS */}
                <div className="col-span-2 flex flex-col gap-1.5 items-start">
                  <span className="bg-[#F8FAFC] px-2 py-1 border border-[#E2E8F0] text-sm font-black text-[#1E293B] rounded-none truncate max-w-full" title={item.code}>
                    {item.code}
                  </span>
                  {item.barcode && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-[#64748B] tracking-wider truncate w-full" title="Código de Escáner">
                      <Barcode size={12} className="text-[#94A3B8]" />
                      {item.barcode}
                    </span>
                  )}
                </div>

                {/* 2. PRODUCTO Y CATEGORÍA VISIBLE */}
                <div className="col-span-3 pr-4 flex flex-col gap-1">
                  <p className="font-black text-sm uppercase text-[#1E293B] leading-tight line-clamp-2" title={item.name}>
                    {item.name}
                  </p>
                  <span className="self-start text-[10px] font-black text-white bg-[#1E293B] px-2 py-1 tracking-widest rounded-none mt-0.5">
                    {item.category}
                  </span>
                </div>

                {/* 3. INVERSIÓN (COSTO Y TOTAL CLAROS) */}
                <div className="col-span-2 flex flex-col gap-1 justify-center">
                  <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                    Costo U: <strong className="text-[#1E293B] text-sm">S/ {(item.cost || 0).toFixed(2)}</strong>
                  </span>
                  <span className="text-xs font-bold text-[#10B981] uppercase tracking-wider">
                    Total: <strong className="text-[#1E293B] text-sm">S/ {totalCompra}</strong>
                  </span>
                </div>

                {/* 4. PRECIO DE VENTA */}
                <div className="col-span-1 font-black text-lg text-[#10B981] text-right pr-2">
                  S/ {(item.price || 0).toFixed(2)}
                </div>

                {/* 5. STOCK */}
                <div className="col-span-1 text-center flex justify-center">
                  <EtiquetaStock qty={item.quantity} minStock={item.minStock} unit={item.unit} />
                </div>

                {/* 6. ACCIONES + BOTÓN HISTORIAL LOTE */}
                <div className="col-span-2 text-center flex items-center justify-center gap-3">
                  <button 
                    className="text-[#94A3B8] hover:text-[#3B82F6] transition-colors cursor-pointer" 
                    title="Historial de Lotes / Movimientos"
                    onClick={() => onViewHistory ? onViewHistory(item) : alert(`ABRIENDO HISTORIAL DE LOTES PARA: ${item.code}`)}
                  >
                    <History size={16} />
                  </button>
                  <button 
                    onClick={() => onEditProduct ? onEditProduct(item) : startEditing(item)} 
                    className="text-[#94A3B8] hover:text-[#10B981] transition-colors cursor-pointer" 
                    title="Editar Producto"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm(`⚠️ ADVERTENCIA DE SEGURIDAD\n\n¿Estás absolutamente seguro de eliminar el producto:\n"${item.name}"?\n\nEsta acción es irreversible.`)) {
                        if (onDeleteProduct) onDeleteProduct(item);
                      }
                    }}
                    className="text-[#94A3B8] hover:text-red-500 transition-colors cursor-pointer" 
                    title="Eliminar del Sistema"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* === CONTROLES DE PAGINACIÓN ABAJO === */}
      {renderPagination('bottom')}

    </div>
  );
};