import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, ShieldAlert, Loader2 } from 'lucide-react';
import type { Empleado } from '../types';
import { ModalUsuario } from './ModalUsuario';
import { supabase } from '../../../db/supabase'; // Asegúrate de la ruta correcta

export const TablaUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Empleado | null>(null);

  // Función para traer los usuarios desde la base de datos
  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('empleados')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleNuevoUsuario = () => {
    setUsuarioEditando(null);
    setModalAbierto(true);
  };

  const handleEditar = (usuario: Empleado) => {
    setUsuarioEditando(usuario);
    setModalAbierto(true);
  };

  // Cuando el modal se cierra, verificamos si hay que recargar la tabla
  const handleCerrarModal = (actualizarTabla: boolean = false) => {
    setModalAbierto(false);
    if (actualizarTabla) {
      cargarUsuarios();
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] shadow-sm flex flex-col">
      {/* CABECERA */}
      <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
        <div>
          <h2 className="text-[#1E293B] font-bold uppercase text-sm flex items-center gap-2">
            <Users size={18} className="text-[#10B981]" />
            Cuentas de Empleados
          </h2>
          <p className="text-[#64748B] font-mono text-xs mt-1">
            Controla quién puede acceder al sistema y qué acciones pueden realizar.
          </p>
        </div>
        <button
          onClick={handleNuevoUsuario}
          className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Nuevo Usuario
        </button>
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto min-h-[200px]">
        {loading ? (
          <div className="flex justify-center items-center h-full p-8 text-[#64748B] font-mono gap-2">
            <Loader2 className="animate-spin" size={18} /> Cargando empleados...
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex justify-center items-center h-full p-8 text-[#64748B] font-mono">
            No hay empleados registrados todavía.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0] text-xs uppercase tracking-wider text-[#64748B] font-bold">
                <th className="p-4">Nombre / Email</th>
                <th className="p-4">Rol Asignado</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-sm text-[#1E293B]">{usuario.nombre}</div>
                    <div className="text-xs text-[#64748B] font-mono">{usuario.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="bg-[#E2E8F0] text-[#475569] text-[10px] px-2 py-1 font-bold uppercase tracking-wider rounded-sm flex w-fit items-center gap-1">
                      {usuario.rol === 'Administrador' && <ShieldAlert size={12} className="text-red-500" />}
                      {usuario.rol}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-[10px] px-2 py-1 font-bold uppercase tracking-wider rounded-sm ${
                      usuario.estado === 'ACTIVO' ? 'bg-[#D1FAE5] text-[#059669]' : 'bg-[#FEE2E2] text-[#DC2626]'
                    }`}>
                      {usuario.estado}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleEditar(usuario)}
                      className="p-2 text-[#64748B] hover:text-[#10B981] hover:bg-[#10B981]/10 transition-colors rounded"
                      title="Editar Usuario"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {modalAbierto && (
        <ModalUsuario 
          usuario={usuarioEditando} 
          onClose={handleCerrarModal} 
        />
      )}
    </div>
  );
};