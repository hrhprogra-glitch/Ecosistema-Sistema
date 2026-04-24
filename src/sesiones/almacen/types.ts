// src/sesiones/almacen/types.ts

/**
 * ==========================================
 * MODELOS DE DATOS: ALMACÉN MASTER
 * ==========================================
 * Arquitectura "Ecosistema"
 */

// 1. Tipos estrictos para categorizar el inventario
export type TipoItem = 'CONSUMIBLE' | 'HERRAMIENTA';

export type EstadoItem = 'ACTIVO' | 'INACTIVO' | 'MANTENIMIENTO';

export type UnidadMedida = 'UNIDAD' | 'CAJA' | 'METRO' | 'LITRO' | 'KILOGRAMO' | 'PAR';

// 2. Interfaz principal del Producto / Herramienta
export interface InventarioItem {
  id: string;                  // UUID generado por Supabase
  codigo_sku: string;          // Código único empresarial (ej: HER-001, MAT-045)
  nombre: string;              // Nombre técnico del ítem
  descripcion?: string;        // Especificaciones técnicas (opcional)
  tipo: TipoItem;              // Define si se gasta o si se presta
  
  // Control de Stock
  stock_actual: number;        // Cantidad física actual en el almacén
  stock_minimo: number;        // Alerta: Cuándo debemos pedir más
  unidad_medida: UnidadMedida; // Cómo se contabiliza
  
  // Logística
  ubicacion?: string;          // Pasillo/Estante (ej: "Estante A - Fila 3")
  marca?: string;              // Marca del producto o herramienta
  estado: EstadoItem;          // Para saber si una herramienta está en mantenimiento
  
  // Trazabilidad temporal
  created_at?: string;         // Cuándo se registró por primera vez
  updated_at?: string;         // Última modificación del registro
}

// 3. Tipo utilitario para la creación (Omitimos campos que la BD genera sola)
export type NuevoInventarioItem = Omit<InventarioItem, 'id' | 'created_at' | 'updated_at'>;