// src/sections/Finanzas/index.tsx
import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownToLine, Lock, CreditCard, Smartphone, Banknote, ReceiptText } from 'lucide-react';
import { supabase } from '../../db/supabase';
import type { CashSession, CashMovement, MetricasCaja } from './types';

import { ModalApertura } from './components/ModalApertura';
import { TablaMovimientos } from './components/TablaMovimientos';
import { ModalNuevoMovimiento } from './components/ModalNuevoMovimiento';
import { ModalCierre } from './components/ModalCierre';
import { TablaHistorial } from './components/TablaHistorial';
import { FiltroFechas } from './components/FiltroFechas';
interface SuperMetricas {
  fondoInicial: number;
  ingresosExtra: number;
  gastos: number;
  ventasEfectivo: number;
  ventasYape: number;
  ventasTarjeta: number;
  cobroDeudasEfectivo: number;
  cobroDeudasYape: number;
  efectivoEsperadoCaja: number;
  totalFacturado: number; 
}

export const Finanzas: React.FC = () => {
  const [sessionActiva, setSessionActiva] = useState<CashSession | null>(null);
  const [movimientos, setMovimientos] = useState<CashMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados Clásicos y Nuevos
  const [metricas, setMetricas] = useState<MetricasCaja>({ totalIngresos: 0, totalEgresos: 0, saldoActual: 0 });
  const [superMetricas, setSuperMetricas] = useState<SuperMetricas | null>(null);

  const [isAperturaModalOpen, setIsAperturaModalOpen] = useState(false);
  const [isMovimientoModalOpen, setIsMovimientoModalOpen] = useState(false);
  const [isCierreModalOpen, setIsCierreModalOpen] = useState(false);

  // NUEVO: Estados y funciones para el Historial y Limpieza
  const [vistaActual, setVistaActual] = useState<'ACTUAL' | 'HISTORIAL'>('ACTUAL');
  const [pestañaFlujo, setPestañaFlujo] = useState<'INTERNO' | 'EXTERNO'>('INTERNO'); // <-- Control de Pestañas
  const [historialCajas, setHistorialCajas] = useState<CashSession[]>([]);
  
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const ITEMS_POR_PAGINA = 20;

  const cargarHistorial = async (page = 1, desde = fechaDesde, hasta = fechaHasta) => {
    let query = supabase
      .from('cash_sessions')
      .select('*', { count: 'exact' })
      .eq('status', 'CLOSED');

    if (desde && hasta) {
      query = query
        .gte('opened_at', `${desde}T00:00:00.000Z`)
        .lte('opened_at', `${hasta}T23:59:59.999Z`);
    }

    const from = (page - 1) * ITEMS_POR_PAGINA;
    const to = from + ITEMS_POR_PAGINA - 1;

    query = query.order('opened_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error("Error cargando historial:", error);
      return;
    }

    if (data) {
      setHistorialCajas(data as CashSession[]);
      setTotalPaginas(count ? Math.ceil(count / ITEMS_POR_PAGINA) : 1);
    }
  };

  const handleFilterChange = (desde: string, hasta: string) => {
    setFechaDesde(desde);
    setFechaHasta(hasta);
    setPaginaActual(1);
    cargarHistorial(1, desde, hasta);
  };

  useEffect(() => {
    cargarDatosCaja();
  }, []);

  const cargarDatosCaja = async () => {
    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase
        .from('cash_sessions')
        .select('*')
        .eq('status', 'OPEN')
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // <-- SOLUCIÓN: maybeSingle no hace explotar el sistema si la caja está cerrada

      if (sessionData) {
        setSessionActiva(sessionData as CashSession);
        
        // 1. Movimientos Manuales
        const { data: movData } = await supabase.from('cash_movements').select('*').eq('session_id', sessionData.id).order('created_at', { ascending: false });
        
        // 2. Ventas durante esta caja (IGNORANDO DEVOLUCIONES / ANULADOS)
        const { data: salesData } = await supabase.from('sales').select('*').gte('created_at', sessionData.opened_at).neq('sunat_status', 'ANULADO');
        
        // 3. Cobros de Deuda durante esta caja (Búsqueda exacta por ID de Caja para garantizar integridad relacional)
        const { data: debtData } = await supabase.from('debt_payments').select('*').eq('session_id', sessionData.id);

        let gastos = 0, ingresosExtra = 0;
        let vEfectivo = 0, vYape = 0, vTarjeta = 0;
        let dEfectivo = 0, dYape = 0;

        movData?.forEach(m => {
          // BLOQUEO MATEMÁTICO: Ignoramos la caja personal (EXTERNO) para que no descuadre el negocio
          if (m.flujo === 'EXTERNO') return;

          if (m.type === 'INGRESO') ingresosExtra += Number(m.amount);
          if (m.type === 'EGRESO') gastos += Number(m.amount);
        });

        salesData?.forEach(s => {
          // BLOQUEO MATEMÁTICO 2: Ignorar tickets FIADOS y ANULADOS para que no sumen a la caja actual
          if (s.payment_method === 'FIADO' || s.payment_type === 'FIADO' || s.status === 'FIADO') return;
          if (s.status === 'ANULADO' || s.sunat_status === 'ANULADO') return;

          vEfectivo += Number(s.amount_cash || 0);
          vYape += Number(s.amount_yape || 0);
          vTarjeta += Number(s.amount_card || 0);
        });

        debtData?.forEach(d => {
          if (d.payment_type?.toLowerCase() === 'yape') {
            dYape += Number(d.amount || 0);
          } else {
            dEfectivo += Number(d.amount || 0);
          }
        });

        const fondoInicial = Number(sessionData.opening_balance);
        const efectivoFisicoQueDebeHaber = fondoInicial + vEfectivo + dEfectivo + ingresosExtra - gastos;

        setSuperMetricas({
          fondoInicial, ingresosExtra, gastos,
          ventasEfectivo: vEfectivo, ventasYape: vYape, ventasTarjeta: vTarjeta,
          cobroDeudasEfectivo: dEfectivo, cobroDeudasYape: dYape,
          efectivoEsperadoCaja: efectivoFisicoQueDebeHaber,
          totalFacturado: vEfectivo + vYape + vTarjeta
        });

        // Mantener compatibilidad con el Modal de Cierre Antiguo
        setMetricas({
          totalIngresos: vEfectivo + dEfectivo + ingresosExtra,
          totalEgresos: gastos,
          saldoActual: efectivoFisicoQueDebeHaber
        });

        // 🔥 ARQUITECTURA TÉCNICA: Transformamos los pagos de deuda en movimientos visuales para la tabla.
        // Al leerlos directamente, evitamos duplicar datos y crear registros "fantasmas".
        const abonosTransformados: CashMovement[] = (debtData || []).map(d => ({
          id: d.id,
          session_id: d.session_id?.toString() || sessionData.id.toString(),
          type: 'INGRESO',
          amount: Number(d.amount),
          description: `Abono de Deuda (Cliente ID: ${d.customer_id || 'N/A'})`,
          payment_type: d.payment_type?.toUpperCase() || 'EFECTIVO',
          flujo: 'INTERNO',
          created_at: d.created_at,
          is_synced: d.is_synced
        }));

        // Unimos los movimientos de caja manuales con los abonos para que aparezcan visualmente
        const todosLosMovimientos = [...(movData as CashMovement[] || []), ...abonosTransformados];
        
        // Ordenamos por fecha para mantener la geometría cronológica
        todosLosMovimientos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setMovimientos(todosLosMovimientos);
      } else {
        setSessionActiva(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // FUNCIÓN PARA ELIMINAR MOVIMIENTO MANUAL
  const handleDeleteMovimiento = async (idMov: string) => {
    if (window.confirm('⚠️ ¿Seguro que deseas ELIMINAR este movimiento? Esta acción recalculará la caja.')) {
      const { error } = await supabase.from('cash_movements').delete().eq('id', idMov);
      if (error) {
        alert('Error al eliminar: ' + error.message);
      } else {
        cargarDatosCaja(); // Recargamos todo para recalcular la boveda
      }
    }
  };

  if (isLoading) return <div className="flex h-full items-center justify-center font-mono">Calculando Bóveda...</div>;

  return (
    <div className="h-full flex flex-col gap-6 p-6 max-w-7xl mx-auto font-mono">
      
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-black text-[#1E293B] uppercase tracking-tighter flex items-center gap-3">
            <Wallet size={32} className="text-[#10B981]" /> Control de Caja
          </h1>
          <p className="text-[#64748B] text-xs font-bold tracking-widest uppercase mt-1">
            Arqueo de Yape, Efectivo y Deudas en tiempo real
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => {
              if (vistaActual === 'ACTUAL') {
                setVistaActual('HISTORIAL');
                cargarHistorial();
              } else {
                setVistaActual('ACTUAL');
              }
            }}
            className="bg-[#F8FAFC] text-[#1E293B] px-6 py-3 border-2 border-[#1E293B] font-black text-xs uppercase tracking-[0.2em] shadow-[4px_4px_0_0_#1E293B] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1E293B] transition-all cursor-pointer mr-2 flex items-center gap-2"
          >
            <ReceiptText size={16} /> {vistaActual === 'ACTUAL' ? 'Ver Historial' : 'Volver a Caja'}
          </button>

          {vistaActual === 'ACTUAL' && (
            !sessionActiva ? (
              <button onClick={() => setIsAperturaModalOpen(true)} className="bg-[#10B981] text-white px-6 py-3 border-2 border-[#1E293B] font-black text-xs uppercase tracking-[0.2em] shadow-[4px_4px_0_0_#1E293B] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1E293B] transition-all cursor-pointer">
                Aperturar Caja
              </button>
            ) : (
              <>
                <button onClick={() => setIsMovimientoModalOpen(true)} className="bg-white text-[#1E293B] px-4 py-3 border-2 border-[#1E293B] font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-[4px_4px_0_0_#1E293B] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1E293B] transition-all cursor-pointer">
                  + Nuevo Movimiento
                </button>
                <button onClick={() => setIsCierreModalOpen(true)} className="bg-[#EF4444] text-white px-6 py-3 border-2 border-[#1E293B] font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 shadow-[4px_4px_0_0_#1E293B] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1E293B] transition-all cursor-pointer">
                  <Lock size={16} /> Cerrar Caja
                </button>
              </>
            )
          )}
        </div>
      </div>

      {vistaActual === 'HISTORIAL' ? (
        <div className="flex flex-col flex-1 h-full min-h-0">
          <FiltroFechas onFilter={handleFilterChange} />
          <TablaHistorial 
            historialCajas={historialCajas} 
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            onPageChange={(nuevaPagina) => {
              setPaginaActual(nuevaPagina);
              cargarHistorial(nuevaPagina);
            }}
          />
        </div>
      ) : sessionActiva && superMetricas ? (
        <div className="flex flex-col gap-6 flex-1 min-h-0">
          
          {/* SÚPER PANEL DE MÉTRICAS */}
          <div className="grid grid-cols-4 gap-4 shrink-0">
            <div className="bg-white border-2 border-[#1E293B] p-4 flex flex-col justify-between">
               <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest flex items-center gap-2"><Banknote size={14}/> Efectivo Esperado Físico</p>
               <p className="text-3xl font-black text-[#10B981] mt-2">S/ {superMetricas.efectivoEsperadoCaja.toFixed(2)}</p>
               <p className="text-[9px] font-bold text-[#64748B] uppercase mt-2 border-t pt-2">(Fondo + Ventas Físicas + Cobros - Gastos)</p>
            </div>
            
            <div className="bg-[#F8FAFC] border-2 border-[#E2E8F0] p-4">
               <p className="text-[10px] font-black text-[#3B82F6] uppercase tracking-widest flex items-center gap-2"><Smartphone size={14}/> Yape / Transferencias</p>
               <p className="text-xl font-black text-[#1E293B] mt-1">S/ {(superMetricas.ventasYape + superMetricas.cobroDeudasYape).toFixed(2)}</p>
               <div className="text-[9px] font-bold text-[#64748B] uppercase mt-2 space-y-1 border-t pt-2">
                 <p>Ventas: S/ {superMetricas.ventasYape.toFixed(2)}</p>
                 <p>Cobros: S/ {superMetricas.cobroDeudasYape.toFixed(2)}</p>
               </div>
            </div>

            <div className="bg-[#F8FAFC] border-2 border-[#E2E8F0] p-4">
               <p className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-widest flex items-center gap-2"><CreditCard size={14}/> Pagos Tarjeta</p>
               <p className="text-xl font-black text-[#1E293B] mt-1">S/ {superMetricas.ventasTarjeta.toFixed(2)}</p>
               <p className="text-[9px] font-bold text-[#64748B] uppercase mt-2 border-t pt-2">Ventas directas POS</p>
            </div>

            <div className="bg-[#FEF2F2] border-2 border-[#EF4444] p-4">
               <p className="text-[10px] font-black text-[#EF4444] uppercase tracking-widest flex items-center gap-2"><ArrowDownToLine size={14}/> Gastos y Retiros</p>
               <p className="text-xl font-black text-[#EF4444] mt-1">S/ {superMetricas.gastos.toFixed(2)}</p>
               <p className="text-[9px] font-bold text-[#EF4444] uppercase mt-2 border-t border-[#EF4444]/20 pt-2">Salió del cajón</p>
            </div>
          </div>

          <div className="flex-1 bg-white border-2 border-[#E2E8F0] shadow-[8px_8px_0_0_#E2E8F0] flex flex-col overflow-hidden">
             
             {/* PESTAÑAS TÉCNICAS */}
             <div className="flex border-b-2 border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
               <button 
                 onClick={() => setPestañaFlujo('INTERNO')}
                 className={`flex-1 py-3 text-xs font-black uppercase tracking-widest border-b-4 transition-colors cursor-pointer rounded-none ${pestañaFlujo === 'INTERNO' ? 'border-[#1E293B] text-[#1E293B] bg-white' : 'border-transparent text-[#94A3B8] hover:text-[#1E293B] hover:bg-white'}`}
               >
                 Movimientos Internos (Negocio)
               </button>
               <button 
                 onClick={() => setPestañaFlujo('EXTERNO')}
                 className={`flex-1 py-3 text-xs font-black uppercase tracking-widest border-b-4 transition-colors cursor-pointer rounded-none ${pestañaFlujo === 'EXTERNO' ? 'border-[#1E293B] text-[#1E293B] bg-white' : 'border-transparent text-[#94A3B8] hover:text-[#1E293B] hover:bg-white'}`}
               >
                 Movimientos Externos (Personal)
               </button>
             </div>
             
             {/* TABLA FILTRADA CON FUNCIÓN ONDELTE */}
             <TablaMovimientos 
               movimientos={movimientos.filter(m => (pestañaFlujo === 'INTERNO' ? (m.flujo === 'INTERNO' || !m.flujo) : m.flujo === 'EXTERNO'))} 
               onDelete={handleDeleteMovimiento}
             />
          </div>
        </div>
      ) : (
        <div className="flex-1 border-4 border-dashed border-[#E2E8F0] flex flex-col items-center justify-center p-6">
           <Wallet size={64} className="text-[#CBD5E1] mb-4" />
           <h2 className="text-[#1E293B] font-black text-xl uppercase tracking-widest mb-2">Caja Cerrada</h2>
        </div>
      )}

      <ModalApertura isOpen={isAperturaModalOpen} onClose={() => setIsAperturaModalOpen(false)} onSuccess={cargarDatosCaja} />
      {sessionActiva && (
        <>
          <ModalNuevoMovimiento isOpen={isMovimientoModalOpen} onClose={() => setIsMovimientoModalOpen(false)} onSuccess={cargarDatosCaja} sessionId={sessionActiva.id} />
          <ModalCierre isOpen={isCierreModalOpen} onClose={() => setIsCierreModalOpen(false)} onSuccess={cargarDatosCaja} sessionActiva={sessionActiva} metricas={metricas} />
        </>
      )}
    </div>
  );
};