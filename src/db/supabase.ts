// src/db/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Ciberseguridad: Importación de tipos estricta para Vite
import type { InventarioItem, NuevoInventarioItem } from '../sesiones/almacen/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(' [ECOSISTEMA ERROR]: Credenciales de Supabase no encontradas.');
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);

// --- INTERFAZ DE TRABAJADOR ---
export interface Trabajador {
  id?: number;
  documento_identidad: string;
  nombre_completo: string;
  cargo: string;
  estado: 'ACTIVO' | 'INACTIVO';
  created_at?: string;
}

// --- SERVICIO DE TRABAJADORES ---
export const trabajadoresService = {
  async listar() {
    const { data, error } = await supabase.from('trabajadores').select('*').order('id', { ascending: false });
    if (error) throw error;
    return data as Trabajador[];
  },
  async crear(trabajador: Omit<Trabajador, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('trabajadores').insert([trabajador]).select();
    if (error) throw error;
    return data[0];
  },
  async alternarEstado(id: number, estadoActual: string) {
    const nuevoEstado = estadoActual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const { data, error } = await supabase.from('trabajadores').update({ estado: nuevoEstado }).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },
  async actualizar(id: number, trabajador: Partial<Trabajador>) {
    const { data, error } = await supabase.from('trabajadores').update(trabajador).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },
  async eliminar(id: number) {
    const { error } = await supabase.from('trabajadores').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};

// --- SERVICIO DE ALMACÉN ---
export const inventarioService = {
  async listar() {
    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .order('id', { ascending: false });
    if (error) throw error;
    return data as InventarioItem[];
  },
  async crear(item: NuevoInventarioItem) {
    const { data, error } = await supabase
      .from('inventario')
      .insert([item])
      .select();
    if (error) throw error;
    return data[0];
  },
  async actualizar(id: number, item: Partial<InventarioItem>) {
    const { data, error } = await supabase
      .from('inventario')
      .update(item)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },
  async eliminar(id: number) {
    const { error } = await supabase
      .from('inventario')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};

// --- SERVICIO DE MOVIMIENTOS (TRANSACCIONAL E HISTORIAL) ---
export const movimientosService = {
  // 1. Obtener historial con JOIN a inventario y trabajadores para auditoría
  async listarHistorial() {
    const { data, error } = await supabase
      .from('movimientos')
      .select(`
        *,
        trabajadores ( documento_identidad, nombre_completo ),
        inventario ( codigo_sku, nombre, tipo )
      `)
      .order('fecha_movimiento', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // 2. Registrar movimiento y afectar stock automáticamente (Logística)
  async registrarTransaccion(payload: {
    item_id: number;
    trabajador_id: number;
    tipo_movimiento: 'SALIDA' | 'DEVOLUCION' | 'MERMA';
    cantidad: number;
    estado: 'COMPLETADO' | 'PENDIENTE_RETORNO' | 'RETORNADO' | 'ANULADO';
  }) {
    // A. Insertar el registro en la matriz de historial de movimientos
    const { data: mov, error: movError } = await supabase
      .from('movimientos')
      .insert([payload])
      .select()
      .single();
    
    if (movError) throw movError;

    // B. Extraer el stock actual del ítem operativo para calcular la variación
    const { data: itemData } = await supabase
      .from('inventario')
      .select('stock_actual')
      .eq('id', payload.item_id)
      .single();

    if (itemData) {
      let nuevoStock = itemData.stock_actual;
      
      // Lógica de motor logístico: Salida resta al almacén, Devolución suma al almacén
      if (payload.tipo_movimiento === 'SALIDA') nuevoStock -= payload.cantidad;
      if (payload.tipo_movimiento === 'DEVOLUCION') nuevoStock += payload.cantidad;

      // C. Sobrescribir el stock final en la base de datos principal de inventario
      await supabase
        .from('inventario')
        .update({ stock_actual: nuevoStock, updated_at: new Date().toISOString() })
        .eq('id', payload.item_id);
    }

    return mov;
  },

  // 3. NUEVO: Corrector de Errores (Recalcula y compensa el inventario automáticamente)
  async actualizarTransaccion(
    mov_id: string,
    item_id: number,
    tipo_movimiento: 'SALIDA' | 'DEVOLUCION' | 'MERMA',
    cantidadAnterior: number,
    nuevaCantidad: number
  ) {
    // A. Actualizamos el registro del historial con la cantidad corregida
    const { error: movError } = await supabase
      .from('movimientos')
      .update({ cantidad: nuevaCantidad, updated_at: new Date().toISOString() })
      .eq('id', mov_id);
    
    if (movError) throw movError;

    // B. Compensamos matemáticamente la matriz de inventario
    const { data: itemData } = await supabase
      .from('inventario')
      .select('stock_actual')
      .eq('id', item_id)
      .single();

    if (itemData) {
      let delta = nuevaCantidad - cantidadAnterior;
      let nuevoStock = itemData.stock_actual;

      // Si fue salida y aumentó el error, restamos más stock. Si disminuyó la cantidad, la devolvemos al stock.
      if (tipo_movimiento === 'SALIDA') nuevoStock -= delta;
      if (tipo_movimiento === 'DEVOLUCION') nuevoStock += delta;

      await supabase
        .from('inventario')
        .update({ stock_actual: nuevoStock, updated_at: new Date().toISOString() })
        .eq('id', item_id);
    }
    return true;
  }
};