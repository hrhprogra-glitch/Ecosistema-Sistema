// src/sesiones/historial/index.tsx
import { History } from 'lucide-react';

// 1. Importamos los componentes que acabamos de crear
import PanelBusquedaFiltros from './components/PanelBusquedaFiltros';
import TablaHistorialGlobal from './components/TablaHistorialGlobal';

export default function HistorialSession() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      
      {/* Anclaje visual Square: Borde lateral celeste grueso e ícono vibrante */}
      <header className="border-l-4 border-eco-celeste pl-4">
        <h2 className="text-2xl font-bold text-eco-oscuro uppercase tracking-tighter flex items-center gap-3">
          <History size={28} className="text-eco-celeste drop-shadow-sm" />
          Auditoría y Retornos
        </h2>
        <p className="text-sm text-eco-gris mt-1">Trazabilidad completa de movimientos y devoluciones.</p>
      </header>

      {/* 2. Integramos los componentes en el contenedor Square */}
      <div className="card-ecosistema p-0 bg-eco-blanco shadow-xl shadow-eco-oscuro/5">
        <PanelBusquedaFiltros />
        <TablaHistorialGlobal />
      </div>
      
    </div>
  );
}