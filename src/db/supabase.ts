// src/db/supabase.ts
import { createClient } from '@supabase/supabase-js';

/**
 * Arquitectura Ecosistema - Módulo de Base de Datos
 * Conexión centralizada con Supabase utilizando variables de entorno de Vite.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ciberseguridad: Validación de integridad de entorno
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    ' [ECOSISTEMA ERROR]: Credenciales de Supabase no encontradas. ' +
    'Asegúrate de configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env.local'
  );
}

// Inicialización del cliente con tipado automático (si usas tipos de Supabase)
export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);