import React, { useState, useEffect, useMemo } from 'react';
import { Database, TrendingDown, PackageMinus } from 'lucide-react';
import { supabase } from '../../db/supabase';
import type { Merma } from './types';
import type { Product } from '../Inventario/types';
import { ModalMerma } from '../Inventario/components/ModalMerma';

// Componentes
import { HeaderMermas } from './components/HeaderMermas';
import { FiltrosMermas } from './components/FiltrosMermas';
import { TarjetaMetrica } from './components/TarjetaMetrica';
import { TablaMermas } from './components/TablaMermas';

export const Mermas: React.FC = () => {
  const [mermas, setMermas] = useState<Merma[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalMermaOpen, setIsModalMermaOpen] = useState(false);
  const [mermaAEditar, setMermaAEditar] = useState<any>(null);

  // Estados de Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroMotivo, setFiltroMotivo] = useState('');
  const [filtroOrden, setFiltroOrden] = useState('FECHA_DESC');
  const [filtroFecha, setFiltroFecha] = useState('');

  const fetchMermas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('waste')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapeados = data.map((w: any) => ({
          ...w,
          product_name: w.product_name || 'DESCONOCIDO',
          quantity: Math.abs(Number(w.quantity) || 0),
          cost_unit: Number(w.cost_unit) || 0,
          total_loss: Number(w.total_loss) || 0,
          reason: w.reason || 'SIN MOTIVO',
          notes: w.notes,
          user_name: w.user || 'Sistema',
          created_at: w.created_at ? new Date(w.created_at).toLocaleString() : 'SIN FECHA',
          raw_date: w.created_at,
        })) as any[];
        setMermas(mapeados);
      }
    } catch (error) {
      console.error("DEBUG TÉCNICO - Error cargando mermas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      if (data) {
        const mapeados: Product[] = data.map((p: any) => {
          const registroCompleto = JSON.stringify(p).toUpperCase();
          const esConsumo = registroCompleto.includes('"CONSUMO"') || 
                            registroCompleto.includes('"SERVICE"') || 
                            registroCompleto.includes('"USO INTERNO"') ||
                            registroCompleto.includes('"CONSUMPTION"');

          return {
            id: p.id,
            name: p.name || 'SIN NOMBRE',
            price: Number(p.price) || 0,
            cost: Number(p.cost_price) || 0,
            quantity: Number(p.quantity) || 0,
            minStock: Number(p.min_stock) || 0,
            code: p.code || 'NO-SKU',
            barcode: p.barcode || '',
            category: p.category || 'GENERAL',
            unit: esConsumo ? 'CONSUMO' : (p.unit || p.weight_unit || (p.control_type === 'WEIGHT' ? 'KG' : 'UND')),
            imageUrl: p.image_url || p.image_path || null
          };
        });
        setProducts(mapeados);
      }
    } catch (error) {
      console.error("DEBUG TÉCNICO - Error cargando productos:", error);
    }
  };

  useEffect(() => {
    fetchMermas();
    fetchProducts();
  }, []);

  const motivosUnicos = useMemo(() => {
    const motivos = mermas.map(m => m.reason).filter(Boolean);
    return Array.from(new Set(motivos)).sort();
  }, [mermas]);

  // Motor de Filtrado y Ordenamiento
  const filteredMermas = useMemo(() => {
    let result = [...mermas];

    if (filtroFecha) {
      result = result.filter(m => {
        const dateObj = new Date(m.raw_date);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const fechaRegistro = `${yyyy}-${mm}-${dd}`;
        return fechaRegistro === filtroFecha;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.product_name.toLowerCase().includes(q) || 
        (m.notes && m.notes.toLowerCase().includes(q))
      );
    }

    if (filtroMotivo) {
      result = result.filter(m => m.reason === filtroMotivo);
    }

    result.sort((a: any, b: any) => {
      if (filtroOrden === 'FECHA_DESC') return new Date(b.raw_date).getTime() - new Date(a.raw_date).getTime();
      if (filtroOrden === 'FECHA_ASC') return new Date(a.raw_date).getTime() - new Date(b.raw_date).getTime();
      if (filtroOrden === 'PERDIDA_DESC') return b.total_loss - a.total_loss;
      if (filtroOrden === 'PERDIDA_ASC') return a.total_loss - b.total_loss;
      return 0;
    });

    return result;
  }, [mermas, searchQuery, filtroMotivo, filtroOrden, filtroFecha]);

  const totalPerdidaEconómica = filteredMermas.reduce((acc, m) => acc + m.total_loss, 0);
  const totalUnidadesPerdidas = filteredMermas.reduce((acc, m) => acc + m.quantity, 0);

  // CONTROLADOR DE ELIMINACIÓN INTELIGENTE - EVICAMP STANDARD (V2 Resiliente)
  const handleDeleteMerma = async (merma: Merma) => {
    const esConsumo = merma.reason === 'USO INTERNO' || Number(merma.quantity) === 0;

    const mensajeConfirmacion = esConsumo 
      ? `OPERACIÓN FINANCIERA: ¿Anular el registro de gasto de S/ ${merma.total_loss.toFixed(2)} en ${merma.product_name}?`
      : `OPERACIÓN CRÍTICA: ¿Eliminar merma de ${merma.product_name}? Se restaurarán ${Math.abs(Number(merma.quantity))} unidades al inventario.`;

    if (!window.confirm(mensajeConfirmacion)) return;

    try {
      setLoading(true);

      // 🛡️ Ciberseguridad & Arquitectura Resiliente: Constructor de consultas dinámico
      let deleteQuery = supabase.from('waste').delete();

      if (merma.id) {
        // Vía Primaria: Borrado por ID único absoluto
        deleteQuery = deleteQuery.eq('id', merma.id);
      } else if (merma.raw_date && merma.product_id) {
        // Vía Secundaria (Fallback): Si la BD omite el ID (por RLS o datos heredados), 
        // usamos la "Huella Temporal Exacta" (timestamp + producto) para identificar la fila.
        deleteQuery = deleteQuery
          .eq('created_at', merma.raw_date)
          .eq('product_id', merma.product_id);
      } else {
        // Bloqueo estricto solo si el registro es totalmente fantasma
        throw new Error("Violación estructural: El registro carece de ID y de Marca de Tiempo. Imposible operar de forma segura en la base de datos.");
      }

      const { error: deleteError } = await deleteQuery;

      if (deleteError) throw new Error(`Fallo en motor SQL: ${deleteError.message}`);

      alert(esConsumo 
        ? '✅ REGISTRO FINANCIERO DE GASTO ELIMINADO CON ÉXITO.' 
        : '✅ MERMA ELIMINADA. EL INVENTARIO FUE RESTAURADO.');
      
      // Sincronización del Plano de Datos
      await Promise.all([fetchMermas(), fetchProducts()]);

    } catch (error: any) {
      console.error('DEBUG TÉCNICO - FALLO EN TRANSACCIÓN DELETE:', error);
      alert(`ERROR DEL SISTEMA: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10 text-[#1E293B] font-mono min-h-full bg-[#FFFFFF] relative z-0 rounded-none">
      
      <HeaderMermas 
        onNuevaMerma={() => setIsModalMermaOpen(true)} 
      />

      {/* MÉTRICAS */}
      <div className="px-8 flex gap-4 overflow-x-auto w-full pb-2 custom-scrollbar shrink-0 rounded-none">
        <TarjetaMetrica 
          label="Eventos Registrados" 
          value={filteredMermas.length} 
          icon={<Database size={16}/>} 
        />
        <TarjetaMetrica 
          label="Unidades Afectadas" 
          value={totalUnidadesPerdidas} 
          icon={<PackageMinus size={16}/>} 
        />
        <TarjetaMetrica 
          label="Pérdida Económica" 
          value={`S/ ${totalPerdidaEconómica.toFixed(2)}`} 
          icon={<TrendingDown size={16}/>} 
          isAlert={totalPerdidaEconómica > 0} 
        />
      </div>

      <FiltrosMermas 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filtroMotivo={filtroMotivo}
        setFiltroMotivo={setFiltroMotivo}
        filtroOrden={filtroOrden}
        setFiltroOrden={setFiltroOrden}
        filtroFecha={filtroFecha}
        setFiltroFecha={setFiltroFecha}
        motivosUnicos={motivosUnicos}
        matchCount={filteredMermas.length}
        onClearFilters={() => {
          setSearchQuery('');
          setFiltroMotivo('');
          setFiltroOrden('FECHA_DESC');
          setFiltroFecha('');
        }}
      />

      <div className="px-8 flex-1 flex flex-col min-h-[60vh] relative pb-8 rounded-none">
        {loading ? (
          <div className="absolute inset-0 bg-[#FFFFFF]/90 backdrop-blur-sm z-10 flex items-center justify-center border border-[#E2E8F0] rounded-none shadow-none">
            <div className="flex flex-col items-center gap-3">
              <Database size={24} className="text-[#1E293B] animate-pulse" />
              <span className="text-[10px] font-black text-[#1E293B] uppercase tracking-[0.2em]">Consultando Base de Datos...</span>
            </div>
          </div>
        ) : (
          <TablaMermas 
            mermas={filteredMermas} 
            onEdit={(merma) => {
              setMermaAEditar(merma);
              setIsModalMermaOpen(true);
            }}
            onDelete={handleDeleteMerma}
          />
        )}
      </div>

      {/* MODAL */}
      <ModalMerma 
        isOpen={isModalMermaOpen} 
        initialData={mermaAEditar} 
        onClose={() => {
          setIsModalMermaOpen(false);
          setMermaAEditar(null);
          fetchMermas(); 
          fetchProducts();
        }}
        productos={products}
      />

    </div>
  );
};