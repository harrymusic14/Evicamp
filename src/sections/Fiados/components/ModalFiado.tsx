import React, { useState, useEffect } from 'react';
import { X, Save, UserPlus, Package, Search, Plus, Trash2, ChevronDown } from 'lucide-react';
import { supabase } from '../../../db/supabase';
import type { Fiado, FiadoDetalle, Cliente } from '../types';
import type { Product } from '../../Inventario/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fiado: Partial<Fiado>) => void;
  fiadoAEditar?: Fiado | null;
  clientes: Cliente[];
  productos: Product[]; // Recibe el inventario
}

export const ModalFiado: React.FC<Props> = ({ isOpen, onClose, onSave, fiadoAEditar, clientes, productos }) => {
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [detalles, setDetalles] = useState<FiadoDetalle[]>([]);
  const [searchProd, setSearchProd] = useState('');
  
  // Nuevos estados para el buscador de clientes
  const [searchCliente, setSearchCliente] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Sincronizar datos al abrir
  useEffect(() => {
    if (isOpen) {
      if (fiadoAEditar) {
        setClienteSeleccionado(fiadoAEditar.clienteNombre);
        setSearchCliente(''); // Limpiar búsqueda
        setFechaVencimiento(fiadoAEditar.fechaVencimiento.split('T')[0]);
        setDetalles(fiadoAEditar.detalles || []);
      } else {
        setClienteSeleccionado('');
        setSearchCliente(''); // Limpiar búsqueda
        setFechaVencimiento('');
        setDetalles([]);
      }
      setSearchProd('');
      setIsDropdownOpen(false); // Asegurar que el menú inicie cerrado
    }
  }, [isOpen, fiadoAEditar]);

  if (!isOpen) return null;

  // LÓGICA DE INVENTARIO: Buscar y Agregar
  // Añadimos p.name ? para asegurarnos de que el producto tiene nombre antes de buscar
  const prodFiltrados = searchProd.trim() === '' ? [] : productos.filter(p => p.name && p.name.toLowerCase().includes(searchProd.toLowerCase())).slice(0, 5);

  const agregarProducto = (prod: Product) => {
    const existe = detalles.find(d => d.productoId === prod.id);
    if (existe) {
      setDetalles(detalles.map(d => d.productoId === prod.id ? { ...d, qty: Number(d.qty) + 1, subtotal: (Number(d.qty) + 1) * d.price } : d));
    } else {
      
      // INTERCEPCIÓN TÉCNICA: Motor de detección profunda de medida
      // Atrapa variantes de base de datos y las unifica para la Interfaz (UI)
      const esConsumo = prod.control_type === 'CONSUMO' || 
                        prod.control_type === 'SERVICE' || 
                        (prod as any).unit === 'CONSUMO' ||
                        prod.category?.toUpperCase() === 'SERVICIOS';

      setDetalles([...detalles, { 
        productoId: prod.id, 
        name: prod.name, 
        qty: 1, 
        price: prod.price, 
        subtotal: prod.price,
        // Asignación inteligente y segura:
        control_type: esConsumo ? 'CONSUMO' : prod.control_type 
      }]);
    }
    setSearchProd('');
  };

  // LÓGICA 1: Digitar Cantidad/Kilos -> Calcula Precio
  const updateQty = (idProd: string, newQty: any) => {
    setDetalles(detalles.map(d => {
      if (d.productoId === idProd) {
        let numericQty = Number(newQty);
        if (numericQty < 0) return d;

        // BARRERA DE SEGURIDAD: Si es UNIDAD, bloqueamos el ingreso de puntos decimales
        if (d.control_type !== 'WEIGHT' && newQty.toString().includes('.')) {
          return d; 
        }

        return { ...d, qty: newQty, subtotal: numericQty * d.price };
      }
      return d;
    }));
  };

  // LÓGICA 2: Digitar Precio Directo -> Calcula Kilos (O acepta el total si es CONSUMO)
  const updateSubtotalDirecto = (idProd: string, newSubtotal: any) => {
    setDetalles(detalles.map(d => {
      if (d.productoId === idProd) {
        const numericSub = Number(newSubtotal);
        if (numericSub < 0) return d;
        
        // REGLA PARA CONSUMO: La cantidad siempre es 1, solo cambia el dinero
        if (d.control_type === 'CONSUMO' || d.control_type === 'SERVICE') {
          return { 
            ...d, 
            qty: 1, 
            subtotal: newSubtotal 
          };
        }

        // Fórmula de mercado para KILOS: Peso = Dinero Pagado / Precio por Kilo
        const calculatedQty = numericSub / d.price;
        
        return { 
          ...d, 
          qty: newSubtotal === '' ? '' : Number(calculatedQty.toFixed(3)), 
          subtotal: newSubtotal 
        };
      }
      return d;
    }));
  };

  const removeProd = (idProd: string) => {
    setDetalles(detalles.filter(d => d.productoId !== idProd));
  };

  // CÁLCULO BLINDADO: Fuerza la conversión a número antes de sumar
  const totalCalculado = detalles.reduce((acc, d) => acc + Number(d.subtotal || 0), 0);

  const handleSave = async () => {
    if (!clienteSeleccionado) return alert('Selecciona un cliente.');
    if (detalles.length === 0) return alert('Agrega al menos un producto.');
    if (!fechaVencimiento) return alert('Selecciona una fecha de vencimiento.');

    const cli = clientes.find(c => c.nombre === clienteSeleccionado);
    
    try {
      if (fiadoAEditar) {
        // MODO EDICIÓN: Solo permite modificar la fecha de vencimiento
        const { error } = await supabase.from('fiados').update({
          expected_pay_date: fechaVencimiento
        }).eq('id', fiadoAEditar.id);
        
        if (error) throw error;
        alert('✅ Fecha de vencimiento actualizada correctamente.');
      } else {
        // MODO NUEVO FIADO
        const idVenta = Date.now(); // 🔥 Generamos ID único para Reportes
        const idFiado = idVenta + 1; // 🔥 Generamos ID único para el Fiado

        // 1. Crear Venta de respaldo para cuadrar las finanzas
        const { error: ventaError } = await supabase.from('sales').insert([{
          id: idVenta,
          total: totalCalculado,
          payment_type: 'credito',
          amount_credit: totalCalculado,
          taxable_amount: 0,
          igv_amount: 0,
          total_exempt: totalCalculado,
          is_synced: 1,
          created_at: new Date().toISOString() // 🔥 LA PIEZA FALTANTE: Ahora Reportes sabrá de qué día es
        }]).select().single();
        if (ventaError) throw ventaError;

        // 2. Insertar los productos en los detalles de la venta
        const saleDetails = detalles.map(d => ({
          sale_id: idVenta,
          product_id: d.productoId,
          product_name: d.name,
          quantity: Number(d.qty), // <-- Forzamos el tipo numérico técnico
          price_at_moment: d.price,
          subtotal: Number(d.subtotal), // <-- Forzamos el tipo numérico técnico
          is_synced: '1'
        }));
        await supabase.from('sale_details').insert(saleDetails);

        // 3. Crear el Documento de Deuda (Fiado)
        const { error: fiadoError } = await supabase.from('fiados').insert([{
          id: idFiado,
          sale_id: idVenta,
          customer_id: cli?.id ? Number(cli.id) : null,
          customer_name: clienteSeleccionado,
          amount: totalCalculado,
          date_given: new Date().toISOString(),
          expected_pay_date: fechaVencimiento,
          status: 'PENDIENTE',
          paid_amount: 0,
          is_synced: '1'
        }]);
        if (fiadoError) throw fiadoError;

        // 4. Descontar Inventario automáticamente
        for (const det of detalles) {
          const prod = productos.find(p => p.id === det.productoId);
          if (prod) {
            await supabase.from('products').update({ quantity: prod.quantity - Number(det.qty) }).eq('id', prod.id);
            await supabase.from('inventory_movements').insert([{
              product_id: prod.id,
              product_name: prod.name,
              change_amount: -Number(det.qty),
              operation_type: 'VENTA',
              reason: 'Venta a Crédito (Fiado)',
              is_synced: '1',
              user: 'Sistema'
            }]);
          }
        }
        alert('✅ Fiado guardado, venta registrada e inventario descontado.');
      }
      
      onSave({}); // Refrescar la interfaz
    } catch (e: any) {
      alert('Error técnico en BD: ' + e.message);
    }
  };

  const isEdit = !!fiadoAEditar;

  return (
    <div className="fixed inset-0 bg-[#1E293B]/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 font-mono">
      <div className="bg-white w-full max-w-4xl border-2 border-[#1E293B] shadow-[8px_8px_0_0_#1E293B] flex flex-col h-[85vh]">
        
        <div className="bg-[#1E293B] text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <UserPlus className="text-[#F59E0B]" size={20} />
            <h2 className="text-sm font-black uppercase tracking-widest text-white">
              {isEdit ? 'Renegociar Fecha de Vencimiento' : 'Nueva Deuda desde Inventario'}
            </h2>
          </div>
          <button onClick={onClose} className="hover:text-[#EF4444] transition-colors"><X size={20} /></button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* PANEL IZQUIERDO: CLIENTE Y PRODUCTOS */}
          <div className="w-1/2 p-6 bg-[#F8FAFC] border-r-2 border-[#E2E8F0] flex flex-col gap-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            <div className="space-y-1 relative">
              <label className="text-[10px] font-black uppercase text-[#64748B]">Seleccionar Cliente *</label>
              
              <div 
                className={`flex items-center justify-between border-2 border-[#E2E8F0] bg-white p-2 cursor-text transition-colors rounded-none ${isEdit ? 'bg-[#F8FAFC] cursor-not-allowed opacity-70' : 'focus-within:border-[#F59E0B]'}`}
                onClick={() => !isEdit && setIsDropdownOpen(true)}
              >
                <input
                  type="text"
                  placeholder="-- BUSCAR / ELEGIR CLIENTE --"
                  value={isDropdownOpen ? searchCliente : clienteSeleccionado}
                  onChange={(e) => {
                    setSearchCliente(e.target.value);
                    setClienteSeleccionado(''); // Al tipear, borramos la selección rígida para forzar a buscar
                    setIsDropdownOpen(true);
                  }}
                  disabled={isEdit}
                  className="w-full text-xs font-black uppercase outline-none bg-transparent disabled:text-[#94A3B8]"
                />
                <button 
                  type="button"
                  disabled={isEdit}
                  onClick={(e) => { e.stopPropagation(); if (!isEdit) setIsDropdownOpen(!isDropdownOpen); }}
                  className="ml-2 text-[#64748B] hover:text-[#1E293B] cursor-pointer disabled:cursor-not-allowed"
                >
                  {isDropdownOpen ? <X size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* LISTA DESPLEGABLE CON FILTRO */}
              {isDropdownOpen && !isEdit && (
                <div className="absolute z-50 top-[100%] left-0 w-full mt-1 bg-white border-2 border-[#1E293B] shadow-[4px_4px_0_0_#1E293B] max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] rounded-none">
                  {clientes.filter(c => c.nombre.toLowerCase().includes(searchCliente.toLowerCase())).length === 0 ? (
                    <div className="p-3 text-xs font-bold text-[#64748B] uppercase text-center bg-[#F8FAFC]">
                      NO SE ENCONTRARON CLIENTES
                    </div>
                  ) : (
                    clientes
                      .filter(c => c.nombre.toLowerCase().includes(searchCliente.toLowerCase()))
                      .map(c => (
                        <div
                          key={c.id}
                          className="p-3 text-xs font-black uppercase text-[#1E293B] hover:bg-[#F59E0B] hover:text-white cursor-pointer border-b border-[#E2E8F0] last:border-0 transition-colors"
                          onClick={() => {
                            setClienteSeleccionado(c.nombre);
                            setSearchCliente('');
                            setIsDropdownOpen(false);
                          }}
                        >
                          {c.nombre} <span className="text-[10px] font-bold text-inherit opacity-70 ml-2">{c.dni ? `(DNI: ${c.dni})` : ''}</span>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[#F59E0B]">Fecha Límite Pago *</label>
              <input type="date" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} className="w-full border-2 border-[#E2E8F0] p-2 text-xs font-black focus:border-[#F59E0B] outline-none" />
            </div>

            {/* BUSCADOR DE INVENTARIO (OCULTO EN EDICIÓN) */}
            {!isEdit && (
              <div className="mt-4 border-t-2 border-dashed border-[#E2E8F0] pt-4">
                <label className="text-[10px] font-black uppercase text-[#64748B] flex items-center gap-2 mb-2"><Package size={14}/> Buscar en Inventario</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input type="text" value={searchProd} onChange={e => setSearchProd(e.target.value)} placeholder="ESCRIBE UN PRODUCTO..." className="w-full bg-white border-2 border-[#E2E8F0] p-2 pl-9 text-xs font-black uppercase outline-none focus:border-[#3B82F6]" />
                </div>
                {prodFiltrados.length > 0 && (
                  <div className="mt-1 bg-white border-2 border-[#E2E8F0] max-h-40 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {prodFiltrados.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => agregarProducto(p)}
                        className="flex justify-between items-center p-2 border-b border-[#E2E8F0] hover:bg-[#F8FAFC] cursor-pointer group"
                      >
                        <div>
                          <p className="text-xs font-black text-[#1E293B] uppercase">{p.name}</p>
                          <p className="text-[9px] font-bold text-[#64748B]">Stock: {p.quantity} | S/ {p.price}</p>
                        </div>
                        <div className="p-1 bg-[#1E293B] text-white group-hover:bg-[#3B82F6] transition-colors"><Plus size={14}/></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PANEL DERECHO: CARRITO / DETALLE DE LA DEUDA */}
          <div className="w-1/2 p-6 bg-white flex flex-col">
            <div className="flex flex-col mb-4 border-b-2 border-[#E2E8F0] pb-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#1E293B]">
                {isEdit ? 'Detalle de la deuda (Solo Lectura)' : 'Productos a fiar'}
              </h3>
              {isEdit && <span className="text-[9px] font-black tracking-widest text-[#EF4444] uppercase mt-1">⚠️ En modo edición solo se puede modificar la fecha. Los productos están bloqueados por seguridad contable.</span>}
            </div>
            
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {detalles.length === 0 ? (
                <p className="text-center text-[#94A3B8] font-bold text-xs mt-10">No hay productos agregados.</p>
              ) : (
                detalles.map(d => (
                  <div key={d.productoId} className="flex justify-between items-center border-2 border-[#E2E8F0] p-2">
                    <div className="flex-1">
                      <p className="text-xs font-black text-[#1E293B] uppercase leading-tight line-clamp-1">{d.name}</p>
                      <p className="text-[10px] font-bold text-[#64748B]">S/ {d.price.toFixed(2)} c/u</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      
                      {/* CAJA DE CANTIDAD / KILOS / CONSUMO */}
                      <div className="flex flex-col items-center border-2 border-[#E2E8F0] overflow-hidden">
                        {isEdit ? (
                          <span className="w-16 p-1 text-center text-xs font-black bg-[#F8FAFC] text-[#94A3B8]">{d.qty}</span>
                        ) : d.control_type === 'CONSUMO' || d.control_type === 'SERVICE' ? (
                          <span className="w-16 p-1 text-center text-xs font-black bg-[#F8FAFC] text-[#94A3B8] cursor-not-allowed">1</span>
                        ) : (
                          <input 
                            type="number" 
                            step={d.control_type === 'WEIGHT' ? "any" : "1"}
                            value={d.qty} 
                            onChange={e => updateQty(d.productoId, e.target.value)} 
                            className="w-16 p-1 text-center text-xs font-black outline-none bg-transparent placeholder:text-[#CBD5E1]" 
                            min={0} 
                            placeholder="0"
                            title={d.control_type === 'WEIGHT' ? "Ingresar Kilos" : "Ingresar Unidades"}
                          />
                        )}
                        {/* Indicador visual técnico de medida */}
                        {d.control_type === 'WEIGHT' ? (
                          <div className="bg-[#1E293B] text-white text-[8px] font-black w-full text-center tracking-widest py-0.5 uppercase">Kilo</div>
                        ) : d.control_type === 'CONSUMO' || d.control_type === 'SERVICE' ? (
                          <div className="bg-[#F59E0B] text-[#1E293B] text-[8px] font-black w-full text-center tracking-widest py-0.5 uppercase">Serv</div>
                        ) : (
                          <div className="bg-[#E2E8F0] text-[#64748B] text-[8px] font-black w-full text-center tracking-widest py-0.5 uppercase">Und</div>
                        )}
                      </div>
                      
                      {/* CAJA DE SUBTOTAL (Texto Fijo para UND, Input Editable para KILOS y CONSUMOS) */}
                      {!isEdit && (d.control_type === 'WEIGHT' || d.control_type === 'CONSUMO' || d.control_type === 'SERVICE') ? (
                        <div className="flex items-center border-b-2 border-[#1E293B] w-20 justify-end focus-within:border-[#F59E0B] transition-colors group">
                          <span className="text-[10px] font-black text-[#1E293B] mr-1">S/</span>
                          <input 
                            type="number"
                            step="any"
                            value={d.subtotal}
                            onChange={e => updateSubtotalDirecto(d.productoId, e.target.value)}
                            className="w-full text-right text-xs font-black text-[#F59E0B] outline-none bg-transparent placeholder:text-[#CBD5E1]"
                            placeholder="0.00"
                            title={d.control_type === 'WEIGHT' ? "Ingresar precio directo (Calcula Kilos)" : "Ingresar precio del servicio"}
                          />
                        </div>
                      ) : (
                        <span className="text-xs font-black text-[#1E293B] w-20 text-right">
                          S/ {Number(d.subtotal).toFixed(2)}
                        </span>
                      )}

                      {!isEdit && (
                        <button onClick={() => removeProd(d.productoId)} className="text-[#EF4444] hover:bg-[#FEF2F2] p-1.5 transition-colors rounded-none border border-transparent hover:border-[#FEF2F2]">
                          <Trash2 size={16}/>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t-2 border-[#E2E8F0]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-black uppercase">Total Deuda:</span>
                <span className="text-2xl font-black text-[#F59E0B]">S/ {totalCalculado.toFixed(2)}</span>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-3 border-2 border-[#E2E8F0] text-[#64748B] text-[10px] font-black uppercase hover:border-[#1E293B]">Cancelar</button>
                <button onClick={handleSave} className="flex-1 py-3 bg-[#F59E0B] text-[#1E293B] border-2 border-[#1E293B] text-xs font-black uppercase flex items-center justify-center gap-2 shadow-[2px_2px_0_0_#1E293B] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                  <Save size={16}/> {isEdit ? 'Guardar Nueva Fecha' : 'Confirmar y Restar Inventario'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};