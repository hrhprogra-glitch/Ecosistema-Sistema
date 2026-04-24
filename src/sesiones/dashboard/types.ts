// src/sesiones/dashboard/types.ts

/**
 * ==========================================
 * MODELOS DE DATOS: DASHBOARD (MÉTRICAS)
 * ==========================================
 * Arquitectura "Ecosistema" - Panel de Control Inteligente
 */

// 1. Estructura para los "Square Cards" superiores (Métricas en tiempo real)
export interface DashboardKPIs {
  herramientas_en_calle: number;    // Conteo de movimientos con estado PENDIENTE_RETORNO
  alertas_stock_critico: number;    // Conteo de ítems donde stock_actual <= stock_minimo
  movimientos_hoy: number;          // Total de transacciones del día actual
  trabajadores_activos: number;     // Personal total operativo
}

// 2. View Model para la lista de "Últimos Movimientos Rápidos"
export interface ResumenMovimiento {
  id: string;
  trabajador_nombre: string;
  item_nombre: string;
  tipo: 'SALIDA' | 'DEVOLUCION';
  cantidad: number;
  hora_formateada: string;          // Ej: "14:30"
}

// 3. Estructura para la alerta de Stock Mínimo (Tabla de advertencias)
export interface AlertaStock {
  item_id: string;
  sku: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  diferencia: number;               // Cuánto falta para alcanzar el mínimo
}