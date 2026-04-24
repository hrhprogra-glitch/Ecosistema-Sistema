// src/sesiones/personal/types.ts

/**
 * ==========================================
 * MODELOS DE DATOS: PERSONAL (TRABAJADORES)
 * ==========================================
 * Arquitectura "Ecosistema"
 */

// 1. Estado estricto para evitar borrados accidentales (Integridad Referencial)
export type EstadoTrabajador = 'ACTIVO' | 'INACTIVO';

// 2. Interfaz principal del Trabajador
export interface Trabajador {
  id: string;                   // UUID generado por Supabase
  documento_identidad: string;  // DNI, Carnet de Extranjería, Pasaporte (Único)
  nombre_completo: string;      // Nombre y apellidos
  cargo: string;                // Ej: "Operario", "Soldador", "Supervisor"
  telefono?: string;            // Contacto (Opcional, útil si no devuelven herramientas)
  estado: EstadoTrabajador;     // ACTIVO o INACTIVO
  
  // Trazabilidad temporal
  created_at?: string;          // Fecha de ingreso al sistema
  updated_at?: string;          // Última actualización de sus datos
}

// 3. Tipo utilitario para el formulario de registro de nuevo personal
export type NuevoTrabajador = Omit<Trabajador, 'id' | 'created_at' | 'updated_at'>;