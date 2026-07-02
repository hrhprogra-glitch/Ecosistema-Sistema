// src/sesiones/personal/index.tsx
import { useState, useCallback } from 'react';
import { Users } from 'lucide-react';

import TablaPersonal from './components/TablaPersonal';
import ModalNuevoTrabajador from './components/ModalNuevoTrabajador';

export default function PersonalSession() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trabajadorAEditar, setTrabajadorAEditar] = useState<any | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleAbrirModal = (trabajador: any | null = null) => {
    setTrabajadorAEditar(trabajador);
    setIsModalOpen(true);
  };

  const handleCerrarModal = () => {
    setIsModalOpen(false);
    setTrabajadorAEditar(null);
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-eco-blanco p-6 border-y border-r border-eco-gris-borde border-l-[12px] border-l-eco-oscuro rounded-none shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-eco-oscuro uppercase tracking-tighter flex items-center gap-3 italic">
            <Users size={28} className="text-eco-celeste drop-shadow-sm" />
            Nómina de Personal
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-eco-gris mt-1">Control de trabajadores con acceso a inventario.</p>
        </div>
        <button 
          onClick={() => handleAbrirModal(null)} 
          className="mt-4 md:mt-0 bg-eco-oscuro text-eco-blanco px-8 py-4 font-black text-[10px] uppercase tracking-widest hover:bg-eco-celeste transition-all rounded-none shadow-none"
        >
          + Agregar Trabajador
        </button>
      </header>

      <div className="card-ecosistema p-0 border-0 bg-transparent">
        <TablaPersonal 
          refreshKey={refreshKey} 
          onEdit={handleAbrirModal} 
        />
      </div>

      {isModalOpen && (
        <ModalNuevoTrabajador 
          trabajadorAEditar={trabajadorAEditar}
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