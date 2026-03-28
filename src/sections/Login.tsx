// src/sections/Login.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../db/supabase';
// IMPORTA TU LOGO AQUÍ. Asegúrate de tener esta imagen en tu carpeta de assets.
import logoEvicamp from '../assets/logo.png'; 
import imgProyectos from '../assets/proyectos.jpg';
import imgInventario from '../assets/inventario.jpg';
import imgFinanzas from '../assets/finanzas.jpg';
interface LoginProps {
  onLoginSuccess: (permisos?: any, email?: string) => void;
}

// 1. AQUI AGREGAS LAS IMAGENES Y TEXTOS QUE ROTARÁN
const carouselSlides = [
  {
    image: imgProyectos, // Asegúrate de tener esta imagen en tu carpeta de assets
    title: "Proyectos",
    subtitle: "Gestión Estructural y Despliegue",
    tag: "PRJ_SITE: ALPHA_ZONE // VIEW 01"
  },
  {
    image: imgInventario, // Asegúrate de tener esta imagen en tu carpeta de assets
    title: "Inventario",
    subtitle: "Control de Salidas y Retornos",
    tag: "LOGISTICS: WAREHOUSE_A // VIEW 02"
  },
  {
    image: imgFinanzas, // Asegúrate de tener esta imagen en tu carpeta de assets
    title: "Finanzas",
    subtitle: "Análisis de Rentabilidad",
    tag: "FINANCE: DASHBOARD_X // VIEW 03"
  }
];

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        console.error("Error cargando logo en login", error);
      }
    };
    fetchEmpresa();
  }, []);

  // Estado para controlar el carrusel de imágenes
  const [currentSlide, setCurrentSlide] = useState(0);

  // Efecto para rotar las imágenes cada 5 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let identificador = email.trim();
    if (!identificador.includes('@')) {
      identificador = `${identificador}@evicamp.com`; 
    }

    // 1. Intentar entrar como Administrador Maestro (Auth oficial de Supabase)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: identificador,
      password: password,
    });

    if (!authError) {
      // Si entra aquí, eres tú (el Admin Maestro). Te damos acceso total.
      onLoginSuccess({ sistema_acceso_total: true });
      return;
    }

    // 2. Si falla el Auth oficial, buscamos en tu tabla personalizada de 'empleados'
    const { data: empleado } = await supabase
      .from('empleados')
      .select('*')
      .eq('email', identificador)
      .eq('password', password) // Validamos la clave que escribiste en el modal
      .eq('estado', 'ACTIVO')    // Solo si el empleado no está bloqueado
      .single();

    if (empleado) {
      // ¡Éxito! Es un empleado. Pasamos sus permisos y su email para guardarlos
      onLoginSuccess(empleado.permisos, empleado.email);
    } else {
      // Si no existe en ningún lado o la clave está mal
      setError('ERROR: CREDENCIALES INVÁLIDAS O CUENTA INACTIVA.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#1E293B] font-mono selection:bg-[#10B981] selection:text-white">
      
      {/* =========================================
          LADO IZQUIERDO: TERMINAL DE ACCESO
      ========================================= */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-between relative z-10 border-r-[8px] border-[#10B981] shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        
        {/* Barra gruesa esmeralda superior */}
        <div className="absolute top-0 left-0 w-full h-4 bg-[#10B981]"></div>

        {/* CONTENEDOR CENTRAL DEL FORMULARIO */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24">
          
          <div className="mb-12">
            {/* LOGO + NOMBRE */}
            <div className="flex items-center gap-4">
              {/* Logo Dinámico o por Defecto */}
              <img src={empresaData.logo} alt="Logo Empresa" className="w-12 h-12 object-contain" /> 
              
              <h1 className="text-5xl font-black text-[#1E293B] uppercase tracking-tighter">
                {empresaData.nombre}<span className="text-[#10B981]">.</span>
              </h1>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <div className="h-[2px] flex-1 bg-[#10B981]"></div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-[0.3em]">
                Terminal de Acceso
              </p>
              <div className="h-[2px] flex-1 bg-[#10B981]"></div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="border-2 border-red-500 bg-red-50 text-red-600 px-4 py-3 text-[10px] font-black uppercase tracking-widest animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#10B981]"></div>
                Identificador_Usuario
              </label>
              <input
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-2 border-[#E2E8F0] bg-white px-4 py-4 text-sm font-bold text-[#1E293B] focus:border-[#10B981] focus:outline-none transition-colors rounded-none placeholder:text-[#CBD5E1]"
                placeholder="INGRESE SU ID..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#1E293B] uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#10B981]"></div>
                Clave_Seguridad
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border-2 border-[#E2E8F0] bg-white px-4 py-4 text-sm font-bold text-[#1E293B] focus:border-[#10B981] focus:outline-none transition-colors rounded-none placeholder:text-[#CBD5E1]"
                placeholder="••••••••"
              />
            </div>

            {/* BOTÓN PRIMORDIAL ESMERALDA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#10B981] text-[#1E293B] border-2 border-[#1E293B] px-4 py-5 text-sm font-black uppercase tracking-[0.2em] hover:bg-[#1E293B] hover:text-[#10B981] hover:border-[#10B981] transition-all disabled:opacity-50 mt-8 rounded-none cursor-pointer shadow-[4px_4px_0_0_#1E293B] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
            >
              {loading ? 'AUTENTICANDO...' : 'EJECUTAR INGRESO'}
            </button>
          </form>
        </div>

        {/* FOOTER IZQUIERDO */}
        <div className="p-8 border-t-2 border-[#E2E8F0] flex justify-between items-center">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">
            v2.0.4_oxide_engine
          </span>
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-[#E2E8F0] rounded-none"></div>
            <div className="w-2 h-2 bg-[#E2E8F0] rounded-none"></div>
            <div className="w-2 h-2 bg-[#E2E8F0] rounded-none"></div>
            <div className="w-2 h-2 bg-[#10B981] rounded-none animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* =========================================
          LADO DERECHO: VISOR DINÁMICO (IMÁGENES)
      ========================================= */}
      <div className="hidden md:flex md:w-1/2 relative flex-col justify-end p-12 overflow-hidden bg-[#1E293B]">
        
        {/* IMAGEN DE FONDO DINÁMICA */}
        {carouselSlides.map((slide, index) => (
          <div 
            key={index}
            className={`absolute inset-0 bg-cover bg-center mix-blend-luminosity transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-50' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url('${slide.image}')` }}
          ></div>
        ))}

        {/* OVERLAY TÉCNICO (HUD) */}
        <div className="absolute inset-0 border-[24px] border-[#10B981]/10 pointer-events-none z-10"></div>
        
        <div className="absolute top-12 right-12 border border-[#10B981] bg-[#1E293B]/80 px-3 py-1 text-[8px] font-black text-[#10B981] tracking-[0.2em] uppercase backdrop-blur-sm z-20 transition-all duration-500">
          {carouselSlides[currentSlide].tag} <span className="inline-block w-1.5 h-1.5 bg-[#10B981] ml-2 animate-pulse"></span>
        </div>

        {/* TEXTO DEL MÓDULO ACTUAL DINÁMICO */}
        <div className="relative z-20 border-l-[6px] border-[#10B981] pl-6 mb-8 transition-all duration-500">
          <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-2 shadow-black drop-shadow-lg">
            {carouselSlides[currentSlide].title}
          </h2>
          <p className="text-[#10B981] font-bold text-xs tracking-[0.3em] uppercase bg-[#1E293B]/80 inline-block px-2 py-1">
            {carouselSlides[currentSlide].subtitle}
          </p>
        </div>

        {/* INDICADOR DE CARRUSEL TÉCNICO (PUNTOS) */}
        <div className="relative z-20 flex gap-2">
           {carouselSlides.map((_, index) => (
             <button 
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 transition-all cursor-pointer ${
                  index === currentSlide ? 'w-16 bg-[#10B981]' : 'w-8 bg-white/20 hover:bg-white/40'
                }`}
             ></button>
           ))}
        </div>
      </div>

    </div>
  );
};