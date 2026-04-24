// src/sesiones/personal/index.tsx
import { useState } from 'react';
import { Users } from 'lucide-react';

// Importamos los componentes (evitando el error anterior)
import TablaPersonal from './components/TablaPersonal';
import ModalNuevoTrabajador from './components/ModalNuevoTrabajador';

export default function PersonalSession() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-eco-oscuro uppercase tracking-tighter flex items-center gap-3">
            <Users size={28} className="text-eco-azul" />
            Nómina de Personal
          </h2>
          <p className="text-sm text-eco-gris mt-1">Control de trabajadores con acceso a inventario.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="btn-ecosistema"
        >
          + Agregar Trabajador
        </button>
      </header>

      <div className="card-ecosistema p-1">
        <TablaPersonal />
      </div>

      {isModalOpen && <ModalNuevoTrabajador onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}