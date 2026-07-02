// src/sesiones/personal/components/ModalNuevoTrabajador.tsx
import { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { trabajadoresService } from '../../../db/supabase';

interface ModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  trabajadorAEditar?: any | null; // Data pre-cargada si es modo edición
}

export default function ModalNuevoTrabajador({ onClose, onSuccess, trabajadorAEditar }: ModalProps) {
  const [procesando, setProcesando] = useState(false);
  
  // Si existe el trabajador, se inyectan sus datos; sino, en blanco.
  const [formData, setFormData] = useState({
    documento_identidad: trabajadorAEditar?.documento_identidad || '',
    nombre_completo: trabajadorAEditar?.nombre_completo || '',
    cargo: trabajadorAEditar?.cargo || ''
  });

  const isModoEdicion = !!trabajadorAEditar;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcesando(true);
    try {
      if (isModoEdicion) {
        // MODO ACTUALIZACIÓN
        await trabajadoresService.actualizar(trabajadorAEditar.id, {
          documento_identidad: formData.documento_identidad,
          nombre_completo: formData.nombre_completo,
          cargo: formData.cargo
        });
      } else {
        // MODO INSERCIÓN
        await trabajadoresService.crear({
          ...formData,
          estado: 'ACTIVO'
        });
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (error: any) {
      console.error(error);
      alert('Error de Integridad: Verifica que el DNI no esté duplicado en la matriz.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-eco-oscuro/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="card-ecosistema w-full max-w-lg bg-eco-blanco p-0 flex flex-col shadow-2xl scale-in-95 duration-300 rounded-none border-t-4 border-eco-celeste">
        
        <div className="flex justify-between items-center p-6 border-b border-eco-gris-borde bg-eco-gris-claro">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-eco-oscuro">
              {isModoEdicion ? 'Actualizar Ficha Operativa' : 'Registrar Personal'}
            </h3>
            <p className="text-[10px] text-eco-gris font-bold uppercase tracking-widest mt-1">
              {isModoEdicion ? 'Modificación de credenciales' : 'Ingreso al padrón operativo'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-eco-gris hover:text-red-500 transition-colors duration-300">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-eco-oscuro uppercase tracking-[0.2em]">Documento de Identidad (DNI/CE)</label>
            <input 
              type="text" 
              required
              value={formData.documento_identidad}
              onChange={(e) => setFormData({...formData, documento_identidad: e.target.value})}
              placeholder="Ej: 71234567" 
              className="w-full h-12 bg-eco-gris-claro border border-eco-gris-borde rounded-none px-4 text-[13px] font-bold text-eco-oscuro outline-none focus:border-eco-celeste focus:bg-eco-blanco transition-all shadow-none" 
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-eco-oscuro uppercase tracking-[0.2em]">Nombre Completo</label>
            <input 
              type="text" 
              required
              value={formData.nombre_completo}
              onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
              placeholder="Ej: Juan Pérez" 
              className="w-full h-12 bg-eco-gris-claro border border-eco-gris-borde rounded-none px-4 text-[13px] font-bold text-eco-oscuro outline-none focus:border-eco-celeste focus:bg-eco-blanco transition-all shadow-none" 
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-eco-oscuro uppercase tracking-[0.2em]">Cargo / Especialidad</label>
            <input 
              type="text" 
              required
              value={formData.cargo}
              onChange={(e) => setFormData({...formData, cargo: e.target.value})}
              placeholder="Ej: Operario de Maquinaria" 
              className="w-full h-12 bg-eco-gris-claro border border-eco-gris-borde rounded-none px-4 text-[13px] font-bold text-eco-oscuro outline-none focus:border-eco-celeste focus:bg-eco-blanco transition-all shadow-none" 
            />
          </div>

          <div className="flex justify-end gap-4 mt-4 pt-6 border-t border-eco-gris-borde">
            <button type="button" onClick={onClose} className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-eco-gris hover:text-eco-oscuro transition-colors rounded-none">
              Abortar
            </button>
            <button disabled={procesando} type="submit" className="bg-eco-oscuro text-eco-blanco px-8 py-3 font-black text-[10px] uppercase tracking-widest hover:bg-eco-celeste transition-all rounded-none flex items-center justify-center gap-2 disabled:opacity-50">
              {procesando ? <Loader2 size={16} className="animate-spin" /> : (isModoEdicion ? <Save size={16}/> : null)}
              {isModoEdicion ? 'Guardar Cambios' : 'Registrar Trabajador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}