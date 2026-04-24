// src/sesiones/almacen/index.tsx
import { useState } from 'react';
import { PackageSearch } from 'lucide-react';

// Importaciones cruciales de los componentes hijos
import FiltrosAlmacen from './components/FiltrosAlmacen';
import TablaInventario from './components/TablaInventario';
import ModalNuevoItem from './components/ModalNuevoItem';

export default function AlmacenSession() {
  // Control de estado para el Suavizado del Modal emergente
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-eco-oscuro uppercase tracking-tighter flex items-center gap-3">
            <PackageSearch size={28} className="text-eco-azul" />
            Almacén Master
          </h2>
          <p className="text-sm text-eco-gris mt-1">Gestión técnica de consumibles y activos.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-ecosistema"
        >
          + Nuevo Producto
        </button>
      </header>

      <div className="card-ecosistema p-1">
        <FiltrosAlmacen /> 
        <TablaInventario /> 
      </div>

      {/* Renderizado condicional del Modal (Capa Z superior) */}
      {isModalOpen && <ModalNuevoItem onClose={() => setIsModalOpen(false)} />}
      
    </div>
  );
}