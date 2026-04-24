// src/sesiones/personal/components/ModalNuevoTrabajador.tsx
import { X } from 'lucide-react';

interface ModalProps {
  onClose: () => void;
}

export default function ModalNuevoTrabajador({ onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-eco-oscuro/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="card-ecosistema w-full max-w-lg bg-eco-blanco p-0 flex flex-col shadow-2xl shadow-eco-oscuro/10 scale-in-95 duration-300">
        
        <div className="flex justify-between items-center p-6 border-b border-eco-gris-borde bg-eco-gris-claro">
          <h3 className="text-xl font-bold uppercase tracking-tighter text-eco-oscuro">Registrar Personal</h3>
          <button onClick={onClose} className="text-eco-gris hover:text-red-500 transition-colors duration-300">
            <X size={24} />
          </button>
        </div>

        <form className="p-6 flex flex-col gap-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-eco-gris uppercase tracking-wider">Documento de Identidad (DNI/CE)</label>
            <input type="text" placeholder="Ej: 71234567" className="input-ecosistema" required />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-eco-gris uppercase tracking-wider">Nombre Completo</label>
            <input type="text" placeholder="Ej: Juan Pérez" className="input-ecosistema" required />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-eco-gris uppercase tracking-wider">Cargo / Rol</label>
            <input type="text" placeholder="Ej: Operario de Maquinaria" className="input-ecosistema" required />
          </div>

          <div className="flex justify-end gap-4 mt-4 pt-6 border-t border-eco-gris-borde">
            <button type="button" onClick={onClose} className="px-6 py-3 font-medium text-eco-gris hover:bg-eco-gris-claro transition-colors border border-transparent">
              Cancelar
            </button>
            <button type="submit" className="btn-ecosistema">
              Registrar Trabajador
            </button>
          </div>
        </form>
        
      </div>
    </div>
  );
}