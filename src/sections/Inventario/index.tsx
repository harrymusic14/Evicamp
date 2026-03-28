import React, { useState, useEffect, useMemo } from 'react';
import { Package, Layers, Box, AlertTriangle, LayoutGrid } from 'lucide-react';
import { supabase } from '../../db/supabase';
import type { Product } from './types';

// Componentes importados
import { HeaderInventario } from './components/HeaderInventario';
import { FiltrosInventario } from './components/FiltrosInventario';
import { TablaProductos } from './components/TablaProductos';
import { ModalProducto } from './components/ModalProducto';
import { TablaLotes } from './components/TablaLotes';
import { ModalMerma } from './components/ModalMerma';
import { TarjetaMetrica } from './components/TarjetaMetrica';
import { ModalLote } from './components/ModalLote';

interface InventarioProps {
  onNavigate?: (view: string) => void;
}
export const Inventario: React.FC<InventarioProps> = ({ onNavigate }) => {
  const [vistaActiva, setVistaActiva] = useState<'PRODUCTOS' | 'LOTES'>('PRODUCTOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalMermaOpen, setIsModalMermaOpen] = useState(false);
  const [mermaAEditar, setMermaAEditar] = useState<any>(null);
  const [isModalLoteOpen, setIsModalLoteOpen] = useState(false); // <-- ESTADO DEL NUEVO MODAL
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [preselectedLoteProduct, setPreselectedLoteProduct] = useState<Product | null>(null);
  const [nuevoLoteRealtime, setNuevoLoteRealtime] = useState<any>(null);
  const [loteToEdit, setLoteToEdit] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbCategories, setDbCategories] = useState<string[]>([]); // 🔥 NUEVO: Memoria para tu tabla categories

  // ESTADOS DE LOS FILTROS
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroOrden, setFiltroOrden] = useState('NOMBRE_ASC');

  // ESTADO DE LA PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50; // <--- Cortamos de 50 en 50

  // Reiniciar a la página 1 si el usuario usa un filtro o busca algo
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filtroCategoria, filtroEstado, filtroOrden]);

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      try {
        // [ RETORNO TÉCNICO ]: Consultas paralelas independientes para blindar la carga de datos y evitar colisiones SQL
        const [ 
          { data: productsData, error: productsError }, 
          { data: batchesData, error: batchesError },
          { data: catData, error: catError } // 🔥 NUEVO: Traemos tu tabla
        ] = await Promise.all([
          supabase.from('products').select('*').neq('is_active', 0).limit(15000),
          supabase.from('batches').select('id, product_id, quantity, cost_unit').gt('quantity', 0).limit(15000),
          supabase.from('categories').select('name') // 🔥 CONEXIÓN A TU TABLA
        ]);

        if (productsError) throw productsError;
        if (batchesError) throw batchesError;
        if (catError) console.error("Error cargando categorías:", catError); // 🔥 NUEVO: Ahora sí leemos el error

        if (catData) {
          setDbCategories(catData.map((c: any) => c.name?.trim().toUpperCase()).filter(Boolean));
        }
        
        if (productsData) {
          const mapeados: Product[] = productsData.map((p: any) => {
            // RADAR ABSOLUTO: Convierte TODA la fila del producto (todas sus columnas) a texto mayúscula
            const registroCompleto = JSON.stringify(p).toUpperCase();
            
            // Si en cualquier rincón del producto dice alguna de estas palabras, es Consumo.
            const esConsumo = registroCompleto.includes('"CONSUMO"') || 
                              registroCompleto.includes('"SERVICE"') || 
                              registroCompleto.includes('"USO INTERNO"') ||
                              registroCompleto.includes('"CONSUMPTION"');

            // [ SUMA GLOBAL ]: Filtramos los lotes de este producto
            const lotesDelProducto = batchesData?.filter(b => b.product_id === p.id) || [];
            
            // [ COSTO RECIENTE ]: Ordenamos por ID (o podrías usar created_at si lo incluyes en el select)
            // para obtener el costo del lote más nuevo.
            // [ RETORNO TÉCNICO ]: Forzamos String() para evitar que IDs numéricos rompan localeCompare
            const loteMasReciente = lotesDelProducto.length > 0 
              ? [...lotesDelProducto].sort((a, b) => String(b.id || '').localeCompare(String(a.id || '')))[0] 
              : null;
            // [ RETORNO TÉCNICO ]: Si el producto tiene seguimiento por lotes, la suma debe ser 0 si no hay lotes.
            // Solo mostramos p.quantity si el producto es de "Consumo" o no usa lotes.
            const stockRealGlobal = lotesDelProducto.length > 0
              ? lotesDelProducto.reduce((total: number, lote: any) => total + (Number(lote.quantity) || 0), 0)
              : 0; // <--- Cambiamos el fallback a 0

            return {
              id: p.id,
              name: p.name || 'SIN NOMBRE',
              price: Number(p.price) || 0,
              // Usamos el costo del lote reciente, si no hay, usamos el del producto
              cost: loteMasReciente ? Number(loteMasReciente.cost_unit) : (Number(p.cost_price) || 0),
              quantity: stockRealGlobal,
              minStock: Number(p.min_stock) || 0,
              code: p.code || 'NO-SKU',
              barcode: p.barcode || '',
              category: p.category || 'GENERAL',
              // Si el radar detectó consumo, fuerza la etiqueta, sino usa la que traiga de BD
              unit: esConsumo ? 'CONSUMO' : (p.unit || p.weight_unit || (p.control_type === 'WEIGHT' ? 'KG' : 'UND')),
              imageUrl: p.image_url || p.image_path || null
            };
          });
          setProducts(mapeados);
        }
      } catch (error) {
        console.error("Error cargando inventario:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const categoriasUnicas = useMemo(() => {
    const cats = products.map(p => p.category).filter(Boolean);
    // 🔥 Mezclamos las que ya tienen productos con TODAS las de tu tabla
    return Array.from(new Set([...cats, ...dbCategories])).sort();
  }, [products, dbCategories]);

  // LÓGICA MAESTRA DE FILTRADO Y ORDENAMIENTO
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim(); // <-- Limpiamos espacios basura
      result = result.filter(p => {
        if (!p) return false;
        const name = String(p.name || '').toLowerCase();
        const code = String(p.code || '').toLowerCase();
        const barcode = String(p.barcode || '').toLowerCase(); // 🔥 EXTRAEMOS EL CÓDIGO DE BARRAS
        return name.includes(query) || code.includes(query) || barcode.includes(query); // 🔥 AGREGAMOS SOPORTE PARA ESCÁNER
      });
    }

    if (filtroCategoria) {
      result = result.filter(p => p.category === filtroCategoria);
    }

    if (filtroEstado === 'CON_STOCK') {
      result = result.filter(p => p.quantity > 0);
    } else if (filtroEstado === 'SIN_STOCK') {
      result = result.filter(p => p.quantity <= 0);
    } else if (filtroEstado === 'CRITICO') {
      result = result.filter(p => p.unit !== 'CONSUMO' && p.quantity <= p.minStock && p.quantity > 0);
    }

    result.sort((a, b) => {
      if (filtroOrden === 'NOMBRE_ASC') return a.name.localeCompare(b.name);
      if (filtroOrden === 'NOMBRE_DESC') return b.name.localeCompare(a.name);
      if (filtroOrden === 'STOCK_ASC') return a.quantity - b.quantity;
      if (filtroOrden === 'STOCK_DESC') return b.quantity - a.quantity;
      if (filtroOrden === 'PRECIO_ASC') return a.price - b.price;
      if (filtroOrden === 'PRECIO_DESC') return b.price - a.price;
      return 0;
    });

    return result;
  }, [products, searchQuery, filtroCategoria, filtroEstado, filtroOrden]);

  // === MATEMÁTICA DE LA PAGINACIÓN ===
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleClearFilters = () => {
    setSearchQuery('');
    setFiltroCategoria('');
    setFiltroEstado('');
    setFiltroOrden('NOMBRE_ASC');
  };

  const lowStockCount = products.filter(p => p.unit !== 'CONSUMO' && p.quantity <= p.minStock).length;
  const totalValue = products.reduce((acc, p) => acc + (p.cost * p.quantity), 0);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10 text-[#1E293B] font-mono h-full bg-white relative z-0">
      
      <HeaderInventario 
        onIngresoStock={() => setIsModalLoteOpen(true)} 
        onNuevoSKU={() => setIsModalOpen(true)}
        onRegistrarMerma={() => setIsModalMermaOpen(true)}
      />

      <div className="px-8 shrink-0 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <div className="flex border-2 border-[#1E293B] p-0.5 bg-[#F8FAFC]">
          <button onClick={() => setVistaActiva('PRODUCTOS')} className={`flex items-center gap-2 px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-none cursor-pointer ${vistaActiva === 'PRODUCTOS' ? 'bg-[#1E293B] text-white' : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'}`}>
            <Package size={14} /> Inventario General
          </button>
          <button onClick={() => setVistaActiva('LOTES')} className={`flex items-center gap-2 px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-none cursor-pointer ${vistaActiva === 'LOTES' ? 'bg-[#1E293B] text-[#10B981]' : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'}`}>
            <Layers size={14} /> Control de Lotes
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 custom-scrollbar">
          <TarjetaMetrica label="Total SKUs" value={products.length} icon={<Box size={14}/>} />
          <TarjetaMetrica label="Nivel Crítico" value={lowStockCount} icon={<AlertTriangle size={14}/>} isAlert={lowStockCount > 0} />
          <TarjetaMetrica label="Valor Total" value={`S/ ${totalValue.toFixed(2)}`} icon={<LayoutGrid size={14}/>} isGreen />
        </div>
      </div>

      <FiltrosInventario 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        matchCount={filteredProducts.length}
        categorias={categoriasUnicas}
        filtroCategoria={filtroCategoria}
        setFiltroCategoria={setFiltroCategoria}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
        filtroOrden={filtroOrden}
        setFiltroOrden={setFiltroOrden}
        onClearFilters={handleClearFilters}
      />

      <div className="flex-1 px-8 min-h-0 flex flex-col relative pb-8">
        <div className={`flex-1 min-h-0 ${vistaActiva === 'PRODUCTOS' ? 'flex flex-col' : 'hidden'}`}>
          {/* PASAMOS LOS DATOS PAGINADOS A LA TABLA */}
          <TablaProductos 
  loading={loading} 
  productos={paginatedProducts} 
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  onEditProduct={(p) => {
    setProductToEdit(p);
    setIsModalOpen(true);
  }}
  onDeleteProduct={async (productToDelete) => {
    // 1. BORRADO LÓGICO Y CUADRE DE STOCK VÍA RPC
    const { error } = await supabase.rpc('soft_delete_product', {
      p_product_id: productToDelete.id,
      p_user_name: 'Admin' // O el nombre del usuario logueado
    });

    if (error) {
      console.error("Error técnico de BD:", error);
      alert("⚠️ Fallo crítico: No se pudo retirar el producto.");
      return;
    }

    // 2. ACTUALIZACIÓN VISUAL INMEDIATA
    setProducts(prevProducts => prevProducts.filter(p => p.id !== productToDelete.id));
  }}
  // === NUEVA CONEXIÓN AQUÍ ===
  onViewHistory={(producto) => {
    setVistaActiva('LOTES'); // Cambia a la pestaña de Lotes
    setSearchQuery(producto.name); // Busca automáticamente el nombre del producto
  }}
  // ===========================
/>
        </div>
        <div className={`flex-1 min-h-0 ${vistaActiva === 'LOTES' ? 'flex flex-col' : 'hidden'}`}>
          <TablaLotes 
            searchQuery={searchQuery}
            filtroCategoria={filtroCategoria}
            filtroEstado={filtroEstado}
            filtroOrden={filtroOrden}
            nuevoLoteInyectado={nuevoLoteRealtime}
            onViewMermas={(_lote) => {
              // Aquí podrías filtrar las mermas por ese lote específico si lo deseas
              if (onNavigate) onNavigate('mermas');
            }}
            onEditLote={(lote) => {
              setLoteToEdit(lote);
              setIsModalLoteOpen(true);
            }}
            // [ RETORNO TÉCNICO ]: Si se borra un lote, actualizamos la memoria de productos
            onLoteDeleted={(productId, quantityRemoved) => {
              setProducts(prev => prev.map(p => {
                if (p.id === productId) {
                  const nuevoStock = Math.max(0, p.quantity - quantityRemoved);
                  return {
                    ...p,
                    quantity: nuevoStock,
                    // Si el stock llega a 0, reseteamos el costo visual para que no confunda
                    cost: nuevoStock === 0 ? 0 : p.cost 
                  };
                }
                return p;
              }));
            }}
          />
        </div>
      </div>

      <ModalProducto 
        isOpen={isModalOpen} 
        initialData={productToEdit}
        productosExistentes={products}
        onClose={() => {
          setIsModalOpen(false);
          setProductToEdit(null);
        }}
        onGoToLotes={(productoRecienCreado) => {
          setIsModalOpen(false);
          setProductToEdit(null);
          setVistaActiva('LOTES');
          
          // Si nos llega un producto, lo metemos en memoria y abrimos el modal de Lotes
          if (productoRecienCreado) {
            setPreselectedLoteProduct(productoRecienCreado);
            setIsModalLoteOpen(true);
          }
        }}
        onProductSaved={(nuevoProducto: any) => {
          // [ RETORNO TÉCNICO ]: Mapeo de integridad. Si es edición, preservamos el stock calculado actual.
          const stockActual = products.find(p => p.id === nuevoProducto.id)?.quantity;

          const productoFormateado: Product = {
            ...nuevoProducto,
            id: nuevoProducto.id,
            name: nuevoProducto.name,
            cost: Number(nuevoProducto.cost_price || nuevoProducto.cost || 0),
            price: Number(nuevoProducto.price || 0),
            quantity: stockActual !== undefined ? stockActual : Number(nuevoProducto.quantity || 0),
            minStock: Number(nuevoProducto.min_stock || nuevoProducto.minStock || 0),
            category: nuevoProducto.category,
            code: nuevoProducto.code,
            unit: nuevoProducto.unit,
            imageUrl: nuevoProducto.image_url || nuevoProducto.image_path || null
          };

          if (productToEdit) {
            setProducts(prev => prev.map(p => p.id === productToEdit.id ? productoFormateado : p));
          } else {
            setProducts(prev => [productoFormateado, ...prev]);
            setCurrentPage(1);
          }
        }}
      />
      <ModalMerma 
        isOpen={isModalMermaOpen} 
        initialData={mermaAEditar} // <--- AHORA EL MODAL RECIBE LOS DATOS
        onClose={() => {
          setIsModalMermaOpen(false);
          setMermaAEditar(null); // <--- LIMPIEZA PARA QUE NO QUEDE PEGADO
        }} 
        productos={products} 
        onProductSaved={(productoActualizado: any, loteId?: string, nuevaCantLote?: number) => {
          setProducts(prev => prev.map(p => 
            p.id === productoActualizado.id 
              ? { ...p, quantity: productoActualizado.quantity } 
              : p
          ));

          if (loteId && nuevaCantLote !== undefined) {
            setNuevoLoteRealtime({
              id: loteId,
              quantity: nuevaCantLote
            });
          }
        }}
      />
      {/* INVOCACIÓN DEL NUEVO MODAL DE LOTES */}
      <ModalLote 
        isOpen={isModalLoteOpen} 
        onClose={() => {
          setIsModalLoteOpen(false);
          setPreselectedLoteProduct(null);
          setLoteToEdit(null); // <-- LIMPIAR MEMORIA
        }} 
        productos={products} 
        initialProduct={preselectedLoteProduct}
        initialLote={loteToEdit} // <-- PASAMOS EL LOTE A EDITAR
        onLoteSaved={(lote) => {
          setNuevoLoteRealtime(lote);
          setLoteToEdit(null);
          if (!loteToEdit) setSearchQuery(''); 

          // [ RETORNO TÉCNICO ]: Actualizamos Stock Y Costo al mismo tiempo para reflejar la inversión real
          if (!loteToEdit) {
            setProducts(prevProducts => prevProducts.map(p => 
              p.id === lote.product_id 
                ? { 
                    ...p, 
                    quantity: p.quantity + Number(lote.initial_quantity),
                    cost: Number(lote.cost_unit) // <-- ACTUALIZA EL COSTO UNITARIO CON EL DEL NUEVO LOTE
                  } 
                : p
            ));
          }
        }}
      />
    </div>
  );
};