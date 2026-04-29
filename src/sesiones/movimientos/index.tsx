import { ArrowLeftRight } from 'lucide-react';
import FormularioMovimiento from './components/FormularioMovimiento';
import ResumenTemporal from './components/ResumenTemporal';

export default function MovimientosSession() {
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4 animate-in fade-in duration-700 pb-2">
      
      {/* Header Compacto (Square) */}
      <header className="border-l-4 border-eco-celeste pl-4 shrink-0">
        <h2 className="text-xl font-bold text-eco-oscuro uppercase tracking-tighter flex items-center gap-2">
          <ArrowLeftRight size={24} className="text-eco-celeste drop-shadow-sm" />
          Registro Rápido de Movimientos
        </h2>
      </header>

      {/* Contenedor Grid (High Contrast & Suavizado): Formulario vs Resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Formulario (POS Style) ocupa 5 columnas */}
        <section className="lg:col-span-5 h-full overflow-y-auto custom-scrollbar">
          <FormularioMovimiento />
        </section>

        {/* Resumen/Lote ocupa 7 columnas para dar aire a la tabla */}
        <section className="lg:col-span-7 h-full flex flex-col overflow-hidden">
          <ResumenTemporal />
        </section>

      </div>
    </div>
  );
}