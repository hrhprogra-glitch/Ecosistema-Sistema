// src/sesiones/almacen/components/ModalNuevoItem.tsx
import { X } from 'lucide-react';

interface ModalProps {
  onClose: () => void;
}

export default function ModalNuevoItem({ onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-eco-oscuro/40 backdrop-blur-sm animate-in fade-in duration-300">
      
      {/* Contenedor del Modal (Square & Flat) */}
      <div className="card-ecosistema w-full max-w-2xl bg-eco-blanco p-0 flex flex-col shadow-2xl shadow-eco-oscuro/10 scale-in-95 duration-300">
        
        {/* Header del Modal */}
        <div className="flex justify-between items-center p-6 border-b border-eco-gris-borde bg-eco-gris-claro">
          <h3 className="text-xl font-bold uppercase tracking-tighter text-eco-oscuro">
            Registrar Nuevo Ítem
          </h3>
          <button 
            onClick={onClose}
            className="text-eco-gris hover:text-red-500 transition-colors duration-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <form className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-eco-gris uppercase tracking-wider">Código SKU</label>
              <input type="text" placeholder="Ej: HER-005" className="input-ecosistema" required />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-eco-gris uppercase tracking-wider">Tipo de Ítem</label>
              <select className="input-ecosistema" required>
                <option value="CONSUMIBLE">Consumible</option>
                <option value="HERRAMIENTA">Herramienta</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-eco-gris uppercase tracking-wider">Nombre del Ítem</label>
              <input type="text" placeholder="Ej: Taladro de Banco..." className="input-ecosistema" required />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-eco-gris uppercase tracking-wider">Stock Inicial</label>
              <input type="number" min="0" defaultValue="0" className="input-ecosistema" required />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-eco-gris uppercase tracking-wider">Stock Mínimo (Alerta)</label>
              <input type="number" min="0" defaultValue="0" className="input-ecosistema" required />
            </div>

          </div>

          {/* Footer del Modal */}
          <div className="flex justify-end gap-4 mt-4 pt-6 border-t border-eco-gris-borde">
            <button type="button" onClick={onClose} className="px-6 py-3 font-medium text-eco-gris hover:bg-eco-gris-claro transition-colors border border-transparent">
              Cancelar
            </button>
            <button type="submit" className="btn-ecosistema">
              Guardar en Inventario
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}