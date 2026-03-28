import { forwardRef } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  cartQuantity: number;
  subtotal: number;
  unit?: string;
  [key: string]: any; 
}

interface Props {
  cart: CartItem[];
  total: number;
  pagos: { efectivo: number; yape: number; tarjeta: number };
  vuelto: number;
  nroBoleta: string;
  fiadoData?: {
    montoDeuda: number;
    fechaVencimiento: string;
    clienteNombre: string;
    clienteDni?: string;
    clienteTelefono?: string;
  };
}

export const TicketImprimible = forwardRef<HTMLDivElement, Props>(
  ({ cart, total, pagos, vuelto, nroBoleta, fiadoData }, ref) => {
    const fecha = new Date().toLocaleString('es-PE');

    return (
      <div 
        ref={ref} 
        // 🚀 AHORA ES VISIBLE: Le damos diseño de papel real con sombra
        className="bg-white p-4 text-[#1E293B] w-[80mm] mx-auto border-2 border-dashed border-gray-400 font-mono shadow-2xl print:shadow-none print:border-0 print:p-0 print:m-0"
      >
        {/* REGLAS ESTRICTAS SOLO PARA LA IMPRESORA FÍSICA */}
        <style type="text/css" media="print">
          {`
            @page { margin: 0; }
            body { width: 80mm !important; margin: 0 !important; color: black !important; background: white !important; }
            * { box-sizing: border-box; }
          `}
        </style>

        {/* CABECERA */}
        <div className="text-center border-b-2 border-black pb-2 mb-4">
          <h3 className="font-black text-lg uppercase tracking-widest">EVICAMP POS</h3>
          <p className="text-[10px] font-bold mt-1">RUC: 20123456789</p>
          <p className="text-[9px]">Av. Arquitectura Técnica 123 | Lima</p>
          
          <h3 className="font-black text-sm uppercase mt-2">
            {fiadoData ? 'TICKET DE FIADO' : 'Boleta Electrónica'}
          </h3>
          <p className="font-black tracking-widest text-base">{nroBoleta}</p>
          <p className="text-[9px] font-bold mt-1">Fecha: {fecha}</p>

          {/* DATOS DEL FIADO */}
          {fiadoData && (
            <div className="mt-2 text-left border-2 border-black p-1.5 bg-gray-100">
              <p className="text-[10px] font-black uppercase border-b border-black pb-1 mb-1">Datos del Crédito</p>
              <p className="text-[9px] font-bold uppercase">Cliente: <span className="font-black">{fiadoData.clienteNombre}</span></p>
              {fiadoData.clienteDni && <p className="text-[9px] font-bold uppercase">DNI: <span className="font-black">{fiadoData.clienteDni}</span></p>}
              {fiadoData.clienteTelefono && <p className="text-[9px] font-bold uppercase">Cel: <span className="font-black">{fiadoData.clienteTelefono}</span></p>}
              <p className="text-[10px] font-black uppercase mt-1 text-red-600">Límite Pago: {fiadoData.fechaVencimiento}</p>
            </div>
          )}
        </div>

        {/* TABLA DE PRODUCTOS */}
        <table className="w-full text-[10px] mb-4">
          <thead>
            <tr className="border-b-2 border-black text-left">
              <th className="w-[15%] pb-1 font-black">CANT</th>
              <th className="w-[60%] pb-1 font-black">DESC</th>
              <th className="w-[25%] text-right pb-1 font-black">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item, index) => (
              <tr key={index}>
                <td className="py-1.5 font-bold align-top">{item.cartQuantity}</td>
                <td className="py-1.5 pr-1 uppercase align-top">
                  <span className="font-bold leading-tight block">{item.name}</span>
                  <span className="text-[8px] text-gray-600 font-bold">S/ {item.price.toFixed(2)} c/u</span>
                </td>
                <td className="py-1.5 text-right font-bold align-top">
                  {item.subtotal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALES Y PAGOS */}
        <div className="border-t-2 border-black pt-2 space-y-1 font-black text-xs uppercase">
          <div className="flex justify-between text-lg mb-2">
            <span>Total:</span>
            <span>S/ {total.toFixed(2)}</span>
          </div>
          
          <div className="border-t border-black pt-1 mb-1 text-[9px] text-gray-600">
            {fiadoData ? 'PAGOS PARCIALES:' : 'MÉTODOS DE PAGO:'}
          </div>

          {pagos.efectivo > 0 && <div className="flex justify-between"><span>Efectivo:</span><span>S/ {pagos.efectivo.toFixed(2)}</span></div>}
          {pagos.yape > 0 && <div className="flex justify-between"><span>Yape:</span><span>S/ {pagos.yape.toFixed(2)}</span></div>}
          {pagos.tarjeta > 0 && <div className="flex justify-between"><span>Tarjeta:</span><span>S/ {pagos.tarjeta.toFixed(2)}</span></div>}
          
          <div className="flex justify-between border-t-2 border-black pt-1 text-base mt-2">
            <span>{fiadoData ? 'POR PAGAR:' : 'VUELTO:'}</span>
            <span>S/ {fiadoData ? fiadoData.montoDeuda.toFixed(2) : vuelto.toFixed(2)}</span>
          </div>
        </div>

        {/* PIE DE PÁGINA */}
        <div className="text-center mt-6 border-t-2 border-dashed border-gray-400 pt-3">
          <p className="font-black text-[10px] uppercase">¡Gracias por su compra!</p>
          <p className="text-[8px] mt-1 font-bold">Consulte su documento en www.sunat.gob.pe</p>
          <p className="mt-3 text-[8px] font-black">*** SISTEMA EVICAMP POS ***</p>
        </div>
        <div className="h-2"></div>
      </div>
    );
  }
);