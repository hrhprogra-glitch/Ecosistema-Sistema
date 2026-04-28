// src/sesiones/movimientos/index.tsx
import { ArrowLeftRight } from 'lucide-react';

// Importamos los componentes operativos
import FormularioMovimiento from './components/FormularioMovimiento';
import ResumenTemporal from './components/ResumenTemporal';

export default function MovimientosSession() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      
      {/* Anclaje visual Square: Borde lateral celeste grueso e ícono vibrante */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-l-4 border-eco-celeste pl-4">
        <div>
          <h2 className="text-2xl font-bold text-eco-oscuro uppercase tracking-tighter flex items-center gap-3">
            <ArrowLeftRight size={28} className="text-eco-celeste drop-shadow-sm" />
            Registro de Movimientos
          </h2>
          <p className="text-sm text-eco-gris mt-1">Punto de control para salidas, despachos y devoluciones operativas.</p>
        </div>
      </header>

      {/* Grid Arquitectónico (Square Design) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Columna Izquierda: Formulario (Ocupa 8 columnas de 12) */}
        <div className="lg:col-span-8 card-ecosistema p-0 bg-eco-blanco shadow-xl shadow-eco-oscuro/5">
          <FormularioMovimiento />
        </div>

        {/* Columna Derecha: Ticker de Actividad (Ocupa 4 columnas de 12) */}
        <div className="lg:col-span-4 card-ecosistema p-0 bg-eco-gris-claro">
          <ResumenTemporal />
        </div>

      </div>
    </div>
  );
}