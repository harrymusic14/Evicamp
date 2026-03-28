import React, { useState, useEffect, useRef } from 'react';

import { X, Printer, Receipt } from 'lucide-react';

import { supabase } from '../../../db/supabase';

import { useReactToPrint } from 'react-to-print';



interface Props {

  isOpen: boolean;

  onClose: () => void;

  caja: any;

}



export const ModalDetalleCaja: React.FC<Props> = ({ isOpen, onClose, caja }) => {

  const [tickets, setTickets] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const printRef = useRef<HTMLDivElement>(null);



  const handlePrint = useReactToPrint({

    contentRef: printRef,

    documentTitle: `Resumen_Caja_${caja?.id}`,

  });



  useEffect(() => {

    if (isOpen && caja) {

      cargarResumenTicket();

    }

  }, [isOpen, caja]);



  const cargarResumenTicket = async () => {

    setLoading(true);

    // Buscamos ventas y deudas pagadas en el rango de la caja

    const { data: sales } = await supabase

      .from('sales')

      .select('*')

      .gte('created_at', caja.opened_at)

      .lte('created_at', caja.closed_at || new Date().toISOString());

   

    setTickets(sales || []);

    setLoading(false);

  };



  if (!isOpen || !caja) return null;



  return (

    <div className="fixed inset-0 bg-[#1E293B]/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-mono">

      <div className="bg-white border-2 border-[#1E293B] shadow-[8px_8px_0_0_#1E293B] w-full max-w-2xl h-[90vh] flex flex-col">

       

        <div className="bg-[#3B82F6] p-4 border-b-2 border-[#1E293B] flex justify-between items-center text-white">

          <h2 className="font-black uppercase tracking-widest flex items-center gap-2">

            <Receipt size={20} /> Reporte de Tickets - Caja #{caja.id}

          </h2>

          <button onClick={onClose} className="hover:rotate-90 transition-transform cursor-pointer">

            <X size={24} strokeWidth={3} />

          </button>

        </div>



        <div className="flex-1 overflow-auto p-6 custom-scrollbar">

          {loading ? (

            <p className="text-center font-black animate-pulse">GENERANDO REPORTE...</p>

          ) : (

            <div ref={printRef} className="bg-white p-4 text-[#1E293B] w-[80mm] mx-auto border border-dashed border-gray-300 print:border-0 print:p-0">

              <div className="text-center border-b-2 border-black pb-2 mb-4">

                <h3 className="font-black text-lg uppercase">Resumen de Caja</h3>

                <p className="text-[10px] font-bold">ID: {caja.id}</p>

                <p className="text-[9px]">Desde: {new Date(caja.opened_at).toLocaleString()}</p>

                <p className="text-[9px]">Hasta: {new Date(caja.closed_at).toLocaleString()}</p>

              </div>



              <table className="w-full text-[10px] mb-4">

                <thead>

                  <tr className="border-b border-black text-left">

                    <th>HORA</th>

                    <th>MET.</th>

                    <th className="text-right">TOTAL</th>

                  </tr>

                </thead>

                <tbody>

                  {tickets.map(t => (

                    <tr key={t.id}>

                      <td className="py-1">{new Date(t.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>

                      <td className="uppercase">{t.payment_type}</td>

                      <td className="text-right">S/ {Number(t.total).toFixed(2)}</td>

                    </tr>

                  ))}

                </tbody>

              </table>



              <div className="border-t-2 border-black pt-2 space-y-1 font-black text-xs uppercase">

                <div className="flex justify-between"><span>Base:</span><span>S/ {Number(caja.opening_balance).toFixed(2)}</span></div>

                <div className="flex justify-between text-green-600"><span>Efectivo:</span><span>S/ {tickets.reduce((a,b) => a + Number(b.amount_cash || 0), 0).toFixed(2)}</span></div>

                <div className="flex justify-between text-blue-600"><span>Yape:</span><span>S/ {tickets.reduce((a,b) => a + Number(b.amount_yape || 0), 0).toFixed(2)}</span></div>

                <div className="flex justify-between text-purple-600"><span>Tarjeta:</span><span>S/ {tickets.reduce((a,b) => a + Number(b.amount_card || 0), 0).toFixed(2)}</span></div>

                <div className="flex justify-between border-t border-black pt-1 text-lg">

                  <span>Final:</span>

                  <span>S/ {Number(caja.closing_balance).toFixed(2)}</span>

                </div>

              </div>

            </div>

          )}

        </div>



        <div className="p-4 bg-[#F8FAFC] border-t-2 border-[#1E293B]">

          <button

            onClick={() => handlePrint()}

            className="w-full bg-[#1E293B] text-white p-4 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#10B981] transition-colors border-2 border-[#1E293B] shadow-[4px_4px_0_0_#1E293B] active:translate-y-1"

          >

            <Printer size={20} /> Imprimir Reporte 80mm

          </button>

        </div>

      </div>

    </div>

  );

};