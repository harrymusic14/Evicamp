import React from 'react';
import { ShoppingCart, Trash2, Banknote, Pause, Play, Plus, Minus } from 'lucide-react';
import type { CartItem } from '../types';

interface Props {
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  updateQuantity: (id: string, qty: number) => void;
  updatePrice: (id: string, price: number) => void;
  heldCarts: CartItem[][];
  holdCurrentCart: () => void;
  restoreCart: (index: number) => void;
  onPagar: () => void; // <--- FUNCIÓN AÑADIDA
}

// 🔥 1. SACAMOS LOS COMPONENTES AFUERA PARA QUE NO SE REINICIEN (Evita que se cierre o pierda el foco)
const redondearPeso = (peso: number) => {
  const entero = Math.round(peso * 100); 
  const segundoDecimal = entero % 10;
  if (segundoDecimal >= 6) return Math.ceil(entero / 10) / 10;
  else return Math.floor(entero / 10) / 10;
};

const InputPeso = ({ item, updateQuantity }: { item: CartItem, updateQuantity: (id: string, qty: number) => void }) => {
  const [val, setVal] = React.useState(redondearPeso(item.cartQuantity).toString());
  
  React.useEffect(() => {
    if (parseFloat(val) !== item.cartQuantity) setVal(redondearPeso(item.cartQuantity).toString());
  }, [item.cartQuantity]);

  const handleBlur = () => {
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
       updateQuantity(item.id, redondearPeso(num));
       // Quitamos el setVal para dejar que el sistema lo recupere desde el inventario si te pasaste
    } else setVal(redondearPeso(item.cartQuantity).toString());
  };

  return (
    <input 
       type="text" 
       inputMode="decimal"
       value={val}
       onChange={(e) => {
         const soloNumeros = e.target.value.replace(/[^0-9.]/g, ''); 
         setVal(soloNumeros);
       }}
       onBlur={handleBlur}
       onFocus={(e) => { const len = e.target.value.length; e.target.setSelectionRange(len, len); }}
       onClick={(e) => { const target = e.target as HTMLInputElement; const len = target.value.length; target.setSelectionRange(len, len); }}
       onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} // 🔥 MAGIA: blur() elimina el bucle de la alerta
       className="w-full h-full text-center text-sm font-black text-[#3B82F6] outline-none bg-transparent cursor-text"
       title="Escribe el peso y presiona Enter"
    />
  );
};

const InputPrecio = ({ item, updatePrice }: { item: CartItem, updatePrice: (id: string, price: number) => void }) => {
  const [val, setVal] = React.useState(item.price.toFixed(2));
  React.useEffect(() => { if (parseFloat(val) !== item.price) setVal(item.price.toFixed(2)); }, [item.price]);

  const handleBlur = () => {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
       updatePrice(item.id, num);
    } else setVal(item.price.toFixed(2));
  };

  return (
    <div className="flex items-center gap-1 mt-0.5" title="Haz clic para editar el precio">
      <span className="text-[10px] text-[#10B981] font-black">S/</span>
      <input 
         type="text" 
         inputMode="decimal" 
         value={val} 
         onChange={(e) => { 
           const soloNumeros = e.target.value.replace(/[^0-9.]/g, '');
           setVal(soloNumeros); 
         }} 
         onBlur={handleBlur} 
         onFocus={(e) => { const len = e.target.value.length; e.target.setSelectionRange(len, len); }}
         onClick={(e) => { const target = e.target as HTMLInputElement; const len = target.value.length; target.setSelectionRange(len, len); }}
         onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} // 🔥 MAGIA
         className="w-16 h-5 text-[11px] font-black text-[#1E293B] outline-none bg-[#ECFDF5] border border-[#10B981] px-1 focus:bg-white cursor-text"
      />
    </div>
  );
};

const InputUnidades = ({ item, updateQuantity }: { item: CartItem, updateQuantity: (id: string, qty: number) => void }) => {
  const [val, setVal] = React.useState(item.cartQuantity.toString());

  React.useEffect(() => {
    if (parseInt(val) !== item.cartQuantity) setVal(item.cartQuantity.toString());
  }, [item.cartQuantity]);

  const handleBlur = () => {
    const num = parseInt(val);
    if (!isNaN(num) && num > 0) {
       updateQuantity(item.id, num);
    } else setVal(item.cartQuantity.toString());
  };

  return (
    <input 
       type="text" 
       inputMode="numeric"
       pattern="[0-9]*"
       value={val}
       onChange={(e) => {
         const soloNumeros = e.target.value.replace(/\D/g, '');
         setVal(soloNumeros);
       }}
       onBlur={handleBlur}
       onFocus={(e) => { const len = e.target.value.length; e.target.setSelectionRange(len, len); }}
       onClick={(e) => { const target = e.target as HTMLInputElement; const len = target.value.length; target.setSelectionRange(len, len); }}
       onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} // 🔥 MAGIA
       className="w-full h-full text-center text-sm font-black text-[#1E293B] outline-none bg-transparent cursor-text"
       title="Escribe la cantidad y presiona Enter"
    />
  );
};

// 🔥 2. COMPONENTE PRINCIPAL (Receptor)
export const TicketVenta: React.FC<Props> = ({ 
  cart, setCart, updateQuantity, updatePrice, heldCarts, holdCurrentCart, restoreCart, onPagar
}) => {

  // CÁLCULO DE TOTALES AUTOMÁTICO
  const total = cart.reduce((acc, item) => acc + item.subtotal, 0);

  return (
    <div className="w-[380px] flex flex-col bg-white border-2 border-[#1E293B] shadow-[8px_8px_0_0_#1E293B] shrink-0 relative overflow-hidden">
      
      {/* ENCABEZADO TICKET CON BOTÓN DE PAUSAR */}
      <div className="bg-[#1E293B] text-white p-5 flex items-center justify-between shrink-0 border-b-2 border-[#1E293B]">
        <div className="flex flex-col">
          <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-[#10B981]">
            <ShoppingCart size={18} /> Caja Actual
          </h2>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={holdCurrentCart}
            disabled={cart.length === 0}
            className="h-8 flex items-center justify-center px-3 gap-1 bg-[#F59E0B] text-[#1E293B] border-2 border-[#F59E0B] hover:bg-white hover:border-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0_0_#0F172A] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]" 
            title="Pausar y Guardar Ticket"
          >
            <Pause size={14} fill="currentColor" /> <span className="text-[10px] font-black uppercase">Espera</span>
          </button>
          <button 
            onClick={() => setCart([])}
            className="w-8 h-8 flex items-center justify-center bg-[#EF4444] text-white border-2 border-[#EF4444] hover:bg-white hover:text-[#EF4444] transition-colors cursor-pointer shadow-[2px_2px_0_0_#0F172A] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]" 
            title="Vaciar Ticket"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* NUEVA BARRA: TICKETS EN ESPERA (Aparece solo si hay tickets guardados) */}
      {heldCarts.length > 0 && (
        <div className="bg-[#F8FAFC] p-3 flex gap-2 overflow-x-auto border-b-2 border-[#1E293B] shrink-0 custom-scrollbar">
          {heldCarts.map((_, i) => (
            <button 
              key={i} 
              onClick={() => restoreCart(i)}
              className="bg-[#3B82F6] text-white border-2 border-[#1E293B] px-3 py-1.5 text-[10px] font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0_0_#1E293B] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all whitespace-nowrap cursor-pointer"
              title="Recuperar Ticket"
            >
              <Play size={10} fill="currentColor" /> RECUPERAR T-{i + 1}
            </button>
          ))}
        </div>
      )}

      {/* LISTA DE ITEMS DEL TICKET */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-4 flex flex-col relative border-b-2 border-[#1E293B]">
        <div className="grid grid-cols-12 gap-2 text-xs font-black text-[#64748B] uppercase tracking-widest border-b-2 border-[#E2E8F0] pb-2 mb-2">
          <div className="col-span-3 text-center">Cant.</div>
          <div className="col-span-5">Descripción</div>
          <div className="col-span-3 text-right">Subtotal</div>
          <div className="col-span-1 text-center">X</div>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#94A3B8] opacity-50">
            <ShoppingCart size={32} className="mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">Caja libre</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {cart.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 text-xs font-bold text-[#1E293B] border-b border-dashed border-[#CBD5E1] pb-2 items-center">
                
                {/* CONTROLES DE CANTIDAD EDITABLES */}
                <div className="col-span-3 flex items-center justify-between border-2 border-[#1E293B] bg-[#FFFFFF] h-9 overflow-hidden">
                  {item.unit === 'KG' ? (
                    <div className="flex-1 flex items-center justify-center h-full bg-[#EFF6FF] hover:bg-[#DBEAFE] transition-colors">
                      <InputPeso item={item} updateQuantity={updateQuantity} />
                    </div>
                  ) : item.unit === 'CONSUMO' ? (
                    <div className="flex-1 flex items-center justify-center h-full bg-[#F8FAFC]">
                      <span className="text-xs font-black text-[#94A3B8] tracking-widest">---</span>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => updateQuantity(item.id, item.cartQuantity - 1)} className="w-7 h-full flex items-center justify-center hover:bg-[#1E293B] hover:text-white transition-colors cursor-pointer border-r-2 border-[#1E293B]">
                        <Minus size={14} strokeWidth={4} />
                      </button>
                      <div className="flex-1 flex items-center justify-center h-full bg-[#EFF6FF] hover:bg-[#DBEAFE] transition-colors">
                        <InputUnidades item={item} updateQuantity={updateQuantity} />
                      </div>
                      <button onClick={() => updateQuantity(item.id, item.cartQuantity + 1)} className="w-7 h-full flex items-center justify-center hover:bg-[#1E293B] hover:text-white transition-colors cursor-pointer border-l-2 border-[#1E293B]">
                        <Plus size={14} strokeWidth={4} />
                      </button>
                    </>
                  )}
                </div>

                <div className="col-span-5 flex flex-col min-w-0 pr-1 pl-1">
                  <span className="truncate uppercase font-black text-[#1E293B] text-sm" title={item.name}>{item.name}</span>
                  {item.unit === 'CONSUMO' ? (
                    <InputPrecio item={item} updatePrice={updatePrice} />
                  ) : (
                    <span className="text-xs font-black text-[#64748B]">S/ {item.price.toFixed(2)} c/u</span>
                  )}
                </div>
                
                <div className="col-span-3 text-right text-sm font-black text-[#1E293B]">
                  {item.subtotal.toFixed(2)}
                </div>

                {/* BOTÓN ELIMINAR INDIVIDUAL - ALTO CONTRASTE */}
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => updateQuantity(item.id, 0)}
                    className="w-7 h-7 flex items-center justify-center bg-[#FFFFFF] border-2 border-[#1E293B] text-[#1E293B] hover:bg-[#1E293B] hover:text-[#FFFFFF] transition-colors cursor-pointer shadow-[2px_2px_0_0_#1E293B] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                    title="Eliminar producto"
                  >
                    <Trash2 size={12} strokeWidth={3} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ZONA DE COBRO CON MATEMÁTICAS REALES */}
      <div className="bg-[#F8FAFC] shrink-0 p-6 flex flex-col gap-4">

        <div className="flex justify-between items-end mt-1">
          <span className="text-sm font-black uppercase tracking-[0.2em] text-[#1E293B]">TOTAL A COBRAR</span>
          <span className="text-5xl font-black text-[#10B981] tracking-tighter">
            <span className="text-2xl">S/</span> {total.toFixed(2)}
          </span>
        </div>
        
        <button 
          onClick={onPagar} // <--- ONCLICK CONECTADO AQUÍ
          disabled={cart.length === 0}
          className="w-full mt-2 bg-[#10B981] text-[#1E293B] py-5 border-2 border-[#1E293B] font-black text-base uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#1E293B] hover:text-[#10B981] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-[4px_4px_0_0_#1E293B] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
        >
          <Banknote size={20} /> Proceder al Pago (F4)
        </button>
      </div>
    </div>
  );
};