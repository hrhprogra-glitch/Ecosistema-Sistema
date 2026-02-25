import { createClient } from '@supabase/supabase-js';

// --- INTERFACES PRINCIPALES ---
export interface Cliente {
  id?: number;
  nombre_cliente: string;
  direccion: string;
  telefono: string;
  ubicacion_link: string;
  cotizaciones_historial?: { id: number }[];
  dni_ruc?: string; // Opcional para evitar errores si no existe en BD
}

export interface UsuarioSistema {
  id?: number;
  email: string;
  password?: string;
  username?: string;
  role: 'admin' | 'trabajador'; 
  full_name: string;
  permisos?: string[];
}

export interface CotizacionHistorial {
  id?: number;
  cliente_id: number;
  fecha_emision: string;
  monto_total: number;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Parcial' | 'Completado';
  nota?: string;
  detalles?: any[]; 
  created_at?: string;
  pagos?: Pago[]; // Para soportar la lectura de abonos
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
  monto_pagado?: number;
  direccion_link?: string;
  fecha_inicio?: string;
  materiales_asignados?: any[];
  trabajadores_asignados?: any[];
  created_at?: string;
  clientes?: { nombre_cliente: string }; 
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

// --- SERVICIO DE OBRAS ---
export const obrasService = {
  async listar() {
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

// --- SERVICIO DE FINANZAS (MODIFICADO) ---
export const finanzasService = {
  async registrarCotizacion(cotizacion: CotizacionHistorial) {
    // Cambiado insert por upsert para permitir la edición desde el generador
    const { data, error } = await supabase.from('cotizaciones_historial').upsert([cotizacion]).select();
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
  async listarCotizacionesTodas() {
    // Modificado para traer pagos(*) y evitar error 400 por dni_ruc inexistente
    const { data, error } = await supabase.from('cotizaciones_historial')
      .select('*, clientes(nombre_cliente), pagos(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async actualizarEstadoCotizacion(id: number, estado: string) {
    const { error } = await supabase.from('cotizaciones_historial').update({ estado }).eq('id', id);
    if (error) throw error;
  },
  // NUEVOS MÉTODOS PARA GESTIÓN DE ABONOS
  async actualizarPago(id: number, cambios: { monto_pagado: number; metodo: string }) {
    const { data, error } = await supabase.from('pagos').update(cambios).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },
  async eliminarPago(id: number) {
    const { error } = await supabase.from('pagos').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};