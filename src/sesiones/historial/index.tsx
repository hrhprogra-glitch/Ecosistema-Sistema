// src/sesiones/historial/index.tsx
import { History } from 'lucide-react';
import TablaHistorialGlobal from './components/TablaHistorialGlobal';

interface Props {
  onNavigate?: (tab: string) => void;
}

export default function HistorialSession({ onNavigate }: Props) {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-eco-blanco p-6 border-y border-r border-eco-gris-borde border-l-[12px] border-l-eco-oscuro rounded-none shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-eco-oscuro uppercase tracking-tighter flex items-center gap-3 italic">
            <History size={28} className="text-eco-celeste drop-shadow-sm" />
            Auditoría de Movimientos
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-eco-gris mt-1">Historial inmutable de transacciones</p>
        </div>
      </header>

      <div className="card-ecosistema p-0 border-0 bg-transparent shadow-none">
        {/* Inyectamos la función de navegación a la tabla */}
        <TablaHistorialGlobal onNavigate={onNavigate} />
      </div>

    </div>
  );
}