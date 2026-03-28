// src/sections/Reportes/index.tsx
import React, { useState, useEffect } from 'react';
import { FileText, Calendar, RotateCcw, CalendarDays } from 'lucide-react';
import { supabase } from '../../db/supabase';
import { TablaTickets } from './components/TablaTickets';
import type { TicketVenta } from './types';

export const Reportes: React.FC = () => {
  const [tickets, setTickets] = useState<TicketVenta[]>([]);
  
  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  const hoyStr = hoy.toISOString().split('T')[0];

  // INYECCIÓN: Calculamos la fecha local exacta (evita desfasajes por zona horaria UTC)
  const hoyLocal = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  // Seteamos "HOY" como fecha predeterminada al cargar el módulo
  const [fechaInicio, setFechaInicio] = useState<string>(hoyLocal);
  const [fechaFin, setFechaFin] = useState<string>(hoyLocal);

  // --- FUNCIONES DE FILTRADO RÁPIDO ---
  const filtrarHoy = () => {
    setFechaInicio(hoyStr);
    setFechaFin(hoyStr);
  };

  const filtrarSemana = () => {
    const haceUnaSemana = new Date();
    haceUnaSemana.setDate(hoy.getDate() - 7);
    setFechaInicio(haceUnaSemana.toISOString().split('T')[0]);
    setFechaFin(hoyStr);
  };

  const filtrarMes = () => {
    setFechaInicio(primerDiaMes);
    setFechaFin(hoyStr);
  };

  const limpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
  };
  // ------------------------------------

  useEffect(() => {
    const autoLimpiarAntiguos = async () => {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - 30);
      await supabase
        .from('sales')
        .delete()
        .lt('created_at', fechaLimite.toISOString());
    };
    autoLimpiarAntiguos();
  }, []);

  useEffect(() => {
    const fetchTickets = async () => {
      const fechaFinExpandida = new Date(fechaFin);
      fechaFinExpandida.setDate(fechaFinExpandida.getDate() + 1);
      const finAjustado = fechaFinExpandida.toISOString().split('T')[0];

      // PASO 1: Consulta dinámica (Con o sin fechas)
      let query = supabase.from('sales').select('*');
      
      if (fechaInicio && fechaFin) {
        query = query.gte('created_at', `${fechaInicio}T00:00:00`)
                     .lt('created_at', `${finAjustado}T00:00:00`);
      } else {
        query = query.limit(100); // Si limpian filtros, traemos los últimos 100 por seguridad
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (data) {
        // PASO 2: Buscamos fiados (Optimizado por rango de fechas para no destruir el servidor)
        const fiadosMap: Record<string, any> = {};

        if (data.length > 0) {
          let queryFiados = supabase.from('fiados').select('sale_id, customer_name, amount, paid_amount');
          
          if (fechaInicio && fechaFin) {
            queryFiados = queryFiados.gte('date_given', `${fechaInicio}T00:00:00`)
                                     .lt('date_given', `${finAjustado}T00:00:00`);
          } else {
            queryFiados = queryFiados.limit(1000); // Límite de seguridad
          }

          const { data: fiadosData } = await queryFiados;
            
          if (fiadosData) {
            fiadosData.forEach(f => {
              fiadosMap[f.sale_id] = f;
            });
          }
        }

        const ticketsFormateados: TicketVenta[] = data.map(t => {
          const fiado = t.id ? fiadosMap[String(t.id)] : null;
          const esFiado = !!fiado;
          
          const totalTicket = Number(t.total) || 0;
          
          // CÁLCULO MATEMÁTICO CORREGIDO:
          // Deuda Actual = (Monto del Fiado) - (Lo que ha ido abonando después)
          const deudaActual = esFiado ? (Number(fiado.amount || 0) - Number(fiado.paid_amount || 0)) : 0;
          
          // Pagado = (Total del Ticket) - (La deuda que aún le queda)
          // Esto captura automáticamente el "pago inicial" + "abonos posteriores"
          const montoPagado = esFiado ? (totalTicket - deudaActual) : totalTicket;

          return {
            id: t.id ? String(t.id) : `ERR-${Math.floor(Math.random() * 10000)}`,
            created_at: t.created_at || new Date().toISOString(),
            total: totalTicket,
            metodo_pago: esFiado ? 'FIADO' : (t.payment_type || 'MIXTO'),
            estado: t.status === 'ANULADO' || t.sunat_status === 'ANULADO' ? 'ANULADO' : 'COMPLETADO',
            
            es_fiado: esFiado,
            cliente_nombre: fiado?.customer_name || null,
            monto_pagado: montoPagado,
            monto_deuda: deudaActual
          };
        });
        setTickets(ticketsFormateados);
      }
      if (error) console.error("Error al cargar tickets:", error);
    };

    fetchTickets();
  }, [fechaInicio, fechaFin]);

  const handleAnularTicket = async (id: string) => {
    if (id.startsWith('ERR-')) {
      alert('⚠️ PROTECCIÓN DEL SISTEMA: Registro corrupto.');
      return;
    }

    if (window.confirm('⚠️ ¿Seguro que deseas ANULAR este ticket? El stock regresará a tu inventario.')) {
      const { error } = await supabase.from('sales').update({ sunat_status: 'ANULADO' }).eq('id', id);
      
      if (error) {
        alert("Error de integridad al anular en BD: " + error.message);
      } else {
        const { data: detalles } = await supabase.from('sale_details').select('product_id, quantity, product_name').eq('sale_id', id);
        if (detalles) {
          for (const item of detalles) {
            const { data: producto } = await supabase.from('products').select('quantity, control_type').eq('id', item.product_id).single();
            if (producto && producto.control_type !== 'CONSUMPTION') {
              const stockDevuelto = Number(producto.quantity) + Number(item.quantity);
              await supabase.from('products').update({ quantity: stockDevuelto }).eq('id', item.product_id);
              await supabase.from('inventory_movements').insert([{
                product_id: item.product_id,
                change_amount: Number(item.quantity),
                operation_type: 'DEVOLUCION',
                reason: `Anulación de Ticket #${id}`,
                user: 'Sistema'
              }]);
            }
          }
        }

        // 🔥 NUEVO: Avisarle a la tabla de Fiados que esta deuda se anuló
        await supabase.from('fiados').update({ status: 'ANULADO' }).eq('sale_id', id);

        setTickets(tickets.map(t => t.id === id ? { ...t, estado: 'ANULADO' } : t));
        alert("✅ OPERACIÓN CONFIRMADA: Ticket anulado y deuda cancelada.");
      }
    }
  };

  const handleDeleteTicket = async (id: string) => {
    const ticket = tickets.find(t => t.id === id);

    // BLOQUEO TÉCNICO: Exige anulación previa (Excluimos la basura "ERR-" de esta regla)
    if (ticket && ticket.estado !== 'ANULADO' && !id.startsWith('ERR-')) {
      alert('⚠️ OPERACIÓN DENEGADA: No puedes borrar una venta activa. Primero debes usar el botón ANULAR para que el stock y la deuda se reviertan correctamente.');
      return;
    }

    if (window.confirm('🗑️ ADVERTENCIA FINAL: ¿Seguro de borrar el registro? Esta acción es irreversible.')) {
      
      // 🧹 MODO LIMPIEZA PROFUNDA DE PRUEBAS FALLIDAS
      if (id.startsWith('ERR-')) {
        // Viaja a la base de datos y fulmina cualquier venta que no tenga un ID válido
        await supabase.from('sales').delete().is('id', null);
        // Limpia la pantalla de todos los errores de golpe
        setTickets(tickets.filter(t => !t.id.startsWith('ERR-')));
        alert("✨ LIMPIEZA COMPLETADA: Todos los registros corruptos de tus pruebas han sido eliminados de la base de datos.");
        return;
      }
      
      // FLUJO NORMAL PARA TICKETS BUENOS
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (!error) {
        await supabase.from('fiados').delete().eq('sale_id', id);
        setTickets(tickets.filter(t => t.id !== id));
      }
    }
  };

  const totalRango = tickets.filter(t => t.estado !== 'ANULADO').reduce((acc, t) => acc + Number(t.total), 0);
  const totalAnulados = tickets.filter(t => t.estado === 'ANULADO').length;

  return (
    <div className="h-full flex flex-col gap-6 p-6 max-w-7xl mx-auto font-mono">
      
      {/* TARJETAS DE MÉTRICAS */}
      <div className="flex gap-4 shrink-0">
        <div className="flex-1 bg-white border-2 border-[#E2E8F0] shadow-[4px_4px_0_0_#E2E8F0] p-4 flex gap-4 items-center">
            <div className="w-12 h-12 bg-[#F8FAFC] rounded-none border-2 border-[#E2E8F0] flex items-center justify-center">
              <FileText className="text-[#3B82F6]" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Ventas del Rango</p>
              <p className="text-2xl font-black text-[#1E293B]">S/ {totalRango.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="flex-1 bg-white border-2 border-[#E2E8F0] shadow-[4px_4px_0_0_#E2E8F0] p-4 flex gap-4 items-center">
            <div className="w-12 h-12 bg-[#FEF2F2] rounded-none border-2 border-[#EF4444] flex items-center justify-center">
              <RotateCcw className="text-[#EF4444]" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Devoluciones</p>
              <p className="text-2xl font-black text-[#EF4444]">{totalAnulados} tickets</p>
            </div>
          </div>
      </div>

      {/* BARRA DE CONTROLES TÉCNICOS */}
      <div className="flex flex-wrap lg:flex-nowrap justify-between items-end gap-4 shrink-0">
        
        {/* BOTONES RÁPIDOS */}
        <div className="flex gap-3">
          <button onClick={filtrarHoy} className="bg-white border-2 border-[#1E293B] px-6 py-3 text-sm font-black uppercase text-[#1E293B] hover:bg-[#1E293B] hover:text-white transition-colors cursor-pointer rounded-none shadow-[4px_4px_0_0_#1E293B] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]">
            Hoy
          </button>
          <button onClick={filtrarSemana} className="bg-white border-2 border-[#1E293B] px-6 py-3 text-sm font-black uppercase text-[#1E293B] hover:bg-[#1E293B] hover:text-white transition-colors cursor-pointer rounded-none shadow-[4px_4px_0_0_#1E293B] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]">
            7 Días
          </button>
          <button onClick={filtrarMes} className="bg-white border-2 border-[#1E293B] px-6 py-3 text-sm font-black uppercase text-[#1E293B] hover:bg-[#1E293B] hover:text-white transition-colors cursor-pointer rounded-none shadow-[4px_4px_0_0_#1E293B] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]">
            Mes
          </button>
        </div>

        {/* SELECTOR DE FECHAS PERSONALIZADO */}
        <div className="flex items-center gap-6 bg-white border-2 border-[#E2E8F0] p-4 shadow-[4px_4px_0_0_#E2E8F0] rounded-none">
          <div className="flex flex-col">
            <label className="text-xs font-black text-[#64748B] uppercase tracking-widest mb-1">Desde</label>
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-[#94A3B8]" />
              <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="text-base font-black text-[#1E293B] outline-none bg-transparent uppercase cursor-pointer" />
            </div>
          </div>
          <div className="w-[2px] h-10 bg-[#E2E8F0]"></div>
          <div className="flex flex-col">
            <label className="text-xs font-black text-[#64748B] uppercase tracking-widest mb-1">Hasta</label>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-[#94A3B8]" />
              <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="text-base font-black text-[#1E293B] outline-none bg-transparent uppercase cursor-pointer" />
            </div>
          </div>
          
          {/* BOTÓN LIMPIAR */}
          {(fechaInicio || fechaFin) && (
             <div className="pl-4 ml-2 border-l-2 border-[#E2E8F0]">
               <button onClick={limpiarFiltros} className="text-[#EF4444] hover:bg-[#FEF2F2] p-2 transition-colors cursor-pointer rounded-none" title="Limpiar Filtros">
                 <RotateCcw size={16} />
               </button>
             </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <TablaTickets tickets={tickets} onAnular={handleAnularTicket} onDelete={handleDeleteTicket} />
      </div>
    </div>
  );
};