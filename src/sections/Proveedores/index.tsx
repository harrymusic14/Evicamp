import React, { useState, useEffect, useMemo } from 'react';
import { Users, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../../db/supabase';
import type { Proveedor } from './types';

// Componentes
import { FiltrosProveedores } from './components/FiltrosProveedores';
import { TablaProveedores } from './components/TablaProveedores';
import { ModalProveedor } from './components/ModalProveedor';

export const Proveedores: React.FC = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Estados del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proveedorAEditar, setProveedorAEditar] = useState<Proveedor | null>(null);

  const fetchProveedores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProveedores(data || []);
    } catch (error) {
      console.error("Error cargando proveedores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  // Lógica de Guardado (Crear o Editar)
  const handleSaveProveedor = async (provData: Partial<Proveedor>) => {
    try {
      if (provData.id) {
        // ACTUALIZAR
        const { error } = await supabase
          .from('providers')
          .update({
            ruc: provData.ruc,
            razon_social: provData.razon_social,
            nombre_comercial: provData.nombre_comercial,
            telefono: provData.telefono,
            email: provData.email,
            direccion: provData.direccion,
            estado: provData.estado
          })
          .eq('id', provData.id);

        if (error) throw error;
        alert('Proveedor actualizado correctamente.');
      } else {
        // CREAR NUEVO
        const { error } = await supabase
          .from('providers')
          .insert([{
            ruc: provData.ruc,
            razon_social: provData.razon_social,
            nombre_comercial: provData.nombre_comercial,
            telefono: provData.telefono,
            email: provData.email,
            direccion: provData.direccion,
            estado: provData.estado
          }]);

        if (error) throw error;
        alert('Proveedor registrado exitosamente.');
      }
      
      setIsModalOpen(false);
      setProveedorAEditar(null);
      fetchProveedores(); // Recargar la tabla
    } catch (error: any) {
      alert('Error al guardar proveedor: ' + error.message);
    }
  };

  // Motor de Búsqueda y Filtros
  const filteredProveedores = useMemo(() => {
    let result = [...proveedores];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.ruc.toLowerCase().includes(q) || 
        p.razon_social.toLowerCase().includes(q) ||
        (p.nombre_comercial && p.nombre_comercial.toLowerCase().includes(q))
      );
    }

    if (filtroEstado) {
      result = result.filter(p => p.estado === filtroEstado);
    }

    return result;
  }, [proveedores, searchQuery, filtroEstado]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10 text-[#1E293B] font-mono min-h-full bg-white relative z-0">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 bg-white border-b-2 border-[#1E293B] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#EFF6FF] border-2 border-[#3B82F6] flex items-center justify-center shadow-[4px_4px_0_0_#3B82F6] rounded-none">
            <Users size={24} className="text-[#3B82F6]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1E293B] uppercase tracking-widest">
              Directorio de Proveedores
            </h1>
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-[0.2em] mt-1">
              Gestión de contactos y empresas aliadas
            </p>
          </div>
        </div>

        <button 
          onClick={() => {
            setProveedorAEditar(null);
            setIsModalOpen(true);
          }}
          className="bg-[#3B82F6] text-white px-6 py-3 border-2 border-[#1E293B] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#1E293B] hover:text-[#3B82F6] transition-all cursor-pointer rounded-none shadow-[4px_4px_0_0_#1E293B] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
        >
          <Plus size={16} /> Nuevo Proveedor
        </button>
      </div>

      <FiltrosProveedores 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
        matchCount={filteredProveedores.length}
      />

      <div className="px-8 flex-1 flex flex-col min-h-[50vh] relative pb-8">
        {loading ? (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center border-2 border-[#E2E8F0]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={24} className="text-[#3B82F6] animate-spin" />
              <span className="text-[10px] font-black text-[#1E293B] uppercase tracking-[0.2em]">Cargando Directorio...</span>
            </div>
          </div>
        ) : (
          <TablaProveedores 
            proveedores={filteredProveedores} 
            onEdit={(prov) => {
              setProveedorAEditar(prov);
              setIsModalOpen(true);
            }}
            onDelete={async (prov) => {
              if (window.confirm(`⚠️ ALERTA: ¿Estás seguro de eliminar al proveedor "${prov.razon_social}"? Esta acción no se puede deshacer.`)) {
                try {
                  const { error } = await supabase.from('providers').delete().eq('id', prov.id);
                  if (error) throw error;
                  fetchProveedores();
                } catch (e: any) {
                  alert("Error al eliminar: " + e.message);
                }
              }
            }}
          />
        )}
      </div>

      {/* MODAL REUTILIZABLE PARA CREAR/EDITAR */}
      <ModalProveedor 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProveedorAEditar(null);
        }}
        proveedoresExistentes={proveedores} // <-- INYECTAMOS EL DIRECTORIO
        proveedorAEditar={proveedorAEditar}
        onSave={handleSaveProveedor}
      />

    </div>
  );
};