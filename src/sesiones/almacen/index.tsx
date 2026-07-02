// src/sesiones/almacen/index.tsx
import { useState, useCallback } from 'react';
import { PackageSearch } from 'lucide-react';

import FiltrosAlmacen from './components/FiltrosAlmacen';
import TablaInventario from './components/TablaInventario';
import ModalNuevoItem from './components/ModalNuevoItem';
import type { InventarioItem } from './types';

export default function AlmacenSession() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemAEditar, setItemAEditar] = useState<InventarioItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleAbrirModal = (item: InventarioItem | null = null) => {
    setItemAEditar(item);
    setIsModalOpen(true);
  };

  const handleCerrarModal = () => {
    setIsModalOpen(false);
    setItemAEditar(null);
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-eco-blanco p-6 border-y border-r border-eco-gris-borde border-l-[12px] border-l-eco-oscuro rounded-none shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-eco-oscuro uppercase tracking-tighter flex items-center gap-3 italic">
            <PackageSearch size={28} className="text-eco-celeste drop-shadow-sm" />
            Almacén Master
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-eco-gris mt-1">Gestión técnica de consumibles y activos.</p>
        </div>
        <button 
          onClick={() => handleAbrirModal(null)}
          className="mt-4 md:mt-0 bg-eco-oscuro text-eco-blanco px-8 py-4 font-black text-[10px] uppercase tracking-widest hover:bg-eco-celeste transition-all rounded-none shadow-none"
        >
          + Nuevo Producto
        </button>
      </header>

      <div className="card-ecosistema p-1 border-0 bg-transparent shadow-none">
        <FiltrosAlmacen /> 
        <TablaInventario 
          refreshKey={refreshKey}
          onEdit={handleAbrirModal}
        /> 
      </div>

      {isModalOpen && (
        <ModalNuevoItem 
          itemAEditar={itemAEditar}
          onClose={handleCerrarModal} 
          onSuccess={() => {
            handleCerrarModal();
            triggerRefresh();
          }}
        />
      )}
      
    </div>
  );
}