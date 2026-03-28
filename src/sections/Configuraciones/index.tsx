// src/sections/Configuraciones/index.tsx
import React, { useState } from 'react';
import { Settings, Building2, Users } from 'lucide-react';
import { FormularioEmpresa } from './components/FormularioEmpresa';
import { TablaUsuarios } from './components/TablaUsuarios';

const Configuraciones: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'empresa' | 'usuarios'>('empresa');

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* HEADER */}
      <div className="bg-white border-b border-[#E2E8F0] p-6 shrink-0">
        <h1 className="text-2xl font-black text-[#1E293B] tracking-tight flex items-center gap-3 uppercase">
          <Settings className="text-[#10B981]" size={28} />
          Configuración del Sistema
        </h1>
        <p className="text-[#64748B] text-sm mt-1 font-mono">
          Gestiona los datos de tu empresa y los accesos de tus empleados.
        </p>
      </div>

      {/* TABS */}
      <div className="px-6 pt-4 border-b border-[#E2E8F0] bg-white shrink-0">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('empresa')}
            className={`pb-3 font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-colors relative ${
              activeTab === 'empresa'
                ? 'text-[#10B981]'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Building2 size={18} />
            Datos de la Empresa
            {activeTab === 'empresa' && (
              <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#10B981]"></div>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`pb-3 font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-colors relative ${
              activeTab === 'usuarios'
                ? 'text-[#10B981]'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Users size={18} />
            Gestión de Usuarios
            {activeTab === 'usuarios' && (
              <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#10B981]"></div>
            )}
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'empresa' ? (
          <FormularioEmpresa />
        ) : (
          <TablaUsuarios />
        )}
      </div>
    </div>
  );
};

export default Configuraciones;