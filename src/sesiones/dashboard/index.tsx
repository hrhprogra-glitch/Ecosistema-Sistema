// src/sesiones/dashboard/index.tsx
import { LayoutDashboard } from 'lucide-react';

// Importamos los componentes del Dashboard
import KPICards from './components/KPICards';
import AlertasStockTable from './components/AlertasStockTable';

export default function DashboardSession() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      
      <header>
        <h2 className="text-2xl font-bold text-eco-oscuro uppercase tracking-tighter flex items-center gap-3">
          <LayoutDashboard size={28} className="text-eco-azul" />
          Panel de Control
        </h2>
        <p className="text-sm text-eco-gris mt-1">Resumen operativo, métricas en tiempo real y alertas críticas.</p>
      </header>

      {/* Tarjetas de Métricas (Square Grid) */}
      <section>
        <KPICards />
      </section>

      {/* Tabla de Alertas */}
      <section className="card-ecosistema p-0 bg-eco-blanco shadow-xl shadow-eco-oscuro/5">
        <AlertasStockTable />
      </section>

    </div>
  );
}