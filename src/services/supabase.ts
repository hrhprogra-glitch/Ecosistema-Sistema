import { createClient } from '@supabase/supabase-js';

// --- INTERFACES PRINCIPALES ---
export interface Cliente {
  id?: number;
  nombre_cliente: string;
  dni_ruc?: string; 
  dni?: string; // <-- Añadido por seguridad para compatibilidad con la base de datos
  telefono?: string;
  direccion?: string;
  ubicacion_link?: string;
  email?: string;
}

export interface UsuarioSistema {
  id?: number;
  email: string;
  password?: string;
  username?: string;
  role: 'admin' | 'supervisor' | 'trabajador'; // <-- Añadido 'supervisor'
  full_name: string;
  permisos?: string[];
}

export interface CotizacionHistorial {
  id?: number;
  cliente_id: number;
  fecha_emision: string;
  monto_total: number;
  // Añadimos 'Obra Terminada' y 'Finalizado'
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Parcial' | 'Completado' | 'Obra Terminada' | 'Finalizado'; 
  nota?: string;
  detalles?: any[]; 
  descripcion_trabajo?: string; 
  created_at?: string;
  pagos?: Pago[]; 
}

export interface Pago {
  id?: number;
  cotizacion_id: number;
  monto_pagado: number;
  fecha_pago?: string;
  metodo: string;
  created_at?: string;
}

// NUEVA INTERFAZ DE OBRAS
export interface Obra {
  id?: number;
  codigo_obra: string;
  nombre_obra: string;
  cliente_id: number;
  estado: string;
  costo_acumulado: number;
  monto_pagado?: number;
  direccion_link?: string;
  fecha_inicio?: string;
  materiales_asignados?: any[];
  trabajadores_asignados?: any[];
  historial_movimientos?: any[]; // <--- AÑADE ESTA LÍNEA
  created_at?: string;
  nota?: string;                 // <-- AÑADIDO
  descripcion_trabajo?: string;  // <-- AÑADIDO
  clientes?: { 
    nombre_cliente: string; 
    direccion?: string;          // <-- AÑADIDO
    ubicacion_link?: string;     // <-- AÑADIDO
  }; 
}

// 1. Intentamos leer las variables de entorno (Local/Netlify)
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Aplicamos un "Fallback" (Respaldo Seguro)
// Si Netlify falla en leer el entorno, usará estas cadenas directamente.
// REEMPLAZA LOS TEXTOS ENTRE COMILLAS CON TUS DATOS REALES DE SUPABASE
const supabaseUrl = envUrl || "https://nnoujhevzfylxnygccle.supabase.co";
const supabaseKey = envKey || "sb_publishable_2-kYi2TQ_rTlj0DnBTSpFw_m7FbEKmi";

// 3. Inicialización blindada
if (!supabaseUrl || !supabaseKey) {
  console.error("Fallo estructural: Credenciales de Supabase no inyectadas.");
}

export const supabase = createClient(
  supabaseUrl as string, 
  supabaseKey as string
);

// --- SERVICIO DE CLIENTES ---
export const clientesService = {
  async listar() {
    const { data, error } = await supabase.from('clientes').select('*, cotizaciones_historial(id)').order('id', { ascending: false });
    if (error) throw error;
    return data as Cliente[];
  },
  async crear(cliente: any) {
    const { data, error } = await supabase.from('clientes').insert([cliente]).select();
    if (error) throw error;
    return data[0];
  },
  async insertarMasivo(clientes: any[]) {
    const { data, error } = await supabase.from('clientes').insert(clientes).select();
    if (error) throw error;
    return data;
  },
  async actualizar(id: number, cliente: any) {
    const { error } = await supabase.from('clientes').update(cliente).eq('id', id);
    if (error) throw error;
  },
  async eliminar(id: number) {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw error;
  }
};

// --- SERVICIO DE INVENTARIO ---
export const inventarioService = {
  async listar() {
    const { data, error } = await supabase.from('productos').select('*').order('id', { ascending: false });
    if (error) throw error;
    return data;
  },
  async crear(producto: any) {
    const { data, error } = await supabase.from('productos').insert([producto]).select();
    if (error) throw error;
    return data[0];
  },
  async actualizar(id: number, producto: any) {
    const { data, error } = await supabase.from('productos').update(producto).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },
  async eliminar(id: number) {
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};

// --- SERVICIO DE OBRAS ---
// src/services/supabase.ts

// src/services/supabase.ts

export const obrasService = {
  async listar() {
    const { data, error } = await supabase
      .from('obras')
      // EL SECRETO ESTÁ AQUÍ: Pedir dirección y ubicacion_link
      .select('*, clientes(nombre_cliente, direccion, ubicacion_link)') 
      .order('id', { ascending: false });
    if (error) throw error;
    return data as Obra[];
  },
  async crear(obra: any) {
    const { data, error } = await supabase.from('obras').insert([obra]).select();
    if (error) throw error;
    return data[0];
  },
  // RESTAURAR ESTE MÉTODO
  async actualizar(id: number, obra: any) {
    const { data, error } = await supabase.from('obras').update(obra).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },
  // RESTAURAR ESTE MÉTODO
  async eliminar(id: number) {
    const { error } = await supabase.from('obras').delete().eq('id', id);
    if (error) throw error;
  },
  // MANTENER ESTE MÉTODO PARA EL CIERRE
  async finalizarObra(id: number) {
    const { data, error } = await supabase
      .from('obras')
      .update({ estado: 'Finalizada' })
      .eq('id', id);
    if (error) throw error;
    return data;
  }
};

// --- SERVICIO DE USUARIOS ---
export const usuariosService = {
  async validarUsuario(email: string, pass: string) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('password', pass)
      .single();
      
    if (error || !data) return null;
    return data as UsuarioSistema;
  },
  async listar() {
    const { data, error } = await supabase.from('usuarios').select('*').order('id', { ascending: false });
    if (error) throw error;
    return data as UsuarioSistema[];
  },
  async crear(usuario: any) {
    const { data, error } = await supabase.from('usuarios').insert([usuario]).select();
    if (error) throw error;
    return data[0];
  },
  async actualizar(id: number, usuario: any) {
    const { data, error } = await supabase.from('usuarios').update(usuario).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },
  async eliminar(id: number) {
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};
// --- SERVICIO DE FINANZAS ---
export const finanzasService = {
  async registrarCotizacion(cotizacion: CotizacionHistorial) {
    const { data, error } = await supabase.from('cotizaciones_historial').upsert([cotizacion]).select();
    if (error) throw error;
    return data[0];
  },
  async listarCotizacionesPorCliente(clienteId: number) {
    const { data, error } = await supabase.from('cotizaciones_historial').select('*, pagos(*)').eq('cliente_id', clienteId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // ---> NUEVA FUNCIÓN AGREGADA (PASO 1) <---
  async listarCotizacionesFinalizadas() {
    const { data, error } = await supabase
      .from('cotizaciones_historial')
      .select('*, clientes(nombre_cliente, direccion, ubicacion_link), pagos(*)')
      .eq('estado', 'Finalizado')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  // ------------------------------------------
  
  // ---> CORRECCIÓN PRINCIPAL AQUÍ <---
  async registrarPago(cotizacionId: number, monto: number, metodo: string) {
    // Al enviar el objeto así, evitamos el error de "Keys must match"
    const nuevoPago = {
      cotizacion_id: cotizacionId,
      monto_pagado: monto,
      metodo: metodo
    };
    const { error } = await supabase.from('pagos').insert(nuevoPago);
    if (error) throw error;
  },

  async listarCotizacionesTodas() {
    const { data, error } = await supabase.from('cotizaciones_historial')
      // EL SECRETO ESTÁ AQUÍ TAMBIÉN
      .select('*, clientes(nombre_cliente, direccion, ubicacion_link), pagos(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async actualizarEstadoCotizacion(id: number, estado: string) {
    const { error } = await supabase.from('cotizaciones_historial').update({ estado }).eq('id', id);
    if (error) throw error;
  },
  async actualizarPago(id: number, cambios: { monto_pagado: number; metodo: string }) {
    const { data, error } = await supabase.from('pagos').update(cambios).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },
  async eliminarPago(id: number) {
    const { error } = await supabase.from('pagos').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
  async eliminarCotizacion(id: number) {
    const { error } = await supabase
      .from('cotizaciones_historial') 
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },
};