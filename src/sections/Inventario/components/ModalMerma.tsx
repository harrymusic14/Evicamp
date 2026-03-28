import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, Database, Loader2 } from 'lucide-react';
import { supabase } from '../../../db/supabase.ts';
import type { Product } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  productos: Product[];
  onProductSaved?: (product: any, loteId?: string, nuevaCantLote?: number) => void;
  initialData?: any;
}

export const ModalMerma: React.FC<Props> = ({ isOpen, onClose, productos, onProductSaved, initialData }) => {
  // Búsqueda de Producto
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Selección de Lote
  const [lotes, setLotes] = useState<any[]>([]);
  const [selectedLote, setSelectedLote] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingLotes, setLoadingLotes] = useState(false);

  // Formulario
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('DAÑADO');
  const [detalle, setDetalle] = useState('');

  // 🚨 Variable de control PARCHADA: Garantiza que reconozca la edición aunque Supabase no devuelva un ID
  const isEdit = !!initialData && Object.keys(initialData).length > 0;

  // 1. Cargar Lotes cuando se selecciona un producto
  useEffect(() => {
    if (selectedProduct) {
      const fetchLotes = async () => {
        setLoadingLotes(true);
        const { data, error } = await supabase
          .from('batches')
          .select('*')
          .eq('product_id', selectedProduct.id)
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error("Error cargando lotes para merma:", error.message);
          return;
        }

        // Filtro estándar de lotes con stock
        let lotesDisponibles = (data || []).filter(lote => Number(lote.quantity) > 0);

        // 🚨 PARCHE DE RECUPERACIÓN (EDICIÓN): Si el lote de la merma llegó a 0 stock, 
        // lo forzamos a aparecer en la lista para que el sistema no pierda la referencia visual.
        if (initialData?.batch_id) {
          const loteOriginal = data?.find(l => String(l.id) === String(initialData.batch_id));
          if (loteOriginal && !lotesDisponibles.some(l => String(l.id) === String(loteOriginal.id))) {
            lotesDisponibles.push(loteOriginal);
          }
        }

        setLotes(lotesDisponibles);

        // 🚨 PARCHE DE AUTO-SELECCIÓN: Asignar el lote proveniente de la base de datos
        if (initialData?.batch_id) {
          const loteGuardado = lotesDisponibles.find(l => String(l.id) === String(initialData.batch_id));
          setSelectedLote(loteGuardado || null);
        } else {
          setSelectedLote(null); // Si es un registro nuevo, queda en blanco
        }

        setLoadingLotes(false);
      };
      fetchLotes();
    } else {
      setLotes([]);
      setSelectedLote(null);
    }
  }, [selectedProduct, initialData]); // 🚨 Crucial: Escuchar los cambios de initialData

  // 2. Limpieza de memoria e Inyección de datos
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // MODO EDICIÓN
        setSearchQuery(initialData.product_name || '');
        
        // Corrección: Mostrar Soles si fue consumo, o Cantidad si fue físico
        const esConsumoInicial = initialData.reason === 'USO INTERNO' || Number(initialData.quantity) === 0;
        setCantidad(esConsumoInicial ? initialData.total_loss.toString() : Math.abs(initialData.quantity).toString());
        
        setMotivo(initialData.reason || 'DAÑADO');
        setDetalle(initialData.notes || '');
        const p = productos.find(prod => prod.id === initialData.product_id);
        if (p) setSelectedProduct(p);
      } else {
        // MODO NUEVO
        setSearchQuery('');
        setSelectedProduct(null);
        setCantidad('');
        setMotivo('DAÑADO');
        setDetalle('');
      }
    }
  }, [isOpen, initialData, productos]);

  // --- MOTOR DE VALIDACIÓN Y CÁLCULO DE DIFERENCIAL (REACTIVO) ---
  const inputNumVal = Number(cantidad) || 0;
  const esConsumoActivo = selectedProduct?.unit?.toUpperCase().includes('CONS') || 
                          selectedProduct?.category?.toUpperCase().includes('CONS') || 
                          motivo === 'USO INTERNO';
  const costoUnitLote = Number(selectedLote?.cost_unit) || 0;
  
  let cantNumCalculada = 0;
  if (esConsumoActivo) {
    // 🚨 ARQUITECTURA FINANCIERA: Si es consumo, no se descuenta stock físico, solo es gasto.
    cantNumCalculada = 0; 
  } else {
    cantNumCalculada = inputNumVal; // Mantiene Kilos o Unidades para mermas reales
  }

  // 🚨 LÓGICA DE EDICIÓN: Cuánto sacamos ANTES vs Cuánto sacamos AHORA
  const oldCantNum = isEdit ? Math.abs(Number(initialData.quantity)) : 0;
  const diffCant = cantNumCalculada - oldCantNum; // Diferencia real a afectar al inventario

  // Bandera de seguridad adaptada a la diferencia: Solo avisa si el "extra" que sacamos excede el lote
  const excedeStockLote = (selectedLote && !esConsumoActivo && diffCant > 0) ? diffCant > selectedLote.quantity : false;
  // ----------------------------------------------

  if (!isOpen) return null;

  // Filtro inteligente
  const filteredProducts = productos.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 3. Lógica de Guardado (INSERT vs UPDATE)
  const handleSave = async () => {
    if (isSubmitting || excedeStockLote) return;
    setIsSubmitting(true);
    
    // 🚨 EXCEPCIÓN: Si es consumo, NO exigimos que haya un lote seleccionado
    if (!selectedProduct || (!selectedLote && !esConsumoActivo) || !cantidad) {
      setIsSubmitting(false);
      return;
    }
    
    if (inputNumVal <= 0) {
      alert('⚠️ ERROR: El valor debe ser mayor a 0.');
      setIsSubmitting(false);
      return;
    }

    if (excedeStockLote) {
      alert(`⚠️ ERROR TÉCNICO: Estás intentando sacar ${diffCant.toFixed(3)} adicionales, pero el lote solo tiene ${selectedLote.quantity}.`);
      setIsSubmitting(false);
      return;
    }

    // Heredamos los cálculos reactivos
    const cantNum = cantNumCalculada;
    const costUnit = costoUnitLote;
    let totalLoss = esConsumoActivo ? inputNumVal : (costUnit * cantNum);

    try {
      // 1. Detectamos de forma segura si es consumo/uso interno
      const esConsumo = selectedProduct?.unit?.toUpperCase().includes('CONS') || 
                        selectedProduct?.category?.toUpperCase().includes('CONS') || 
                        motivo === 'USO INTERNO';

      // A. ACTUALIZAR o REGISTRAR en Waste (Merma / Gasto)
      if (isEdit) {
        // 🚨 PROTECCIÓN QUIRÚRGICA: Buscar el registro EXACTO a actualizar sin alterar otras mermas del lote
        let updateQuery = supabase.from('waste').update({
          quantity: esConsumo ? 0 : -cantNum,
          total_loss: totalLoss,
          reason: motivo,
          notes: detalle
        });

        if (initialData.id) {
          updateQuery = updateQuery.eq('id', initialData.id);
        } else {
          // NUNCA USAMOS SOLO BATCH_ID. Cruzamos producto, lote y fecha de milisegundo exacto.
          updateQuery = updateQuery.eq('product_id', initialData.product_id);
          if (initialData.batch_id) updateQuery = updateQuery.eq('batch_id', initialData.batch_id);
          
          // 🛡️ PARCHE APLICADO: Si no hay fecha, bloqueamos la fuga usando el dinero como filtro exacto
          if (initialData.raw_date) {
            updateQuery = updateQuery.eq('created_at', initialData.raw_date);
          } else {
            updateQuery = updateQuery.eq('total_loss', initialData.total_loss);
          }
        }
        
        const { error: wasteError } = await updateQuery;
        if (wasteError) throw wasteError;

      } else {
        const { error: wasteError } = await supabase.from('waste').insert([{
          batch_id: selectedLote?.id || null, // 🚨 Permite null si es consumo
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          quantity: esConsumo ? 0 : -cantNum, // 0 unidades si es consumo
          cost_unit: costUnit,
          total_loss: totalLoss, 
          reason: motivo,
          notes: detalle,
          user: 'Sistema',
          previous_quantity: selectedProduct.quantity,
          new_quantity: selectedProduct.quantity - (esConsumo ? 0 : cantNum),
          is_synced: '1'
        }]);
        
        if (wasteError) throw wasteError;
      }

      // B. SOLO ACTUALIZAR STOCK FÍSICO SI NO ES CONSUMO Y SI HUBO DIFERENCIA
      if (!esConsumo && diffCant !== 0) {
        const { error: batchUpdateError } = await supabase
          .from('batches')
          .update({ quantity: selectedLote.quantity - diffCant })
          .eq('id', selectedLote.id);
        if (batchUpdateError) throw batchUpdateError;

        const { error: productUpdateError } = await supabase
          .from('products')
          .update({ quantity: selectedProduct.quantity - diffCant })
          .eq('id', selectedProduct.id);
        if (productUpdateError) throw productUpdateError;

        const tipoOperacion = diffCant > 0 ? 'MERMA' : 'ENTRADA';
        const razonOperacion = diffCant > 0 ? (isEdit ? 'Ampliación Merma' : motivo) : 'Reducción Merma';

        const { error: movementError } = await supabase
          .from('inventory_movements')
          .insert([{
            batch_id: selectedLote.id,
            product_id: selectedProduct.id,
            product_name: selectedProduct.name,
            change_amount: -diffCant, // Negativo si sacamos más, Positivo si devolvemos
            previous_quantity: selectedLote.quantity,
            new_quantity: selectedLote.quantity - diffCant,
            operation_type: tipoOperacion,
            reason: razonOperacion,
            notes: isEdit ? `Corrección de merma [Ref: ${initialData.id || initialData.batch_id || 'Virtual'}]` : detalle || 'Merma manual',
            user: 'Sistema',
            is_synced: 0
          }]);
        if (movementError) throw movementError;
      }

      // Alerta adaptada
      if (esConsumo) {
        alert(`✅ GASTO ${isEdit ? 'ACTUALIZADO' : 'REGISTRADO'}\n\nSe ha registrado un gasto interno de S/ ${totalLoss.toFixed(2)} sin afectar el stock físico.`);
      } else {
        alert(`✅ MERMA ${isEdit ? 'ACTUALIZADA' : 'EXITOSA'}\n\nTotal reportado: ${cantNum.toFixed(3)} unidades (S/ ${totalLoss.toFixed(2)}) de ${selectedProduct.name}.`);
      }
      
      // [ SALIDA ]: Notificamos el cambio al Inventario General y al Control de Lotes
      if (onProductSaved && selectedProduct && selectedLote && diffCant !== 0) {
        const cantFinalLote = selectedLote.quantity - diffCant;
        onProductSaved(
          { ...selectedProduct, quantity: selectedProduct.quantity - diffCant },
          selectedLote.id,
          cantFinalLote
        );
      }

      onClose();
    } catch (error) {
      console.error("Error al guardar transacción:", error);
      alert("❌ Ocurrió un error de conexión al registrar la operación.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1E293B]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono">
      <div className="bg-white w-full max-w-lg border-2 border-[#1E293B] shadow-[8px_8px_0_0_#1E293B] relative flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className={`${isEdit ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'} text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#1E293B] shrink-0`}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} className="text-white" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest">{isEdit ? 'Editar Registro' : 'Registrar Merma'}</h2>
              <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest">{isEdit ? 'Corrección de cantidad o motivo' : 'Salida por daño o pérdida'}</p>
            </div>
          </div>
          <button onClick={onClose} className={`hover:bg-white ${isEdit ? 'hover:text-[#F59E0B]' : 'hover:text-[#EF4444]'} p-1 transition-colors border-2 border-transparent hover:border-[#1E293B]`}>
            <X size={20} />
          </button>
        </div>

        {/* CUERPO DEL MODAL (Scrolleable si es muy largo) */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          
          {/* 1. BUSCADOR DE PRODUCTO DESPLEGABLE */}
          <div className="space-y-2 relative">
            <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">
              { (selectedProduct?.unit?.toUpperCase().includes('CONS') || selectedProduct?.category?.toUpperCase().includes('CONS') || motivo === 'USO INTERNO') 
              ? 'PRECIO / COSTO RETIRADO (S/)' 
              : (selectedProduct?.unit?.toUpperCase() === 'KG' ? 'CANTIDAD PERDIDA (KILOGRAMOS / GRAMOS)' : 'CANTIDAD PERDIDA (UNIDADES)') }
            </label>
            
            {selectedProduct ? (
              <div className={`flex items-center justify-between border-2 border-[#1E293B] ${isEdit ? 'bg-[#F8FAFC]' : 'bg-[#FEF2F2]'} p-3 rounded-none`}>
                <div className="flex flex-col">
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${isEdit ? 'text-[#1E293B]' : 'text-[#EF4444]'}`}>Producto Seleccionado:</span>
                  <span className="text-xs font-black text-[#1E293B] uppercase mt-1">{selectedProduct.code} - {selectedProduct.name}</span>
                </div>
                {/* 🚨 Evitamos que el usuario cambie el producto en modo edición para no cruzar inventarios */}
                {!isEdit && (
                  <button 
                    onClick={() => setSelectedProduct(null)} 
                    className="text-[#EF4444] hover:bg-[#1E293B] hover:text-white p-2 transition-colors cursor-pointer border-2 border-transparent hover:border-[#1E293B]"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] p-3 text-xs font-bold text-[#1E293B] outline-none focus:border-[#EF4444] transition-colors"
                  placeholder="Escribe nombre o código del producto..."
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
                          <span className="text-[9px] font-bold text-[#64748B] group-hover:text-[#EF4444]">{p.code} | Stock: {p.quantity}</span>
                          <span className="text-xs font-black text-[#1E293B] uppercase">{p.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-[10px] font-bold text-[#64748B] uppercase">No encontrado</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. SELECTOR DE LOTE (Oculto si es Consumo, Bloqueado si es Edición para no desfasar otro lote) */}
          {selectedProduct && !esConsumoActivo && (
            <div className="space-y-2 border-l-4 border-[#1E293B] pl-3 py-1">
              <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest flex items-center gap-2">
                <Database size={14} className="text-[#1E293B]" /> 2. Seleccionar Lote Afectado *
              </label>
              <select 
                value={selectedLote?.id || ''}
                onChange={(e) => {
                  const loteEncontrado = lotes.find(l => String(l.id) === String(e.target.value));
                  setSelectedLote(loteEncontrado || null);
                }}
                disabled={loadingLotes || lotes.length === 0 || isEdit}
                className={`w-full ${isEdit ? 'bg-[#F1F5F9]' : 'bg-[#F8FAFC]'} border-2 border-[#E2E8F0] p-3 text-xs font-bold text-[#1E293B] uppercase outline-none focus:border-[#1E293B] transition-colors ${isEdit ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <option value="">{loadingLotes ? 'CARGANDO LOTES...' : lotes.length === 0 ? 'SIN LOTES CON STOCK' : '-- SELECCIONAR LOTE --'}</option>
                {lotes.map(l => (
                  <option key={l.id} value={l.id}>
                    F. Ingreso: {new Date(l.created_at).toLocaleDateString()} | Stock Actual: {l.quantity} | Costo: S/{Number(l.cost_unit).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">
                {(selectedProduct?.unit?.toUpperCase().includes('CONS') || selectedProduct?.category?.toUpperCase().includes('CONS') || motivo === 'USO INTERNO') 
                ? 'Costo Total (S/)' 
                : (selectedProduct?.unit?.toUpperCase() === 'KG' ? 'Cantidad (Kilos / Gramos)' : 'Cantidad (Unidades)')}
              </label>
              <input
                type="number"
                value={cantidad}
                step={(selectedProduct as any)?.control_type === 'WEIGHT' || selectedProduct?.unit === 'KG' ? "0.001" : "1"}
                onChange={(e) => {
                  const val = e.target.value;
                  const isUnidad = (selectedProduct as any)?.control_type === 'UND' || selectedProduct?.unit === 'UND';
                  if (isUnidad && !esConsumoActivo) {
                    setCantidad(val.replace(/[.,]/g, ''));
                  } else {
                    setCantidad(val);
                  }
                }}
                className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] p-3 text-xs font-bold text-[#1E293B] outline-none focus:border-[#1E293B] transition-colors"
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">
                Motivo
              </label>
              <select 
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] p-3 text-xs font-bold text-[#1E293B] uppercase outline-none focus:border-[#1E293B] transition-colors"
              >
                <option value="DAÑADO">Producto Dañado</option>
                <option value="VENCIDO">Fecha Vencida</option>
                <option value="ROBO">Pérdida / Robo</option>
                <option value="USO INTERNO">Uso Interno</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">
              Detalle / Observación
            </label>
            <textarea 
              rows={3}
              placeholder="Ej: Se cayó el frasco al momento de acomodar la estantería..."
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] p-3 text-xs font-bold text-[#1E293B] outline-none focus:border-[#1E293B] transition-colors resize-none"
            />
          </div>

        </div>

        {/* FOOTER Y BOTONES */}
        <div className="p-6 bg-[#F8FAFC] border-t-2 border-[#E2E8F0] flex justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-3 border-2 border-[#E2E8F0] text-[#64748B] font-black text-[10px] uppercase tracking-widest hover:bg-white hover:border-[#1E293B] hover:text-[#1E293B] transition-all rounded-none"
          >
            Cancelar
          </button>
          
          <button 
            type="button"
            onClick={handleSave}
            disabled={
              !selectedProduct || 
              (!selectedLote && !esConsumoActivo) || 
              !cantidad ||
              parseFloat(cantidad) <= 0 || 
              isSubmitting || 
              excedeStockLote || 
              (((selectedProduct as any)?.control_type === 'UND' || selectedProduct?.unit === 'UND') && !esConsumoActivo && !Number.isInteger(Number(cantidad)))
            }
            className={`px-6 py-3 border-2 border-[#1E293B] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-[4px_4px_0_0_#1E293B] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] rounded-none ${excedeStockLote ? 'bg-[#94A3B8] text-white cursor-not-allowed' : 'bg-[#1E293B] text-white hover:bg-[#EF4444] disabled:opacity-50'}`}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (excedeStockLote ? <AlertTriangle size={16} /> : <Save size={16} />)}
            <span>
              {isSubmitting ? 'PROCESANDO...' : 
               excedeStockLote ? '⚠️ EXCEDE EL STOCK' : 
               (isEdit ? 'Guardar Cambios' : 'Confirmar Merma')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};