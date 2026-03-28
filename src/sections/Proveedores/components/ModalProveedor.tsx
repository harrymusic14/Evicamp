import React, { useState, useEffect } from 'react';
import { X, Save,  Building2 } from 'lucide-react';
import type { Proveedor } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (proveedor: Partial<Proveedor>) => void;
  proveedorAEditar?: Proveedor | null;
  proveedoresExistentes?: Proveedor[]; // <-- NUEVA PROP DE SEGURIDAD
}

export const ModalProveedor: React.FC<Props> = ({ isOpen, onClose, onSave, proveedorAEditar, proveedoresExistentes = [] }) => {
  const [formData, setFormData] = useState<Partial<Proveedor>>({
    ruc: '',
    razon_social: '',
    nombre_comercial: '',
    telefono: '',
    email: '',
    direccion: '',
    estado: 'ACTIVO'
  });

  // Efecto para cargar datos si estamos en MODO EDICIÓN
  useEffect(() => {
    if (isOpen) {
      if (proveedorAEditar) {
        setFormData(proveedorAEditar);
      } else {
        // MODO NUEVO
        setFormData({
          ruc: '',
          razon_social: '',
          nombre_comercial: '',
          telefono: '',
          email: '',
          direccion: '',
          estado: 'ACTIVO'
        });
      }
    }
  }, [isOpen, proveedorAEditar]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const rucLimpio = formData.ruc?.trim() || '';
    const razonLimpia = formData.razon_social?.trim().toUpperCase() || '';

    if (!rucLimpio || !razonLimpia) {
      alert('Por favor, ingresa al menos el RUC y la Razón Social.');
      return;
    }

    // === VALIDACIÓN DE INTEGRIDAD: EVITAR DUPLICADOS ===
    const isDuplicate = proveedoresExistentes.some(p => {
      // Si estamos editando y es el mismo ID, ignorar la colisión consigo mismo
      if (proveedorAEditar && p.id === proveedorAEditar.id) return false;

      const mismoRUC = rucLimpio !== '' && p.ruc === rucLimpio;
      const mismaRazon = p.razon_social.toUpperCase() === razonLimpia;

      return mismoRUC || mismaRazon;
    });

    if (isDuplicate) {
      alert('⚠️ Error de Integridad: Ya existe un proveedor registrado con este mismo RUC o Razón Social.');
      return; // Bloquea el guardado
    }

    onSave({
      ...formData,
      ruc: rucLimpio,
      razon_social: razonLimpia
    });
  };

  return (
    <div className="fixed inset-0 bg-[#1E293B]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono">
      <div className="bg-white w-full max-w-2xl border-2 border-[#1E293B] shadow-[8px_8px_0_0_#1E293B] flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Building2 size={20} className="text-[#3B82F6]" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#3B82F6]">
                {proveedorAEditar ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h2>
              <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest">
                Datos de la empresa o distribuidor
              </p>
            </div>
          </div>
          <button onClick={onClose} className="hover:text-[#EF4444] transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* FORMULARIO */}
        <div className="p-6 overflow-y-auto custom-scrollbar bg-[#F8FAFC] flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">RUC / DNI *</label>
              <input 
                type="text"
                maxLength={11}
                placeholder="Ej: 20123456789"
                value={formData.ruc}
                onChange={(e) => setFormData({...formData, ruc: e.target.value.replace(/\D/g, '')})}
                className="w-full bg-white border-2 border-[#E2E8F0] p-3 text-xs font-black text-[#1E293B] uppercase outline-none focus:border-[#3B82F6] transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">Estado</label>
              <select 
                value={formData.estado}
                onChange={(e) => setFormData({...formData, estado: e.target.value as 'ACTIVO' | 'INACTIVO'})}
                className="w-full bg-white border-2 border-[#E2E8F0] p-3 text-xs font-black text-[#1E293B] uppercase outline-none focus:border-[#3B82F6] transition-colors cursor-pointer"
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">Razón Social *</label>
              <input 
                type="text"
                placeholder="Ej: DISTRIBUIDORA DE ALIMENTOS S.A.C."
                value={formData.razon_social}
                onChange={(e) => setFormData({...formData, razon_social: e.target.value.toUpperCase()})}
                className="w-full bg-white border-2 border-[#E2E8F0] p-3 text-xs font-black text-[#1E293B] uppercase outline-none focus:border-[#3B82F6] transition-colors"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">Nombre Comercial (Opcional)</label>
              <input 
                type="text"
                placeholder="Ej: DISTRIBUCIONES PERÚ"
                value={formData.nombre_comercial}
                onChange={(e) => setFormData({...formData, nombre_comercial: e.target.value.toUpperCase()})}
                className="w-full bg-white border-2 border-[#E2E8F0] p-3 text-xs font-black text-[#1E293B] uppercase outline-none focus:border-[#3B82F6] transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">Teléfono / Celular</label>
              <input 
                type="text"
                placeholder="Ej: 987654321"
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                className="w-full bg-white border-2 border-[#E2E8F0] p-3 text-xs font-black text-[#1E293B] uppercase outline-none focus:border-[#3B82F6] transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">Correo Electrónico</label>
              <input 
                type="email"
                placeholder="contacto@empresa.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                className="w-full bg-white border-2 border-[#E2E8F0] p-3 text-xs font-black text-[#1E293B] outline-none focus:border-[#3B82F6] transition-colors"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest">Dirección de la empresa</label>
              <input 
                type="text"
                placeholder="Av. Principal 123, Distrito..."
                value={formData.direccion}
                onChange={(e) => setFormData({...formData, direccion: e.target.value.toUpperCase()})}
                className="w-full bg-white border-2 border-[#E2E8F0] p-3 text-xs font-black text-[#1E293B] uppercase outline-none focus:border-[#3B82F6] transition-colors"
              />
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="w-full p-6 bg-white border-t-2 border-[#E2E8F0] flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-3 border-2 border-[#E2E8F0] text-[#64748B] font-black text-[10px] uppercase tracking-widest hover:bg-[#F8FAFC] hover:border-[#1E293B] hover:text-[#1E293B] transition-all cursor-pointer rounded-none"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            className="bg-[#3B82F6] text-white px-6 py-3 border-2 border-[#1E293B] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#1E293B] hover:text-[#3B82F6] transition-all cursor-pointer rounded-none shadow-[4px_4px_0_0_#1E293B] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
          >
            <Save size={16} /> Guardar Proveedor
          </button>
        </div>

      </div>
    </div>
  );
};