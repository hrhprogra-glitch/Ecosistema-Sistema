import { createClient } from '@supabase/supabase-js';

// --- INTERFACES PRINCIPALES ---
export interface Cliente {
  id?: number;
  nombre_cliente: string;
  direccion: string;
  telefono: string;
  ubicacion_link: string;
  cotizaciones_historial?: { id: number }[];
}

export interface UsuarioSistema {
  id?: number;
  email: string;
  password?: string;
  role: 'admin' | 'trabajador'; 
  full_name: string;
  permisos?: string[];
}

export interface CotizacionHistorial {
  id?: number;
  cliente_id: number;
  fecha_emision: string;
  monto_total: number;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Parcial' | 'Completado'; // <--- Añadido Aprobado y Rechazado
  nota?: string;
  detalles?: any[]; 
  created_at?: string;
}

export interface Pago {
  id?: number;
  cotizacion_id: number;
  monto_pagado: number;
  fecha_pago: string;
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
  materiales_asignados?: any[];
  created_at?: string;
  clientes?: { nombre_cliente: string }; // Relación con tabla clientes
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

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

// --- SERVICIO DE OBRAS (NUEVO) ---
export const obrasService = {
  async listar() {
    // Trae las obras y hace join con la tabla clientes para sacar el nombre real
    const { data, error } = await supabase.from('obras').select('*, clientes(nombre_cliente)').order('id', { ascending: false });
    if (error) throw error;
    return data as Obra[];
  },
  async crear(obra: any) {
    const { data, error } = await supabase.from('obras').insert([obra]).select();
    if (error) throw error;
    return data[0];
  },
  async actualizar(id: number, obra: any) {
    const { data, error } = await supabase.from('obras').update(obra).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },
  async eliminar(id: number) {
    const { error } = await supabase.from('obras').delete().eq('id', id);
    if (error) throw error;
  }
};

// --- SERVICIO DE USUARIOS ---
export const usuariosService = {
  async validarUsuario(username: string, pass: string) {
    const { data, error } = await supabase.from('usuarios').select('*').eq('username', username).eq('password', pass).single();
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
  }
};

// --- SERVICIO DE FINANZAS ---
// --- SERVICIO DE FINANZAS ---
export const finanzasService = {
  async registrarCotizacion(cotizacion: CotizacionHistorial) {
    const { data, error } = await supabase.from('cotizaciones_historial').insert([cotizacion]).select();
    if (error) throw error;
    return data[0];
  },
  async listarCotizacionesPorCliente(clienteId: number) {
    const { data, error } = await supabase.from('cotizaciones_historial').select('*, pagos(*)').eq('cliente_id', clienteId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async registrarPago(pago: Pago, cotizacionId: number, nuevoEstado: string) {
    const { error: errPago } = await supabase.from('pagos').insert([pago]);
    if (errPago) throw errPago;
    const { error: errEstado } = await supabase.from('cotizaciones_historial').update({ estado: nuevoEstado }).eq('id', cotizacionId);
    if (errEstado) throw errEstado;
  },
  
  // ==========================================
  // NUEVAS FUNCIONES PARA BANDEJA DE GESTIÓN
  // ==========================================
  
  async listarCotizacionesTodas() {
    // Trae todas las cotizaciones con el nombre del cliente para la tabla general
    const { data, error } = await supabase.from('cotizaciones_historial')
      .select('*, clientes(nombre_cliente)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async actualizarEstadoCotizacion(id: number, estado: string) {
    // Actualiza el estado a 'Aprobado', 'Rechazado', etc.
    const { error } = await supabase.from('cotizaciones_historial').update({ estado }).eq('id', id);
    if (error) throw error;
  }
};