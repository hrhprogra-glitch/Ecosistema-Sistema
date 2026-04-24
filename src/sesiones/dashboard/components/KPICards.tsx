// src/sesiones/dashboard/components/KPICards.tsx
import { Wrench, AlertTriangle, ArrowLeftRight, Users } from 'lucide-react';

export default function KPICards() {
  // Datos mockeados de métricas generales
  const kpis = [
    { id: 1, titulo: 'Herramientas en Calle', valor: '12', icono: Wrench, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 2, titulo: 'Alertas de Stock', valor: '3', icono: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    { id: 3, titulo: 'Movimientos Hoy', valor: '24', icono: ArrowLeftRight, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    { id: 4, titulo: 'Personal Activo', valor: '45', icono: Users, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.id} className={`p-6 border ${kpi.border} bg-eco-blanco transition-all duration-300 hover:shadow-lg rounded-none group cursor-default flex items-center justify-between`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-eco-gris mb-1">
              {kpi.titulo}
            </p>
            <h4 className="text-3xl font-black text-eco-oscuro group-hover:scale-105 transition-transform origin-left">
              {kpi.valor}
            </h4>
          </div>
          <div className={`p-3 ${kpi.bg} ${kpi.color} rounded-none border ${kpi.border}`}>
            <kpi.icono size={24} />
          </div>
        </div>
      ))}
    </div>
  );
}