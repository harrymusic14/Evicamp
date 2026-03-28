import React, { useState, useEffect } from 'react';
import { X, Save, Shield, User, Lock, CheckSquare, Loader2 } from 'lucide-react';
import type { Empleado, PermisosUsuario } from '../types';
import { supabase } from '../../../db/supabase';

interface ModalUsuarioProps {
  usuario: Empleado | null;
  onClose: (actualizado?: boolean) => void;
}

const PERMISOS_DEFAULT: PermisosUsuario = {
  caja_realizar_ventas: false, caja_abrir_cerrar_turno: false, caja_ingresos_egresos: false, caja_ver_fiados: false, caja_cobrar_deudas: false,
  almacen_ver_stock: false, almacen_ingresar_lotes: false, almacen_crear_editar_productos: false, almacen_eliminar_productos: false, almacen_modificar_precios: false, almacen_gestionar_proveedores: false, almacen_registrar_mermas: false,
  reportes_ver_historial_ventas: false, reportes_anular_ventas: false, reportes_ver_globales: false,
  gerencia_ver_utilidades: false, gerencia_gestionar_usuarios: false, gerencia_configuracion_sistema: false,
  sistema_acceso_total: false,
};

export const ModalUsuario: React.FC<ModalUsuarioProps> = ({ usuario, onClose }) => {
  const isEditing = !!usuario;
  const [guardando, setGuardando] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '', 
    rol: 'Cajero',
    estado: 'ACTIVO',
  });

  const [permisos, setPermisos] = useState<PermisosUsuario>(PERMISOS_DEFAULT);

  useEffect(() => {
    if (usuario) {
      setFormData({
        nombre: usuario.nombre,
        email: usuario.email,
        password: '', // Lo dejamos vacío por seguridad, solo lo enviamos si escribe algo nuevo
        rol: usuario.rol,
        estado: usuario.estado,
      });
      // Asegurarnos de que los permisos existan, sino usamos por defecto
      setPermisos(usuario.permisos || PERMISOS_DEFAULT);
    }
  }, [usuario]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePermiso = (key: keyof PermisosUsuario) => {
    if (key === 'sistema_acceso_total') {
      const nuevoEstado = !permisos.sistema_acceso_total;
      const todosPermisos = Object.keys(permisos).reduce((acc, currKey) => {
        acc[currKey as keyof PermisosUsuario] = nuevoEstado;
        return acc;
      }, {} as PermisosUsuario);
      setPermisos(todosPermisos);
      return;
    }
    setPermisos({ ...permisos, [key]: !permisos[key] });
  };

  // FUNCION PARA GUARDAR EN BASE DE DATOS
  const handleGuardar = async () => {
    if (!formData.nombre || !formData.email || (!isEditing && !formData.password)) {
      alert('⚠️ Por favor completa Nombre, Email y Contraseña.');
      return;
    }

    setGuardando(true);
    try {
      // Preparamos los datos
      const datosGuardar = {
        nombre: formData.nombre,
        email: formData.email,
        rol: formData.rol,
        estado: formData.estado,
        permisos: permisos,
        ...(formData.password ? { password: formData.password } : {}) // Solo actualizamos password si se escribió una
      };

      if (isEditing && usuario?.id) {
        // Actualizar
        const { error } = await supabase
          .from('empleados')
          .update(datosGuardar)
          .eq('id', usuario.id);
        
        if (error) throw error;
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from('empleados')
          .insert([datosGuardar]);
          
        if (error) throw error;
      }

      onClose(true); // Cerrar modal y avisar que SÍ hubo cambios
    } catch (error: any) {
      console.error('Error al guardar:', error);
      alert('❌ Error al guardar usuario: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const CheckboxItem = ({ label, labelKey }: { label: string, labelKey: keyof PermisosUsuario }) => {
    const isChecked = permisos[labelKey];
    return (
      <label className="flex items-center gap-2 cursor-pointer group mb-2">
        <div className={`flex items-center justify-center w-4 h-4 rounded-sm border ${isChecked ? 'bg-[#10B981] border-[#10B981]' : 'border-[#CBD5E1] group-hover:border-[#10B981]'} transition-colors`}>
          {isChecked && <CheckSquare size={14} className="text-white absolute" />}
        </div>
        <span className={`text-xs font-mono ${isChecked ? 'text-[#1E293B] font-bold' : 'text-[#64748B]'}`}>
          {label}
        </span>
      </label>
    );
  };

  return (
    <div className="fixed inset-0 bg-[#1E293B]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-[#1E293B] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[8px_8px_0_0_#1E293B]">
        
        {/* HEADER */}
        <div className="bg-[#1E293B] p-4 flex justify-between items-center shrink-0">
          <h2 className="text-white font-black tracking-widest uppercase text-sm flex items-center gap-2">
            <Shield size={18} className="text-[#10B981]" />
            {isEditing ? `Editando Usuario: ${formData.nombre}` : 'Nueva Cuenta de Empleado'}
          </h2>
          <button onClick={() => onClose(false)} disabled={guardando} className="text-[#94A3B8] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* IZQUIERDA: DATOS */}
          <div className="w-full md:w-1/3 border-r border-[#E2E8F0] p-6 bg-[#F8FAFC] overflow-y-auto shrink-0">
            <h3 className="text-[#1E293B] font-bold uppercase text-xs mb-4 border-b border-[#E2E8F0] pb-2 flex items-center gap-2">
              <User size={14} /> Datos de Acceso
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Nombre Completo</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleTextChange} placeholder="Ej. Juan Pérez" className="w-full border border-[#E2E8F0] p-2 text-sm focus:border-[#10B981] outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Correo Electrónico</label>
                <input type="email" name="email" value={formData.email} onChange={handleTextChange} placeholder="usuario@evicamp.com" className="w-full border border-[#E2E8F0] p-2 text-sm focus:border-[#10B981] outline-none font-mono" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Lock size={10} /> {isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña Temporal'}
                </label>
                <input type="password" name="password" value={formData.password} onChange={handleTextChange} placeholder="******" className="w-full border border-[#E2E8F0] p-2 text-sm focus:border-[#10B981] outline-none font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Rol</label>
                  <select name="rol" value={formData.rol} onChange={handleTextChange} className="w-full border border-[#E2E8F0] p-2 text-sm focus:border-[#10B981] outline-none bg-white font-bold">
                    <option value="Administrador">Administrador</option>
                    <option value="Cajero">Cajero</option>
                    <option value="Almacenero">Almacenero</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Estado</label>
                  <select name="estado" value={formData.estado} onChange={handleTextChange} className={`w-full border border-[#E2E8F0] p-2 text-sm outline-none font-bold ${formData.estado === 'ACTIVO' ? 'text-[#059669]' : 'text-red-500'}`}>
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* DERECHA: PERMISOS */}
          <div className="w-full md:w-2/3 p-6 overflow-y-auto bg-white">
            <div className="flex justify-between items-center mb-4 border-b border-[#E2E8F0] pb-2">
              <h3 className="text-[#1E293B] font-bold uppercase text-xs">Asignación de Permisos</h3>
              <button onClick={() => togglePermiso('sistema_acceso_total')} className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 border transition-colors ${permisos.sistema_acceso_total ? 'bg-[#1E293B] text-[#10B981] border-[#1E293B]' : 'bg-white text-[#64748B] border-[#CBD5E1] hover:border-[#10B981]'}`}>
                {permisos.sistema_acceso_total ? 'DESMARCAR TODO' : 'OTORGAR ACCESO TOTAL'}
              </button>
            </div>
            
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity ${permisos.sistema_acceso_total ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <div className="bg-[#F8FAFC] p-3 border border-[#E2E8F0]">
                <h4 className="text-[10px] font-black text-[#10B981] uppercase tracking-widest mb-3">Caja / POS</h4>
                <div className="space-y-1" onClick={() => togglePermiso('caja_realizar_ventas')}><CheckboxItem label="Realizar Ventas (POS)" labelKey="caja_realizar_ventas" /></div>
                <div className="space-y-1" onClick={() => togglePermiso('caja_abrir_cerrar_turno')}><CheckboxItem label="Abrir/Cerrar Turno" labelKey="caja_abrir_cerrar_turno" /></div>
                <div className="space-y-1" onClick={() => togglePermiso('caja_ingresos_egresos')}><CheckboxItem label="Ingresos/Egresos Manuales" labelKey="caja_ingresos_egresos" /></div>
                <div className="space-y-1" onClick={() => togglePermiso('caja_ver_fiados')}><CheckboxItem label="Ver Fiados" labelKey="caja_ver_fiados" /></div>
                <div className="space-y-1" onClick={() => togglePermiso('caja_cobrar_deudas')}><CheckboxItem label="Cobrar/Amortizar Deudas" labelKey="caja_cobrar_deudas" /></div>
              </div>
              <div className="bg-[#F8FAFC] p-3 border border-[#E2E8F0]">
                <h4 className="text-[10px] font-black text-[#10B981] uppercase tracking-widest mb-3">Almacén</h4>
                <div className="space-y-1" onClick={() => togglePermiso('almacen_ver_stock')}><CheckboxItem label="Ver Stock Productos" labelKey="almacen_ver_stock" /></div>
                <div className="space-y-1" onClick={() => togglePermiso('almacen_ingresar_lotes')}><CheckboxItem label="Ingresar Lotes (Compras)" labelKey="almacen_ingresar_lotes" /></div>
                <div className="space-y-1" onClick={() => togglePermiso('almacen_crear_editar_productos')}><CheckboxItem label="Crear/Editar Productos" labelKey="almacen_crear_editar_productos" /></div>
                <div className="space-y-1" onClick={() => togglePermiso('almacen_eliminar_productos')}><CheckboxItem label="Eliminar Productos" labelKey="almacen_eliminar_productos" /></div>
                <div className="space-y-1" onClick={() => togglePermiso('almacen_modificar_precios')}><CheckboxItem label="Modificar Precios" labelKey="almacen_modificar_precios" /></div>
                <div className="space-y-1" onClick={() => togglePermiso('almacen_gestionar_proveedores')}><CheckboxItem label="Gestionar Proveedores" labelKey="almacen_gestionar_proveedores" /></div>
                <div className="space-y-1" onClick={() => togglePermiso('almacen_registrar_mermas')}><CheckboxItem label="Registrar Mermas" labelKey="almacen_registrar_mermas" /></div>
              </div>
              <div className="bg-[#F8FAFC] p-3 border border-[#E2E8F0]">
                <h4 className="text-[10px] font-black text-[#10B981] uppercase tracking-widest mb-3">Reportes</h4>
                <div className="space-y-1" onClick={() => togglePermiso('reportes_ver_historial_ventas')}><CheckboxItem label="Ver Historial de Ventas" labelKey="reportes_ver_historial_ventas" /></div>
                <div className="space-y-1" onClick={() => togglePermiso('reportes_anular_ventas')}><CheckboxItem label="Anular Ventas (Extornos)" labelKey="reportes_anular_ventas" /></div>
                <div className="space-y-1" onClick={() => togglePermiso('reportes_ver_globales')}><CheckboxItem label="Ver Reportes Globales" labelKey="reportes_ver_globales" /></div>
              </div>
              <div className="bg-[#F8FAFC] p-3 border border-[#E2E8F0]">
                <h4 className="text-[10px] font-black text-[#10B981] uppercase tracking-widest mb-3">Gerencia</h4>
                <div className="space-y-1" onClick={() => togglePermiso('gerencia_ver_utilidades')}><CheckboxItem label="Ver Utilidades" labelKey="gerencia_ver_utilidades" /></div>
                <div className="space-y-1" onClick={() => togglePermiso('gerencia_gestionar_usuarios')}><CheckboxItem label="Gestionar Usuarios" labelKey="gerencia_gestionar_usuarios" /></div>
                <div className="space-y-1" onClick={() => togglePermiso('gerencia_configuracion_sistema')}><CheckboxItem label="Configuración Sistema" labelKey="gerencia_configuracion_sistema" /></div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-[#F8FAFC] p-4 border-t border-[#E2E8F0] flex justify-end gap-3 shrink-0">
          <button onClick={() => onClose(false)} disabled={guardando} className="px-6 py-2 border border-[#E2E8F0] text-[#64748B] font-bold text-xs uppercase tracking-wider hover:bg-white transition-colors">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={guardando} className={`${guardando ? 'bg-[#94A3B8]' : 'bg-[#1E293B] hover:bg-[#10B981] shadow-[3px_3px_0_0_#10B981] hover:shadow-[3px_3px_0_0_#1E293B] hover:-translate-y-0.5'} text-white px-6 py-2 font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2`}>
            {guardando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {guardando ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Usuario')}
          </button>
        </div>
      </div>
    </div>
  );
};