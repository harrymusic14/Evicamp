// src/sections/Utilidades/index.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../db/supabase';

// Componentes modulares
import { FiltrosUtilidades } from './components/FiltrosUtilidades';
import { TarjetasResumen } from './components/TarjetasResumen';
import { TablaAnalisisProductos } from './components/TablaAnalisisProductos';
import { TablaRanking } from './components/TablaRanking';

// Tipos
import type { MetricaDia, MetricaProducto, MetricaCategoria, AnalisisProducto } from './types';

export const Utilidades: React.FC = () => {
  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  const hoyStr = hoy.toISOString().split('T')[0];

  const [fechaInicio, setFechaInicio] = useState<string>(primerDiaMes);
  const [fechaFin, setFechaFin] = useState<string>(hoyStr);
  
  const [metricasDia, setMetricasDia] = useState<MetricaDia[]>([]);
  const [metricasProd, setMetricasProd] = useState<MetricaProducto[]>([]);
  const [metricasCat, setMetricasCat] = useState<MetricaCategoria[]>([]);
  const [analisisCompleto, setAnalisisCompleto] = useState<AnalisisProducto[]>([]);
  const [gastosCaja, setGastosCaja] = useState<number>(0); // Estado para Finanzas
  const [isLoading, setIsLoading] = useState(false);

  // Funciones de Filtro
  const filtrarHoy = () => { setFechaInicio(hoyStr); setFechaFin(hoyStr); };
  const filtrarSemana = () => {
    const haceUnaSemana = new Date();
    haceUnaSemana.setDate(hoy.getDate() - 7);
    setFechaInicio(haceUnaSemana.toISOString().split('T')[0]);
    setFechaFin(hoyStr);
  };
  const filtrarMes = () => { setFechaInicio(primerDiaMes); setFechaFin(hoyStr); };
  
  const limpiarFiltros = () => {
    setFechaInicio(primerDiaMes);
    setFechaFin(hoyStr);
  };

  // Motor de cálculo
  useEffect(() => {
    const procesarEstadisticas = async () => {
      setIsLoading(true);
      const fechaFinExpandida = new Date(fechaFin);
      fechaFinExpandida.setDate(fechaFinExpandida.getDate() + 1);
      const finAjustado = fechaFinExpandida.toISOString().split('T')[0];

      // EVITAMOS EL JOIN Y EVITAMOS LA URL LARGA PROCESANDO EN LOTES DE 150
      const [ { data: sales }, { data: products }, { data: waste }, { data: movements } ] = await Promise.all([
        supabase.from('sales').select('id, total, created_at, sunat_status').gte('created_at', `${fechaInicio}T00:00:00`).lt('created_at', `${finAjustado}T00:00:00`).neq('sunat_status', 'ANULADO'),
        supabase.from('products').select('*'),
        supabase.from('waste').select('*').gte('created_at', `${fechaInicio}T00:00:00`).lt('created_at', `${finAjustado}T00:00:00`),
        supabase.from('cash_movements').select('*').gte('created_at', `${fechaInicio}T00:00:00`).lt('created_at', `${finAjustado}T00:00:00`)
      ]);

      const facturas = sales || [];
      let detalles: any[] = [];
      
      // Procesamiento por Lotes (Chunking): Seguro, rápido y no colapsa el servidor
      if (facturas.length > 0) {
        const saleIds = facturas.map(s => s.id);
        const chunkSize = 150; // Límite de seguridad estricto para la URL
        for (let i = 0; i < saleIds.length; i += chunkSize) {
          const chunk = saleIds.slice(i, i + chunkSize);
          const { data: chunkDetails } = await supabase
            .from('sale_details')
            .select('*')
            .in('sale_id', chunk);
          if (chunkDetails) detalles = [...detalles, ...chunkDetails];
        }
      }
      const catalogo = products || [];
      const mermas = waste || [];
      const movsCaja = movements || [];

      // Calcular gastos operativos de Finanzas (Solo EGRESOS de la caja INTERNA)
      let totalGastos = 0;
      movsCaja.forEach(m => {
        if (m.type === 'EGRESO' && (m.flujo === 'INTERNO' || !m.flujo)) {
          totalGastos += Number(m.amount);
        }
      });
      setGastosCaja(totalGastos);

      const mapDias: Record<string, MetricaDia> = {};
      facturas.forEach(sale => {
        const fechaLocal = new Date(sale.created_at).toLocaleDateString('es-PE');
        if (!mapDias[fechaLocal]) mapDias[fechaLocal] = { fecha: fechaLocal, total: 0, tickets: 0 };
        mapDias[fechaLocal].total += Number(sale.total);
        mapDias[fechaLocal].tickets += 1;
      });
      setMetricasDia(Object.values(mapDias).sort((a, b) => b.total - a.total));

      const mapaAnalisis: Record<string, AnalisisProducto> = {};
      catalogo.forEach(p => {
        // Creamos un texto largo con toda la info del producto para buscar "consumo" ahí
        const infoBusqueda = `${p.control_type} ${p.unit} ${p.category} ${p.name}`.toLowerCase();
        const esConsumo = infoBusqueda.includes('consumo');

        mapaAnalisis[p.id] = {
          id: p.id, nombre: p.name, categoria: p.category || 'SIN CATEGORÍA', estado: '',
          stockActual: Number(p.quantity) || 0, 
          tipoControl: esConsumo ? 'CONSUMO' : 'STOCK', // Si encuentra la palabra, lo marca como CONSUMO
          unidadesVendidas: 0, ingresosTotales: 0, costoTotalVentas: 0, unidadesMerma: 0, perdidaMerma: 0, utilidadReal: 0, margen: 0
        };
      });

      detalles.forEach(d => {
        if (!mapaAnalisis[d.product_id]) return;
        const prod = mapaAnalisis[d.product_id];
        prod.unidadesVendidas += Number(d.quantity);
        prod.ingresosTotales += Number(d.subtotal);
        const costoUsar = d.cost_at_moment ? Number(d.cost_at_moment) : Number(catalogo.find(c => c.id === d.product_id)?.cost_price || 0);
        prod.costoTotalVentas += (Number(d.quantity) * costoUsar);
      });

      mermas.forEach(w => {
        if (!mapaAnalisis[w.product_id]) return;
        const prod = mapaAnalisis[w.product_id];
        prod.unidadesMerma += Number(w.quantity);
        prod.perdidaMerma += Number(w.total_loss);
      });

      const resultadoAnalisis: AnalisisProducto[] = [];
      Object.values(mapaAnalisis).forEach(prod => {
        // Mostramos SIEMPRE todos los productos del inventario para poder analizarlos
        prod.utilidadReal = prod.ingresosTotales - prod.costoTotalVentas - prod.perdidaMerma;
        prod.margen = prod.ingresosTotales > 0 ? (prod.utilidadReal / prod.ingresosTotales) * 100 : (prod.utilidadReal < 0 ? -100 : 0);
        resultadoAnalisis.push(prod);
      });

      // --- NUEVA LÓGICA: CÁLCULO DE ESTADO POR ROTACIÓN DE VENTAS ---
      // Buscamos cuál es el producto que más se vendió para comparar a los demás con él
      const maxVentas = Math.max(...resultadoAnalisis.map(p => p.unidadesVendidas), 1);
      
      resultadoAnalisis.forEach(prod => {
        if (prod.unidadesVendidas === 0) {
          prod.estado = 'SIN VENTAS'; // Tuvo merma pero no se vendió nada
        } else if (prod.unidadesVendidas >= maxVentas * 0.4) {
          // Si vende al menos el 40% de lo que vende tu producto estrella
          prod.estado = 'BUENO';
        } else if (prod.unidadesVendidas >= maxVentas * 0.1) {
          // Si vende entre el 10% y el 40%
          prod.estado = 'REGULAR';
        } else {
          // Si vende menos del 10% de lo que vende tu producto estrella
          prod.estado = 'BAJO';
        }
      });
      // -------------------------------------------------------------

      setAnalisisCompleto(resultadoAnalisis.sort((a, b) => b.utilidadReal - a.utilidadReal));

      const topCat: Record<string, MetricaCategoria> = {};
      resultadoAnalisis.forEach(r => {
        if (!topCat[r.categoria]) topCat[r.categoria] = { categoria: r.categoria, cantidadVendida: 0, totalRecaudado: 0 };
        topCat[r.categoria].cantidadVendida += r.unidadesVendidas;
        topCat[r.categoria].totalRecaudado += r.ingresosTotales;
      });
      // Filtramos para que los "Top Rankings" de arriba solo muestren los que sí tuvieron ventas reales (>0)
      setMetricasCat(Object.values(topCat).filter(c => c.cantidadVendida > 0).sort((a, b) => b.totalRecaudado - a.totalRecaudado));
      setMetricasProd(resultadoAnalisis.filter(r => r.unidadesVendidas > 0).map(r => ({ id: r.id, nombre: r.nombre, cantidadVendida: r.unidadesVendidas, totalRecaudado: r.ingresosTotales })).sort((a, b) => b.totalRecaudado - a.totalRecaudado).slice(0, 50));

      setIsLoading(false);
    };

    procesarEstadisticas();
  }, [fechaInicio, fechaFin]);

  const globalIngresos = analisisCompleto.reduce((acc, p) => acc + p.ingresosTotales, 0);
  const globalCostos = analisisCompleto.reduce((acc, p) => acc + p.costoTotalVentas, 0);
  const globalMermas = analisisCompleto.reduce((acc, p) => acc + p.perdidaMerma, 0);
  
  // FÓRMULA MAESTRA: Ingresos - Costos - Mermas - Gastos Operativos = Utilidad Neta Real
  const globalUtilidad = globalIngresos - globalCostos - globalMermas - gastosCaja;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto font-sans bg-[#F8FAFC]">
      
      {/* SECCIÓN SUPERIOR */}
      <div className="flex flex-col gap-6 shrink-0">
        <FiltrosUtilidades 
          fechaInicio={fechaInicio} fechaFin={fechaFin} 
          setFechaInicio={setFechaInicio} setFechaFin={setFechaFin}
          filtrarHoy={filtrarHoy} filtrarSemana={filtrarSemana} 
          filtrarMes={filtrarMes} limpiarFiltros={limpiarFiltros}
        />
        <TarjetasResumen 
          ingresos={globalIngresos} costos={globalCostos} 
          mermas={globalMermas} gastosOperativos={gastosCaja} utilidad={globalUtilidad} 
        />
        
        {/* RANKINGS AHORA SON FIJOS ARRIBA */}
        {!isLoading && (
          <div className="flex flex-wrap lg:flex-nowrap gap-6 shrink-0">
            <TablaRanking titulo="Top Categorías" color="text-blue-700" items={metricasCat.map(c => ({ nombre: c.categoria, cantidad: c.cantidadVendida, total: c.totalRecaudado }))} />
            <TablaRanking titulo="Top Productos" color="text-emerald-700" items={metricasProd.map(p => ({ nombre: p.nombre, cantidad: p.cantidadVendida, total: p.totalRecaudado }))} />
            <TablaRanking titulo="Mejores Días" color="text-amber-700" items={metricasDia.map(d => ({ nombre: d.fecha, cantidad: d.tickets, total: d.total }))} />
          </div>
        )}
      </div>

      {/* ÁREA DE SCROLL GENERAL */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center font-sans py-10">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent animate-spin rounded-full mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Calculando rentabilidad global...</p>
        </div>
      ) : (
        <div className="pb-6">
          <TablaAnalisisProductos datos={analisisCompleto} />
        </div>
      )}
    </div>
  );
};