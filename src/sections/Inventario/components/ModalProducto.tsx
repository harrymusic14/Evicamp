import React, { useState, useEffect, useRef } from 'react';
import { X, Package, Scale, Coffee, ArrowLeft, Save, ImagePlus, Search, Loader2, Database } from 'lucide-react';
import { supabase } from '../../../db/supabase'; // RETORNO TÉCNICO: Conexión a la DB

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGoToLotes?: (producto: any) => void;
  onProductSaved?: (newProduct: any) => void;
  initialData?: any; 
  productosExistentes?: any[];
}

// Los 3 tipos de comportamiento en el sistema
type ProductNature = 'UNIDAD' | 'PESO' | 'CONSUMO' | null;

export const ModalProducto: React.FC<Props> = ({ isOpen, onClose, onGoToLotes, onProductSaved, initialData, productosExistentes = [] }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [nature, setNature] = useState<ProductNature>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ESTADOS PARA EL AUTOCOMPLETADO DE CATEGORÍAS
  const [categoriasLista, setCategoriasLista] = useState<string[]>([]);
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  // 🔥 NUEVO: Cargar tu tabla categories directamente desde Supabase
  useEffect(() => {
    const fetchCategorias = async () => {
      const { data } = await supabase.from('categories').select('name');
      if (data) {
        const dbCats = data.map((c: any) => c.name?.trim().toUpperCase()).filter(Boolean);
        setCategoriasLista(Array.from(new Set(dbCats)).sort());
      }
    };
    if (isOpen) fetchCategorias();
  }, [isOpen]);
  // ESTADOS PARA BÚSQUEDA DE IMÁGENES
  const [imageQuery, setImageQuery] = useState('');
  const [isSearchingImage, setIsSearchingImage] = useState(false);
  const [imageResults, setImageResults] = useState<string[]>([]);
  const [showImageResults, setShowImageResults] = useState(false); // <-- Controla si la galería está abierta o cerrada

  // 1. LIMPIEZA DE MEMORIA AL ABRIR EL MODAL
  // 1. CONTROL DE MEMORIA AL ABRIR (MODO CREACIÓN vs MODO EDICIÓN)
  useEffect(() => {
    if (isOpen) {
      setImageQuery('');
      setImageResults([]);
      setShowImageResults(false);

      if (initialData) {
        // MODO EDICIÓN: Cargamos datos y saltamos al Paso 2
        setFormData({
          name: initialData.name || '',
          category: initialData.category || '',
          code: initialData.code || '',
          barcode: initialData.barcode || '',
          price: initialData.price?.toString() || '',
          minStock: initialData.minStock?.toString() || '5',
          weightUnit: ['KG', 'GR', 'LT', 'ML'].includes(initialData.unit) ? initialData.unit : 'KG',
          image: initialData.image || ''
        });
        
        if (initialData.unit === 'UND') setNature('UNIDAD');
        else if (['KG', 'GR', 'LT', 'ML'].includes(initialData.unit)) setNature('PESO');
        else setNature('CONSUMO');
        
        setStep(2);
      } else {
        // MODO CREACIÓN: Limpiamos todo
        setStep(1);
        setNature(null);
        setFormData({ name: '', category: '', code: '', barcode: '', price: '', minStock: '5', weightUnit: 'KG', image: '' });
      }
    }
  }, [isOpen, initialData]);

  // CONTROLADOR PARA CANCELAR PETICIONES OBSOLETAS
  const abortControllerRef = useRef<AbortController | null>(null);

  // 2. OPTIMIZACIÓN: DEBOUNCE REDUCIDO A 300ms
  useEffect(() => {
    if (!imageQuery || imageQuery.length < 2 || imageQuery.startsWith('http')) {
      setImageResults([]);
      setShowImageResults(false);
      return;
    }

    const timer = setTimeout(() => {
      ejecutarBusquedaAPI(imageQuery);
    }, 300); // Reducido para mayor sensación de velocidad

    return () => clearTimeout(timer);
  }, [imageQuery]);

  // 3. MOTOR DE BÚSQUEDA HÍBRIDO (RENDERIZADO PROGRESIVO ULTRA-RÁPIDO)
  const ejecutarBusquedaAPI = async (query: string) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsSearchingImage(true);
    setShowImageResults(true);
    setImageResults([]); // Limpiamos la pantalla al instante para la nueva búsqueda

    try {
      const q = encodeURIComponent(query.trim());
      
      // Función inyectora: Coloca las fotos en pantalla APENAS llegan, sin esperar al otro
      const inyectarResultados = (nuevasFotos: string[]) => {
        if (abortController.signal.aborted || nuevasFotos.length === 0) return;
        
        setImageResults(prevFotos => {
          // Unimos las fotos anteriores con las nuevas, borramos duplicados y cortamos en 4
          const combinadas = Array.from(new Set([...prevFotos, ...nuevasFotos])).slice(0, 4);
          return combinadas;
        });
        
        // Si ya nos llegó al menos 1 resultado, matamos la animación de carga dando sensación de inmediatez
        setIsSearchingImage(false); 
      };

      // MOTOR 1: OpenFoodFacts -> Promesa suelta (No la esperamos con await)
      const fetchFood = fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${q}&search_simple=1&action=process&json=1&page_size=4&fields=image_front_small_url,image_url`, { 
        signal: abortController.signal 
      })
      .then(res => res.json())
      .then(data => data.products?.map((p: any) => p.image_front_small_url || p.image_url).filter(Boolean) || [])
      .then(inyectarResultados)
      .catch(() => {}); // Ignoramos errores silenciosamente para no romper el otro motor

      // MOTOR 2: Wikipedia API -> Promesa suelta
      const fetchWiki = fetch(`https://es.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&prop=pageimages&pithumbsize=400&format=json&origin=*`, { 
        signal: abortController.signal 
      })
      .then(res => res.json())
      .then(data => {
        if (!data.query || !data.query.pages) return [];
        return Object.values(data.query.pages).map((p: any) => p.thumbnail?.source).filter(Boolean);
      })
      .then(inyectarResultados)
      .catch(() => {});

      // El código maestro solo espera en el fondo a que ambos terminen su trabajo para apagar el loader
      // en caso de que NINGUNO haya encontrado absolutamente nada.
      await Promise.all([fetchFood, fetchWiki]);

    } catch (e: any) {
      if (e.name === 'AbortError') return;
    } finally {
      if (!abortController.signal.aborted) {
        setIsSearchingImage(false);
      }
    }
  };

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    code: '',
    barcode: '',
    price: '',
    minStock: '5',
    weightUnit: 'KG', // Solo importa si nature === 'PESO'
    image: '' // <-- NUEVO ESTADO PARA LA IMAGEN
  });

  if (!isOpen) return null;

  const resetAndClose = () => {
    setStep(1);
    setNature(null);
    setFormData({ name: '', category: '', code: '', barcode: '', price: '', minStock: '5', weightUnit: 'KG', image: '' });
    setImageQuery('');
    setImageResults([]);
    setShowImageResults(false);
    onClose();
  };

  const handleNatureSelect = (selectedNature: ProductNature) => {
    setNature(selectedNature);
    setStep(2);
  };

  const handleSave = async (goToLotes: boolean) => {
    if (!formData.name || isSubmitting) return;
    
    const nombreLimpio = formData.name.trim().toUpperCase();
    const codigoBarrasLimpio = formData.barcode?.trim() || '';

    // === VALIDACIÓN DE INTEGRIDAD ===
    const isDuplicate = productosExistentes.some((p: any) => {
      if (initialData && p.id === initialData.id) return false;
      const mismoNombre = p.name.toUpperCase() === nombreLimpio;
      const mismoCodigoBarras = codigoBarrasLimpio !== '' && p.barcode === codigoBarrasLimpio;
      return mismoNombre || mismoCodigoBarras;
    });

    // 🔥 SALIMOS ANTES DE BLOQUEAR LA PANTALLA SI HAY ERROR
    if (isDuplicate) {
       alert('⚠️ ERROR DE INTEGRIDAD: Ya existe un producto con ese Nombre o Código de Barras.');
       return; 
    }

    setIsSubmitting(true); // 🔥 AHORA SÍ, ACTIVAMOS EL "PROCESANDO..." DE FORMA SEGURA

    try {
      const unidadAsignada = nature === 'PESO' ? formData.weightUnit : (nature === 'CONSUMO' ? 'CONSUMO' : 'UND');
      let productoGuardado;

      if (initialData) {
        // [ RETORNO ]: MODO EDICIÓN
        const { data, error } = await supabase.from('products').update({
          name: nombreLimpio,
          category: formData.category || 'GENERAL',
          code: formData.code,
          barcode: formData.barcode,
          price: Number(formData.price) || 0,
          min_stock: Number(formData.minStock) || 5,
          control_type: nature === 'PESO' ? 'WEIGHT' : 'UND',
          weight_unit: nature === 'PESO' ? formData.weightUnit : null,
          unit: unidadAsignada,
          image_url: formData.image
        }).eq('id', initialData.id).select().single();

        if (error) throw error;
        productoGuardado = data;
        
        // [ SALIDA ]: Notificamos al inventario el éxito de la edición
        if (onProductSaved) {
          onProductSaved(productoGuardado);
        }
        
        alert(`PRODUCTO ACTUALIZADO CORRECTAMENTE.\nNombre: ${nombreLimpio}`);
      } else {
        // [ SALIDA ]: MODO CREACIÓN
        // RETORNO TÉCNICO: Autogenerador de código SKU de 6 dígitos si el campo está vacío
        const codigoGenerado = formData.code?.trim() || `SKU-${Math.floor(100000 + Math.random() * 900000)}`;

        const { data, error } = await supabase.from('products').insert([{
          name: nombreLimpio,
          category: formData.category || 'GENERAL',
          code: codigoGenerado,
          barcode: formData.barcode,
          price: Number(formData.price) || 0,
          quantity: 0,
          min_stock: Number(formData.minStock) || 5,
          control_type: nature === 'PESO' ? 'WEIGHT' : 'UND',
          weight_unit: nature === 'PESO' ? formData.weightUnit : null,
          unit: unidadAsignada,
          image_url: formData.image, // Agregado para que guarde la imagen en creación
          is_synced: '1'
        }]).select().single();

        if (error) throw error;
        productoGuardado = data;
        alert(`PRODUCTO CREADO CORRECTAMENTE.\nNombre: ${nombreLimpio}`);
      }

      // Sincronizamos con la pantalla
      if (onProductSaved) {
        onProductSaved({
          ...productoGuardado, 
          imageUrl: productoGuardado.image_url, 
          minStock: productoGuardado.min_stock,
          unit: unidadAsignada
        });
      }

      resetAndClose();

      // Pasamos el producto real al Lote
      if (goToLotes && onGoToLotes) {
        onGoToLotes({ ...productoGuardado, imageUrl: productoGuardado.image_url, unit: unidadAsignada });
      }

    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1E293B]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono">
      <div className={`bg-white w-full border-2 border-[#1E293B] shadow-[8px_8px_0_0_#1E293B] flex flex-col max-h-[75vh] mt-10 transition-all duration-300 ${step === 1 ? 'max-w-3xl' : 'max-w-2xl'}`}>
        
        {/* HEADER */}
        <div className="bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button 
                onClick={() => setStep(1)} 
                className="hover:text-[#10B981] transition-colors mr-2 cursor-pointer"
                title="Volver a seleccionar tipo"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#10B981]">
                {step === 1 ? 'Paso 1: Naturaleza del Producto' : 'Paso 2: Detalles del Producto'}
              </h2>
              <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest">
                {step === 1 ? 'Selecciona cómo se controlará el stock' : `Configurando producto por ${nature}`}
              </p>
            </div>
          </div>
          <button onClick={resetAndClose} className="hover:text-[#EF4444] transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* CUERPO DEL MODAL */}
        <div className="p-8 overflow-y-auto custom-scrollbar bg-[#F8FAFC] flex-1">
          
          {/* VISTA 1: SELECCIÓN DE NATURALEZA */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Opción: UNIDAD */}
              <button 
                onClick={() => handleNatureSelect('UNIDAD')}
                className="bg-white border-2 border-[#E2E8F0] p-6 flex flex-col items-center text-center gap-4 hover:border-[#10B981] hover:shadow-[4px_4px_0_0_#10B981] hover:-translate-y-1 transition-all cursor-pointer group rounded-none"
              >
                <div className="w-16 h-16 bg-[#F8FAFC] rounded-none flex items-center justify-center group-hover:bg-[#ECFDF5] transition-colors border-2 border-[#E2E8F0] group-hover:border-[#10B981]">
                  <Package size={32} className="text-[#64748B] group-hover:text-[#10B981] transition-colors" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#1E293B] uppercase tracking-widest mb-2">Por Unidad</h3>
                  <p className="text-[9px] font-bold text-[#64748B] uppercase">Productos que se cuentan por piezas enteras (botellas, cajas, latas).</p>
                </div>
              </button>

              {/* Opción: PESO */}
              <button 
                onClick={() => handleNatureSelect('PESO')}
                className="bg-white border-2 border-[#E2E8F0] p-6 flex flex-col items-center text-center gap-4 hover:border-[#3B82F6] hover:shadow-[4px_4px_0_0_#3B82F6] hover:-translate-y-1 transition-all cursor-pointer group rounded-none"
              >
                <div className="w-16 h-16 bg-[#F8FAFC] rounded-none flex items-center justify-center group-hover:bg-[#EFF6FF] transition-colors border-2 border-[#E2E8F0] group-hover:border-[#3B82F6]">
                  <Scale size={32} className="text-[#64748B] group-hover:text-[#3B82F6] transition-colors" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#1E293B] uppercase tracking-widest mb-2">Por Peso / Granel</h3>
                  <p className="text-[9px] font-bold text-[#64748B] uppercase">Productos que requieren balanza o medida fraccionada (KG, GR, Litros).</p>
                </div>
              </button>

              {/* Opción: CONSUMO */}
              <button 
                onClick={() => handleNatureSelect('CONSUMO')}
                className="bg-white border-2 border-[#E2E8F0] p-6 flex flex-col items-center text-center gap-4 hover:border-[#F59E0B] hover:shadow-[4px_4px_0_0_#F59E0B] hover:-translate-y-1 transition-all cursor-pointer group rounded-none"
              >
                <div className="w-16 h-16 bg-[#F8FAFC] rounded-none flex items-center justify-center group-hover:bg-[#FFFBEB] transition-colors border-2 border-[#E2E8F0] group-hover:border-[#F59E0B]">
                  <Coffee size={32} className="text-[#64748B] group-hover:text-[#F59E0B] transition-colors" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#1E293B] uppercase tracking-widest mb-2">Uso Interno / Servicio</h3>
                  <p className="text-[9px] font-bold text-[#64748B] uppercase">Insumos de consumo propio o servicios que no requieren stock estricto.</p>
                </div>
              </button>

            </div>
          )}

          {/* VISTA 2: FORMULARIO DINÁMICO */}
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">Nombre / Descripción del Producto</label>
                <input 
                  type="text"
                  placeholder="Ej: COCA COLA 3 LITROS RETORNABLE..."
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white border-2 border-[#E2E8F0] p-3 text-xs font-black text-[#1E293B] uppercase outline-none focus:border-[#10B981] transition-colors"
                />
              </div>

              <div className="space-y-2 relative">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">Categoría</label>
                  
                  {/* CONTROLES SUPERIORES: AGREGAR Y CERRAR */}
                  {showCatDropdown && (
                    <div className="flex items-center gap-4">
                      {formData.category && !categoriasLista.includes(formData.category) && (
                        <button 
                          onMouseDown={async (e) => {
                            e.preventDefault();
                            const nuevaCat = formData.category.trim().toUpperCase();
                            setCategoriasLista([...categoriasLista, nuevaCat].sort());
                            setShowCatDropdown(false);
                            // 🔥 NUEVO: Guarda en la DB cuando haces clic en Agregar
                            await supabase.from('categories').insert([{ id: Date.now(), name: nuevaCat, is_synced: 1 }]);
                          }}
                          className="text-[10px] font-black text-[#10B981] uppercase hover:underline cursor-pointer flex items-center gap-1"
                        >
                          + AGREGAR "{formData.category}"
                        </button>
                      )}
                      <button onClick={() => setShowCatDropdown(false)} className="text-[9px] font-bold text-[#EF4444] uppercase hover:underline cursor-pointer">
                        Cerrar Lista
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="BUSCAR O ESCRIBIR NUEVA..."
                    value={formData.category}
                    onChange={(e) => {
                      setFormData({...formData, category: e.target.value.toUpperCase()});
                      setShowCatDropdown(true);
                    }}
                    onFocus={() => setShowCatDropdown(true)}
                    onBlur={() => setShowCatDropdown(false)} // <-- CIERRE AUTOMÁTICO AL SALIR
                    className="w-full bg-white border-2 border-[#E2E8F0] p-3 text-xs font-black text-[#1E293B] uppercase outline-none focus:border-[#10B981] transition-colors"
                  />
                  
                  {/* DROPDOWN INTELIGENTE DE CATEGORÍAS */}
                  {showCatDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-[#1E293B] shadow-[4px_4px_0_0_#1E293B] z-50 max-h-48 overflow-y-auto custom-scrollbar">
                      {categoriasLista.filter(c => c.includes(formData.category)).length > 0 ? (
                        categoriasLista.filter(c => c.includes(formData.category)).map(cat => (
                          <div 
                            key={cat} 
                            onMouseDown={(e) => { 
                              e.preventDefault();
                              setFormData({...formData, category: cat}); 
                              setShowCatDropdown(false); 
                            }}
                            className="flex items-center justify-between p-3 hover:bg-[#F8FAFC] border-b border-[#E2E8F0] last:border-0 cursor-pointer group"
                          >
                            <span className="flex-1 text-xs font-black text-[#1E293B]">
                              {cat}
                            </span>
                            <button 
                              onMouseDown={async (e) => { 
                                e.preventDefault();
                                e.stopPropagation(); 
                                if (window.confirm(`¿Estás seguro de que deseas eliminar la categoría "${cat}" DEFINITIVAMENTE de tu base de datos?`)) {
                                  setCategoriasLista(categoriasLista.filter(c => c !== cat)); 
                                  // 🔥 NUEVO: Elimina de la DB cuando haces clic en la X
                                  await supabase.from('categories').delete().eq('name', cat);
                                }
                              }}
                              className="text-[#94A3B8] hover:text-[#EF4444] transition-colors cursor-pointer"
                              title="Eliminar Categoría"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 flex flex-col items-center justify-center gap-2 bg-[#F8FAFC] text-center">
                          <span className="text-[10px] font-bold text-[#64748B] uppercase">Categoría no encontrada.</span>
                          <span className="text-[9px] font-bold text-[#1E293B] uppercase">Usa el botón "+ Agregar" arriba para crearla.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">Escáner (Cód. Barras)</label>
                <input 
                  type="text"
                  placeholder="ESCANEAR..."
                  value={formData.barcode}
                  onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                  className="w-full bg-white border-2 border-[#E2E8F0] p-3 text-xs font-black text-[#1E293B] uppercase outline-none focus:border-[#10B981] transition-colors"
                />
              </div>

              {/* === SECCIÓN DE BÚSQUEDA DE IMAGEN === */}
              <div className="md:col-span-2 space-y-2 relative">
                <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">
                  Buscar Imagen en Internet o Pegar URL
                </label>
                <div className="flex flex-col sm:flex-row gap-3 relative">
                  <div className="flex-1 flex border-2 border-[#E2E8F0] bg-white focus-within:border-[#10B981] transition-colors relative">
                    <div className="w-12 flex items-center justify-center bg-[#F8FAFC] border-r-2 border-[#E2E8F0] shrink-0">
                      {isSearchingImage ? (
                        <Loader2 size={16} className="text-[#10B981] animate-spin" />
                      ) : (
                        <Search size={16} className="text-[#64748B]" />
                      )}
                    </div>
                    <input 
                      type="text"
                      placeholder="EJ: PERA, COCA COLA, TALADRO O PEGAR URL..."
                      value={imageQuery || formData.image}
                      onFocus={() => {
                        if (imageResults.length > 0) setShowImageResults(true);
                      }}
                      onBlur={() => setTimeout(() => setShowImageResults(false), 200)} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith('http')) {
                          setFormData({...formData, image: val});
                          setImageQuery('');
                          setImageResults([]);
                          setShowImageResults(false);
                        } else {
                          setImageQuery(val);
                          setFormData({...formData, image: ''});
                        }
                      }}
                      className="w-full p-3 text-xs font-black text-[#1E293B] outline-none rounded-none bg-white border-0 focus:ring-0"
                    />
                  </div>
                  
                  <label className="bg-[#1E293B] text-white px-6 py-3 border-2 border-[#1E293B] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white hover:text-[#1E293B] transition-all cursor-pointer rounded-none shadow-[4px_4px_0_0_#1E293B] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] shrink-0">
                    <ImagePlus size={16} /> Subir Local
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        if(e.target.files && e.target.files[0]) {
                          // Lector de archivos local (Convierte la foto a Base64 para mostrarla al instante)
                          const file = e.target.files[0];
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({...formData, image: reader.result as string});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  {/* GALERÍA DE RESULTADOS (DISEÑO FLOTANTE QUE NO ESTORBA) */}
                  {showImageResults && imageResults.length > 0 && !formData.image && (
                    <div className="absolute top-full left-0 w-full sm:w-[calc(100%-140px)] mt-1 p-2 border-2 border-[#1E293B] bg-[#F8FAFC] shadow-[4px_4px_0_0_#1E293B] z-50">
                      <div className="grid grid-cols-4 gap-2">
                        {imageResults.map((imgUrl, idx) => (
                          <div 
                            key={idx} 
                            onMouseDown={(e) => {
                              // onMouseDown evita que el onBlur del input se dispare antes
                              e.preventDefault();
                              setFormData({...formData, image: imgUrl});
                              setImageResults([]);
                              setImageQuery('');
                              setShowImageResults(false);
                            }}
                            className="aspect-square border-2 border-[#E2E8F0] bg-white hover:border-[#10B981] cursor-pointer overflow-hidden transition-all hover:scale-105 flex items-center justify-center"
                          >
                            <img 
                              src={imgUrl} 
                              alt="Resultado" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Si la imagen original se rompe, ponemos una de respaldo limpia sin letras raras
                                (e.target as HTMLImageElement).src = `https://placehold.co/200x200/F8FAFC/94A3B8?text=NO+IMAGEN`;
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="text-center mt-2 text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">
                        Selecciona una imagen para aplicarla
                      </div>
                    </div>
                  )}
                </div>

                {/* VISTA PREVIA DE LA IMAGEN SELECCIONADA */}
                {formData.image && (
                  <div className="mt-2 flex items-center gap-4 p-2 border-2 border-[#E2E8F0] bg-[#F8FAFC]">
                    <div className="w-16 h-16 border border-[#E2E8F0] overflow-hidden bg-white shrink-0 flex items-center justify-center">
                      <img 
                        src={formData.image} 
                        alt="Vista previa" 
                        className="w-full h-full object-cover" 
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/200x200/F8FAFC/94A3B8?text=ERROR`; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-[#10B981] uppercase tracking-widest">Imagen Seleccionada</p>
                      <p className="text-[9px] text-[#64748B] truncate mt-1">{formData.image}</p>
                    </div>
                    <button 
                      onClick={() => setFormData({...formData, image: ''})}
                      className="text-[#EF4444] hover:bg-[#FEF2F2] p-2 transition-colors border-2 border-transparent hover:border-[#EF4444] cursor-pointer"
                      title="Quitar imagen"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">Precio de Venta Sugerido</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full bg-white border-2 border-[#E2E8F0] p-3 text-xs font-black text-[#1E293B] uppercase outline-none focus:border-[#10B981] transition-colors"
                />
              </div>

              {nature !== 'CONSUMO' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">Stock Mínimo (Alerta)</label>
                  <input 
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                    className="w-full bg-white border-2 border-[#E2E8F0] p-3 text-xs font-black text-[#1E293B] uppercase outline-none focus:border-[#10B981] transition-colors"
                  />
                </div>
              )}

              {/* CAMPOS CONDICIONALES BASADOS EN LA NATURALEZA */}
              {nature === 'PESO' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">Unidad de Medida</label>
                  <select 
                    value={formData.weightUnit}
                    onChange={(e) => setFormData({...formData, weightUnit: e.target.value})}
                    className="w-full bg-white border-2 border-[#E2E8F0] p-3 text-xs font-black text-[#1E293B] uppercase outline-none focus:border-[#10B981] transition-colors cursor-pointer"
                  >
                    <option value="KG">Kilogramos (KG)</option>
                    <option value="GR">Gramos (GR)</option>
                    <option value="LT">Litros (LT)</option>
                    <option value="ML">Mililitros (ML)</option>
                  </select>
                </div>
              )}

            </div>
          )}
        </div>

        {/* FOOTER - Solo visible en el paso 2 */}
        {step === 2 && (
          <div className="flex justify-end items-center gap-4 mt-5 w-full">
              <button 
                onClick={() => handleSave(false)}
                disabled={!formData.name || isSubmitting}
                className="relative -top-8 -left-8 bg-white text-[#1E293B] px-6 py-3 border-2 border-[#1E293B] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#F8FAFC] hover:border-[#10B981] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0_0_#1E293B] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] cursor-pointer rounded-none min-w-[140px]"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                <span>{isSubmitting ? 'Procesando...' : 'Guardar'}</span>
              </button>

              {nature !== 'CONSUMO' && !initialData && (
                <button 
                  onClick={() => handleSave(true)}
                  disabled={!formData.name || isSubmitting}
                  className="relative -top-8 -left-8 bg-[#10B981] text-[#1E293B] px-6 py-3 border-2 border-[#1E293B] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#1E293B] hover:text-[#10B981] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0_0_#10B981] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] cursor-pointer rounded-none min-w-[220px]"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
                  <span>{isSubmitting ? 'Procesando...' : 'Guardar e ir a Lotes'}</span>
                </button>
              )}
            </div>
        )}

      </div>
    </div>
  );
};