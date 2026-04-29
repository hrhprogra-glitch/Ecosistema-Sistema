// src/sesiones/dashboard/index.tsx
import { LayoutDashboard } from 'lucide-react';

// Importamos los componentes del Dashboard
import KPICards from './components/KPICards';
import ChartsSection from './components/ChartsSection'; // Nueva sección visual
import AlertasStockTable from './components/AlertasStockTable';

export default function DashboardSession() {
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4 animate-in fade-in duration-700 pb-2">
      
      {/* Header Compacto (Square) */}
      <header className="border-l-4 border-eco-celeste pl-4 shrink-0">
        <h2 className="text-xl font-bold text-eco-oscuro uppercase tracking-tighter flex items-center gap-2">
          <LayoutDashboard size={24} className="text-eco-celeste drop-shadow-sm" />
          Panel de Control
        </h2>
      </header>

      {/* Tarjetas de Métricas: Fila superior estática */}
      <section className="shrink-0">
        <KPICards />
      </section>

      {/* Contenedor Grid (High Contrast & Suavizado): Gráficos y Tabla en la misma fila */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Gráficos ocupan 2 columnas (El componente ChartsSection ya tiene su propio grid interno) */}
        <section className="lg:col-span-2 h-full overflow-hidden animate-in slide-in-from-bottom-4 duration-1000">
          <ChartsSection />
        </section>

        {/* Tabla compacta como panel lateral ocupa 1 columna */}
        <section className="card-ecosistema p-0 bg-eco-blanco shadow-xl shadow-eco-oscuro/5 h-full flex flex-col overflow-hidden">
          <AlertasStockTable />
        </section>

      </div>
    </div>
  );
}