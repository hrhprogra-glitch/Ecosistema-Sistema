// src/sesiones/movimientos/types.ts

/**
 * ==========================================
 * MODELOS DE DATOS: MOVIMIENTOS (TRANSACCIONES)
 * ==========================================
 * Arquitectura "Ecosistema"
 */

// 1. Tipología exacta de la transacción
export type TipoMovimiento = 'SALIDA' | 'DEVOLUCION' | 'MERMA'; 
// (Nota: MERMA es por si un producto se rompe o pierde y necesitas sacarlo del stock formalmente)

// 2. Estado del movimiento (Crítico para la Logística Inversa de Herramientas)
export type EstadoMovimiento = 
  | 'COMPLETADO'           // Para Consumibles (se entregó y listo)
  | 'PENDIENTE_RETORNO'    // Para Herramientas (está en la calle)
  | 'RETORNADO'            // Para Herramientas (volvió al almacén)
  | 'ANULADO';             // Si hubo un error de tipeo (No se borra, se anula)

// 3. Interfaz Principal del Movimiento (La Tabla Pivote)
export interface Movimiento {
  id: string;                     // UUID generado por Supabase
  item_id: string;                // ID del Producto/Herramienta (Foreign Key)
  trabajador_id: string;          // ID del Personal (Foreign Key)
  
  tipo_movimiento: TipoMovimiento;
  cantidad: number;               // Cuánto se llevó o cuánto devolvió
  
  // Trazabilidad y Auditoría
  estado: EstadoMovimiento;
  notas_observaciones?: string;   // Ej: "Se entregó taladro con broca desgastada"
  fecha_movimiento: string;       // Timestamp exacto de la acción
  
  // Metadatos de Sistema
  created_at?: string;            // Registro en BD
  updated_at?: string;            // Última edición (ej: cuando cambia de PENDIENTE a RETORNADO)
}

// 4. Tipo utilitario para registrar una nueva salida
export type NuevoMovimiento = Omit<Movimiento, 'id' | 'created_at' | 'updated_at'>;