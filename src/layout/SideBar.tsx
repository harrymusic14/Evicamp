// src/layout/SideBar.tsx
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, 
  Truck, Trash2, Wallet, 
  FileText, Settings, BarChart3 
} from 'lucide-react';

// IMPORTAMOS EL LOGO Y SUPABASE
import logoEvicamp from '../assets/Logo.png';
import { supabase } from '../db/supabase';

interface SideBarProps {
  isOpen: boolean;
  currentView: string;
  onNavigate: (view: string) => void;
  permisos?: any; // <--- AÑADIMOS LOS PERMISOS
}

export const SideBar: React.FC<SideBarProps> = ({ isOpen, currentView, onNavigate, permisos }) => {
  const [empresaData, setEmpresaData] = useState({ nombre: 'EVICAMP', logo: logoEvicamp });

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const { data, error } = await supabase.from('empresa_config').select('nombre_empresa, logo_url').limit(1).single();
        if (data && !error) {
          setEmpresaData({
            nombre: data.nombre_empresa || 'EVICAMP',
            logo: data.logo_url || logoEvicamp
          });
        }
      } catch (error) {
        console.error("Error cargando logo en sidebar", error);
      }
    };
    fetchEmpresa();
  }, []);

  // Función para verificar si el empleado tiene acceso a un módulo
  const tieneAcceso = (modulo: string) => {
    // Si no se pasaron permisos (ej. es el Admin Maestro) o tiene acceso total, ve todo
    if (!permisos || permisos.sistema_acceso_total) return true;

    switch (modulo) {
      case 'resumen': return true; // El dashboard inicial siempre se ve
      case 'pos': return permisos.caja_realizar_ventas;
      case 'fiados': return permisos.caja_ver_fiados;
      case 'inventario': return permisos.almacen_ver_stock;
      case 'proveedores': return permisos.almacen_gestionar_proveedores;
      case 'mermas': return permisos.almacen_registrar_mermas;
      case 'finanzas': return (permisos.caja_abrir_cerrar_turno || permisos.caja_ingresos_egresos);
      case 'utilidades': return permisos.gerencia_ver_utilidades;
      case 'reportes': return (permisos.reportes_ver_historial_ventas || permisos.reportes_ver_globales);
      case 'configuracion': return permisos.gerencia_configuracion_sistema;
      default: return false;
    }
  };

  // Modulos divididos por Categorías Lógicas con sus Iconos asignados
  const menuGroupsRaw = [
    {
      category: 'Operaciones',
      items: [
        { id: 'resumen', name: 'Resumen', icon: LayoutDashboard },
        { id: 'pos', name: 'Punto de Venta', icon: ShoppingCart },
        { id: 'fiados', name: 'Fiados / Clientes', icon: Users },
      ]
    },
    {
      category: 'Logística',
      items: [
        { id: 'inventario', name: 'Inventario', icon: Package },
        { id: 'proveedores', name: 'Proveedores', icon: Truck },
        { id: 'mermas', name: 'Mermas', icon: Trash2 },
      ]
    },
    {
      category: 'Administración',
      items: [
        { id: 'finanzas', name: 'Finanzas', icon: Wallet },
        { id: 'utilidades', name: 'Utilidades', icon: BarChart3 },
        { id: 'reportes', name: 'Reportes', icon: FileText },
        { id: 'configuracion', name: 'Configuración', icon: Settings },
      ]
    }
  ];

  // Filtramos los items según los permisos. Si una categoría entera (ej. Administración) se queda sin items, se oculta.
  const menuGroups = menuGroupsRaw
    .map(group => ({
      ...group,
      items: group.items.filter(item => tieneAcceso(item.id))
    }))
    .filter(group => group.items.length > 0);

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-20'} border-r border-[#E2E8F0] bg-white flex flex-col h-full shrink-0 transition-[width] duration-150 ease-out font-mono relative z-20 overflow-hidden`}>
      
      {/* LÍNEA DE TENSIÓN LATERAL VERDE ESTÁTICA */}
      <div className="absolute top-0 left-0 w-1 h-full bg-[#10B981]"></div>

      {/* BRANDING HEADER CON LOGO */}
      <div className={`h-16 border-b border-[#E2E8F0] flex items-center ${isOpen ? 'justify-between px-4' : 'justify-center'} bg-[#1E293B] ml-1`}>
        {isOpen ? (
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Logo en bloque técnico */}
            <div className="w-8 h-8 bg-white border border-[#10B981] flex items-center justify-center p-0.5 shrink-0">
              <img src={empresaData.logo} alt="Logo Empresa" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-white font-black tracking-[0.2em] text-lg uppercase whitespace-nowrap">
              {empresaData.nombre}<span className="text-[#10B981]">.</span>
            </h1>
          </div>
        ) : (
          /* Logo centrado cuando la barra está colapsada */
          <div className="w-10 h-10 bg-white border border-[#10B981] flex items-center justify-center p-1 shrink-0">
            <img src={empresaData.logo} alt="Logo Empresa" className="w-full h-full object-contain" />
          </div>
        )}
        
        {isOpen && <div className="w-2 h-2 bg-[#10B981] animate-pulse shrink-0 ml-2"></div>}
      </div>

      {/* NAVIGATION MENU */}
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar bg-white ml-1 overflow-x-hidden">
        
        {menuGroups.map((group, index) => (
          <div key={index} className="mb-8 last:mb-0">
            
            {/* CATEGORY HEADER CON ACENTO VERDE */}
            <div className={`flex items-center gap-2 mb-3 ${isOpen ? 'px-6' : 'justify-center'}`}>
              {isOpen ? (
                <>
                  <div className="h-[2px] w-3 bg-[#10B981] shrink-0"></div>
                  <span className="text-xs font-black text-[#1E293B] uppercase tracking-[0.3em] whitespace-nowrap">
                    {group.category}
                  </span>
                </>
              ) : (
                /* Cuando está cerrado, la categoría se vuelve solo una línea separadora */
                <div className="h-[2px] w-6 bg-[#E2E8F0]"></div>
              )}
            </div>

            {/* ITEMS DE LA CATEGORÍA */}
            <div className="space-y-1 px-2">
              {group.items.map((item) => {
                const isActive = currentView === item.id;
                const Icon = item.icon; 
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={!isOpen ? item.name : undefined}
                    className={`w-full text-left py-3 text-xs font-black uppercase tracking-widest transition-all border rounded-none flex items-center cursor-pointer ${
                      isOpen ? 'px-4 justify-between' : 'justify-center px-0'
                    } ${
                      isActive 
                        ? 'border-[#1E293B] bg-[#10B981] text-[#1E293B] shadow-[3px_3px_0_0_#1E293B] translate-x-[-2px] translate-y-[-2px]' 
                        : 'border-transparent text-[#64748B] hover:border-[#10B981] hover:text-[#10B981] hover:bg-[#10B981]/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Icon size={18} className="shrink-0" />
                      {isOpen && <span className="whitespace-nowrap">{item.name}</span>}
                    </div>
                    {isOpen && isActive && <div className="w-2 h-2 bg-[#1E293B] shrink-0"></div>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* FOOTER TÉCNICO */}
      <div className={`p-4 border-t border-[#E2E8F0] bg-[#1E293B] ml-1 flex ${isOpen ? 'justify-between items-center' : 'justify-center'}`}>
        {isOpen && <span className="text-xs font-black text-[#10B981] uppercase tracking-[0.2em] whitespace-nowrap">SYS_v2.0</span>}
        <div className="flex gap-1 shrink-0">
           <div className="w-1 h-3 bg-[#10B981]/30"></div>
           <div className="w-1 h-3 bg-[#10B981]/60"></div>
           <div className="w-1 h-3 bg-[#10B981]"></div>
        </div>
      </div>
    </aside>
  );
};