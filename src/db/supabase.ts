// src/db/supabase.ts
import { createClient } from '@supabase/supabase-js';

// 1. EXTRACCIÓN DE CRIPTOGRAFÍA DE ENTORNO
// Estas variables deben estar en tu archivo .env local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. PROTOCOLO DE VALIDACIÓN CRÍTICA
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ALERTA DE SISTEMA: Credenciales de Supabase no detectadas.');
  console.info('Asegúrate de que VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén configuradas.');
}

// 3. INSTANCIACIÓN DEL CLIENTE CON MOTOR DE PERSISTENCIA
// Optimizamos la configuración para que el login sea más estable
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,      // Mantiene al usuario conectado aunque cierre la pestaña
    autoRefreshToken: true,    // Renueva la llave de acceso automáticamente
    detectSessionInUrl: true   // Útil para futuras funciones de recuperación de contraseña
  },
  global: {
    headers: { 'x-application-name': 'evicamp-oxide-engine' }
  }
});

// 4. TEST DE CONEXIÓN (OPCIONAL PARA CONSOLA)
// Esto te avisará en la consola del navegador si la conexión es exitosa
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN') console.log('CONEXIÓN DB: ESTABLECIDA');
  if (event === 'SIGNED_OUT') console.log('CONEXIÓN DB: TERMINAL DESCONECTADA');
});