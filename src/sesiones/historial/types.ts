// src/sesiones/historial/types.ts
import type { TipoMovimiento, EstadoMovimiento } from '../movimientos/types';

/**
 * ==========================================
 * MODELOS DE DATOS: HISTORIAL Y DEVOLUCIONES
 * ==========================================
 * Arquitectura "Ecosistema" - Módulo de Auditoría
 */

// 1. View Model: Representación aplanada para la Tabla de Historial
// Esto simula un "JOIN" de base de datos entre Movimientos, Items y Trabajadores
export interface MovimientoDetalle {
  id: string;                     // ID del Movimiento
  fecha: string;                  // Fecha y hora exacta (Timestamp)
  
  // Datos transaccionales
  tipo: TipoMovimiento;
  estado: EstadoMovimiento;
  cantidad: number;
  notas_observaciones?: string;

  // Datos cruzados del Ítem (Almacén)
  item_id: string;
  item_sku: string;
  item_nombre: string;
  item_tipo: string;              // Para saber si es Consumible o Herramienta

  // Datos cruzados del Trabajador (Personal)
  trabajador_id: string;
  trabajador_nombre: string;
  trabajador_documento: string;
}

// 2. Interfaz para el motor de búsqueda y filtros (High Contrast UI)
export interface FiltrosHistorial {
  rangoFechas?: {
    inicio: string;
    fin: string;
  };
  tipoMovimiento?: TipoMovimiento | 'TODOS';
  estado?: EstadoMovimiento | 'TODOS';
  busquedaGlobal?: string;        // Búsqueda por SKU, Nombre de ítem o Trabajador
}