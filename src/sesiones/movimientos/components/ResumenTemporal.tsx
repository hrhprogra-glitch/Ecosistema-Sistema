// src/sesiones/movimientos/components/ResumenTemporal.tsx
import { Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function ResumenTemporal() {
  // Datos mockeados de los últimos movimientos del día
  const ultimosMovimientos = [
    { id: '1', trabajador: 'Carlos Mendoza', item: 'Taladro Percutor', cant: 1, tipo: 'SALIDA', hora: '10:45 AM' },
    { id: '2', trabajador: 'Elena Rojas', item: 'Discos de Corte', cant: 5, tipo: 'SALIDA', hora: '09:30 AM' },
    { id: '3', trabajador: 'Carlos Mendoza', item: 'Andamio Tubular', cant: 2, tipo: 'DEVOLUCION', hora: '08:15 AM' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-eco-gris-borde flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-tight text-eco-oscuro">
          Actividad Reciente
        </h3>
        <Clock size={16} className="text-eco-gris" />
      </div>

      <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto max-h-[500px]">
        
        {ultimosMovimientos.map((mov) => (
          <div 
            key={mov.id} 
            className="p-4 bg-eco-blanco border border-eco-gris-borde hover:border-eco-azul transition-colors duration-300 rounded-none group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 border ${
                mov.tipo === 'SALIDA' 
                  ? 'bg-orange-50 text-orange-700 border-orange-200' 
                  : 'bg-green-50 text-green-700 border-green-200'
              }`}>
                {mov.tipo === 'SALIDA' ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                {mov.tipo}
              </span>
              <span className="text-xs text-eco-gris font-medium">{mov.hora}</span>
            </div>
            
            <p className="font-semibold text-eco-oscuro text-sm group-hover:text-eco-azul transition-colors">
              {mov.cant}x {mov.item}
            </p>
            <p className="text-xs text-eco-gris mt-1 flex items-center gap-1">
              {mov.trabajador}
            </p>
          </div>
        ))}

        {ultimosMovimientos.length === 0 && (
          <div className="text-center p-8 text-eco-gris text-sm">
            No hay movimientos registrados hoy.
          </div>
        )}
      </div>
    </div>
  );
}