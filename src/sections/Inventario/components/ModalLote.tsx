import React, { useState, useEffect } from 'react';
import { X, Save, Database, Search, Calculator, FileText, Check, Calendar, Loader2 } from 'lucide-react';
import type { Product } from '../types';
import { supabase } from '../../../db/supabase';
interface Props {
  isOpen: boolean;
  onClose: () => void;
  productos: Product[];
  initialProduct?: Product | null;
  initialLote?: any | null; // <-- NUEVO: EL LOTE A EDITAR
  onLoteSaved?: (lote: any) => void;
}

export const ModalLote: React.FC<Props> = ({ isOpen, onClose, productos, initialProduct, initialLote, onLoteSaved }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false); // <-- NUEVO ESTADO
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cantidad, setCantidad] = useState('');
  const [costoTotal, setCostoTotal] = useState('');
  const [sustento, setSustento] = useState('');
  const [omitirSustento, setOmitirSustento] = useState(false);
  const [expiration, setExpiration] = useState('');

  // Limpiar memoria o Cargar Lote si es modo edición
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setShowDropdown(false);

      if (initialLote) {
        // === MODO EDICIÓN ===
        const prod = productos.find(p => p.id === initialLote.product_id) || null;
        setSelectedProduct(prod);
        setCantidad(initialLote.initial_quantity?.toString() || '');
        
        // Calculamos el costo total reverso (costo_unitario * cantidad_inicial)
        const cTotal = (Number(initialLote.cost_unit) * Number(initialLote.initial_quantity)).toFixed(2);
        setCostoTotal(cTotal);
        
        if (initialLote.document_ref === 'OMITIDO / SIN SUSTENTO') {
          setOmitirSustento(true);
          setSustento('');
        } else {
          setOmitirSustento(false);
          setSustento(initialLote.document_ref || '');
        }
        setExpiration(initialLote.expiration_date || '');

      } else {
        // === MODO CREACIÓN ===
        setSelectedProduct(initialProduct || null);
        setCantidad('');
        setCostoTotal('');
        setSustento('');
        setOmitirSustento(false);
        setExpiration('');
      }
    }
  }, [isOpen, initialProduct, initialLote, productos]);

  // --- NUEVO: CARGAR PROVEEDORES DESDE LA BASE DE DATOS ---
  const [proveedoresActivos, setProveedoresActivos] = useState<any[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      const fetchProveedores = async () => {
        const { data } = await supabase
          .from('providers')
          .select('id, razon_social')
          .eq('estado', 'ACTIVO')
          .order('razon_social');
        if (data) setProveedoresActivos(data);
      };
      fetchProveedores();
    }
  }, [isOpen]);
  // --------------------------------------------------------

  if (!isOpen) return null;

  // Motor de filtrado ultra-rápido (EXCLUYE LOS PRODUCTOS DE CONSUMO INTERNO)
  const filteredProducts = productos.filter(p => 
    p.unit !== 'CONSUMO' && // <-- BLOQUEO ESTRICTO: NO MOSTRAR CONSUMO AQUÍ
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // FÓRMULA MATEMÁTICA AUTOMÁTICA (Costo Unitario)
  const costoUnitario = (Number(costoTotal) > 0 && Number(cantidad) > 0) 
    ? (Number(costoTotal) / Number(cantidad)).toFixed(2) 
    : '0.00';

  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const documento = omitirSustento ? 'OMITIDO / SIN SUSTENTO' : (sustento || 'SIN SUSTENTO');

    try {
      if (initialLote) {
        // === MODO EDICIÓN ===
        const { error } = await supabase
          .from('batches')
          .update({
            expiration_date: expiration || null,
            cost_unit: Number(costoUnitario),
            document_ref: documento,
          })
          .eq('id', initialLote.id);

        if (error) throw error;

        if (onLoteSaved && selectedProduct) {
          onLoteSaved({ ...initialLote, expiration_date: expiration, cost_unit: Number(costoUnitario), document_ref: documento });
        }
        alert(`LOTE ACTUALIZADO.\nProducto: ${selectedProduct?.name}`);

      } else {
        // === MODO CREACIÓN (DELEGACIÓN DE IDs A POSTGRESQL) ===
        // RETORNO TÉCNICO: Generación de ID manual ya que la DB no tiene Auto-Increment activo en batches
        const generatedId = Date.now().toString();

        const { data: newBatch, error: batchError } = await supabase
          .from('batches')
          .insert([{
            id: generatedId, // <-- INYECCIÓN FORZADA DEL ID
            product_id: selectedProduct?.id,
            quantity: Number(cantidad), 
            initial_quantity: Number(cantidad),
            expiration_date: expiration || null,
            cost_unit: Number(costoUnitario),
            document_ref: documento,
            is_synced: '1'
          }])
          .select()
          .single();

        if (batchError) throw batchError;

        // === REGISTRO DE MOVIMIENTO USANDO EL ID REAL CREADO POR LA BASE DE DATOS ===
        const { error: movError } = await supabase
          .from('inventory_movements')
          .insert([{
            batch_id: newBatch.id, // ID Oficial generado por Supabase
            product_id: selectedProduct?.id,
            product_name: selectedProduct?.name,
            change_amount: Number(cantidad), // <-- ¡CLAVE! Enviar como número, no texto
            previous_quantity: 0,            // <-- Número, sin comillas
            new_quantity: Number(cantidad),  // <-- Número, sin comillas
            operation_type: 'COMPRA',
            reason: 'Ingreso Lote',
            notes: 'Doc: ' + documento,
            user: 'Sistema',
            is_synced: '1'
          }]);

        if (movError) throw movError;

        if (onLoteSaved && selectedProduct) {
          onLoteSaved({
            ...newBatch,
            product_name: selectedProduct.name,
            category: selectedProduct.category || 'GENERAL',
            unit: selectedProduct.unit
          });
        }
        alert(`LOTE REGISTRADO CORRECTAMENTE.\nCantidad sumada al stock global: ${cantidad}`);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1E293B]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono">
      <div className="bg-white w-full max-w-2xl border-2 border-[#1E293B] shadow-[8px_8px_0_0_#1E293B] flex flex-col max-h-[75vh] mt-10">
        
        {/* CABECERA */}
        <div className="bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Database size={24} className="text-[#10B981]" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#10B981]">Ingresar Lote de Stock</h2>
              <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest">Añadir existencias al inventario</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:text-[#EF4444] transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* CUERPO DEL FORMULARIO */}
        <div className="p-6 overflow-y-auto custom-scrollbar bg-[#F8FAFC] flex-1 space-y-6">
          
          {/* 1. BUSCADOR DE PRODUCTO DESPLEGABLE */}
          <div className="space-y-2 relative">
            <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest flex items-center gap-2">
              <Search size={14} className="text-[#10B981]"/> 1. Buscar Producto *
            </label>
            
            {selectedProduct ? (
              <div className="flex items-center justify-between border-2 border-[#10B981] bg-[#ECFDF5] p-3 rounded-none">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-[#10B981] uppercase tracking-wider">Producto Seleccionado:</span>
                  <span className="text-xs font-black text-[#1E293B] uppercase mt-1">{selectedProduct.code} - {selectedProduct.name}</span>
                </div>
                <button 
                  onClick={() => setSelectedProduct(null)} 
                  className="text-[#EF4444] hover:bg-[#FECACA] p-2 transition-colors cursor-pointer border-2 border-transparent hover:border-[#EF4444]"
                  title="Cambiar Producto"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input 
                  type="text"
                  placeholder="ESCRIBE CÓDIGO O NOMBRE DEL PRODUCTO..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full bg-white border-2 border-[#E2E8F0] p-3 text-xs font-black text-[#1E293B] uppercase outline-none focus:border-[#10B981] transition-colors"
                />
                {showDropdown && searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-[#1E293B] shadow-[4px_4px_0_0_#1E293B] z-50 max-h-48 overflow-y-auto custom-scrollbar">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(p => (
                        <div 
                          key={p.id} 
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedProduct(p);
                            setShowDropdown(false);
                            setSearchQuery('');
                          }}
                          className="flex flex-col p-3 hover:bg-[#F8FAFC] border-b border-[#E2E8F0] cursor-pointer group"
                        >
                          <span className="text-[9px] font-bold text-[#64748B] group-hover:text-[#10B981]">{p.code} | {p.category}</span>
                          <span className="text-xs font-black text-[#1E293B] uppercase">{p.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-[10px] font-bold text-[#64748B] uppercase">No se encontraron productos</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. CANTIDAD Y COSTO TOTAL */}
          <div className="grid grid-cols-2 gap-4 border-t-2 border-[#E2E8F0] pt-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest flex justify-between">
                <span>2. Cantidad *</span>
                <span className="text-[#10B981]">{selectedProduct ? `(${selectedProduct.unit})` : ''}</span>
              </label>
              <div className="flex border-2 border-[#E2E8F0] bg-white focus-within:border-[#10B981] transition-colors">
                <input 
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  disabled={!selectedProduct}
                  className="w-full p-3 text-sm font-black text-[#1E293B] outline-none disabled:bg-[#F1F5F9] disabled:cursor-not-allowed text-right"
                />
                <div className="bg-[#F8FAFC] px-4 border-l-2 border-[#E2E8F0] flex items-center justify-center text-[10px] font-black text-[#64748B] w-16 shrink-0">
                  {selectedProduct ? selectedProduct.unit : '---'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">
                3. Costo Compra (Total)
              </label>
              <div className="flex border-2 border-[#E2E8F0] bg-white focus-within:border-[#10B981] transition-colors">
                <div className="bg-[#F8FAFC] px-4 border-r-2 border-[#E2E8F0] flex items-center justify-center text-[10px] font-black text-[#64748B] shrink-0">
                  S/
                </div>
                <input 
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={costoTotal}
                  onChange={(e) => setCostoTotal(e.target.value)}
                  disabled={!selectedProduct}
                  className="w-full p-3 text-sm font-black text-[#1E293B] outline-none disabled:bg-[#F1F5F9] disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* 3. FÓRMULA MATEMÁTICA: COSTO UNITARIO AUTOMÁTICO */}
          <div className="bg-[#1E293B] p-4 flex items-center justify-between shadow-inner">
            <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Calculator size={14} className="text-[#10B981]" /> Costo Unitario Automático
            </span>
            <span className="text-xl font-black text-[#10B981]">
              S/ {costoUnitario}
            </span>
          </div>

          {/* 4. SUSTENTO TRIBUTARIO Y VENCIMIENTO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t-2 border-[#E2E8F0] pt-6">
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} /> 4. Sustento (Doc. Proveedor)
              </label>
              <div className="flex flex-col gap-3 relative">
                <input 
                  type="text"
                  placeholder={omitirSustento ? "OMITIDO / SIN SUSTENTO..." : "BUSCAR PROVEEDOR O DOC..."}
                  value={omitirSustento ? '' : sustento}
                  onChange={(e) => {
                    setSustento(e.target.value.toUpperCase());
                    setShowProviderDropdown(true);
                  }}
                  onFocus={() => setShowProviderDropdown(true)}
                  onBlur={() => setTimeout(() => setShowProviderDropdown(false), 200)}
                  disabled={omitirSustento || !selectedProduct}
                  className="w-full bg-white border-2 border-[#E2E8F0] p-3 text-xs font-black text-[#1E293B] uppercase outline-none focus:border-[#10B981] transition-colors disabled:bg-[#F1F5F9] disabled:text-[#94A3B8]"
                />

                {/* BUSCADOR DESPLEGABLE DE PROVEEDORES */}
                {showProviderDropdown && !omitirSustento && selectedProduct && (
                  <div className="absolute top-[48px] left-0 right-0 bg-white border-2 border-[#1E293B] shadow-[4px_4px_0_0_#1E293B] z-50 max-h-40 overflow-y-auto custom-scrollbar">
                    {proveedoresActivos.filter(p => p.razon_social.includes(sustento)).length > 0 ? (
                      proveedoresActivos.filter(p => p.razon_social.includes(sustento)).map(prov => (
                        <div 
                          key={prov.id}
                          onMouseDown={(e) => {
                            e.preventDefault(); // Evita que el onBlur cierre la ventana antes del click
                            setSustento(prov.razon_social);
                            setShowProviderDropdown(false);
                          }}
                          className="p-3 hover:bg-[#F8FAFC] border-b border-[#E2E8F0] cursor-pointer"
                        >
                          <span className="text-xs font-black text-[#1E293B] uppercase">{prov.razon_social}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-[10px] font-bold text-[#64748B] uppercase text-center bg-[#F8FAFC]">
                        ESCRIBE LIBREMENTE SI NO ESTÁ EN LA LISTA
                      </div>
                    )}
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer w-max group">
                  <div className={`w-4 h-4 border-2 flex items-center justify-center transition-colors ${omitirSustento ? 'bg-[#EF4444] border-[#EF4444]' : 'border-[#94A3B8] bg-white group-hover:border-[#EF4444]'}`}>
                    {omitirSustento && <Check size={12} className="text-white" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={omitirSustento} 
                    onChange={() => setOmitirSustento(!omitirSustento)} 
                    disabled={!selectedProduct} 
                  />
                  <span className="text-[9px] font-bold text-[#64748B] uppercase select-none group-hover:text-[#EF4444]">
                    Ingresar sin sustento tributario
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} /> Fecha Vencimiento (Opcional)
              </label>
              <input 
                type="date"
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                disabled={!selectedProduct}
                className="w-full bg-white border-2 border-[#E2E8F0] p-3 text-xs font-black text-[#1E293B] uppercase outline-none focus:border-[#10B981] transition-colors disabled:bg-[#F1F5F9]"
              />
            </div>

          </div>

        </div>

        {/* PIE DE PÁGINA (BOTONES) */}
        <div className="p-6 bg-white border-t-2 border-[#E2E8F0] flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-3 border-2 border-[#E2E8F0] text-[#64748B] font-black text-[10px] uppercase tracking-widest hover:bg-[#F8FAFC] hover:border-[#1E293B] hover:text-[#1E293B] transition-all cursor-pointer rounded-none"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={!selectedProduct || !cantidad || Number(cantidad) <= 0 || isSubmitting}
            className="bg-[#10B981] text-[#1E293B] px-6 py-3 border-2 border-[#1E293B] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#1E293B] hover:text-[#10B981] transition-all cursor-pointer rounded-none shadow-[4px_4px_0_0_#1E293B] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {isSubmitting ? 'PROCESANDO...' : 'Guardar Lote'}
          </button>
        </div>

      </div>
    </div>
  );
};