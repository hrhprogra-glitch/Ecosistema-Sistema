import { useState } from 'react';
import { X, Save, Loader2, MapPin, Phone, User, CreditCard } from 'lucide-react';
import { clientesService } from '../../services/supabase';
import type { Cliente } from '../../services/supabase';

// Interfaz local para incluir campos personalizados
interface ClienteExtendido extends Cliente {
  dni?: string;
}

interface Props {
  clienteEditando: ClienteExtendido | null;
  onClose: () => void;
  onSaved: () => void;
}

export const ClienteFormModal = ({ clienteEditando, onClose, onSaved }: Props) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre_cliente: clienteEditando?.nombre_cliente || '',
    dni: clienteEditando?.dni || '',
    telefono: clienteEditando?.telefono || '',
    direccion: clienteEditando?.direccion || '',
    ubicacion_link: clienteEditando?.ubicacion_link || '',
  });

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (clienteEditando?.id) {
        await clientesService.actualizar(clienteEditando.id, form);
      } else {
        await clientesService.crear(form);
      }
      onSaved();
    } catch (error) { 
      alert("Error al guardar."); 
    } finally { 
      setLoading(false); 
    }
  };

  const inputStyle = "w-full border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-800 outline-none focus:border-[#00B4D8] focus:bg-white transition-all rounded-xl";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              {clienteEditando ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24}/></button>
          </div>

          <form onSubmit={handleGuardar} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-4 text-slate-400"/>
                <input required className={`${inputStyle} pl-11`} value={form.nombre_cliente} onChange={e => setForm({...form, nombre_cliente: e.target.value.toUpperCase()})} placeholder="EJ: JUAN PÉREZ" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DNI / RUC</label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-4 top-4 text-slate-400"/>
                  <input className={`${inputStyle} pl-11`} value={form.dni} onChange={e => setForm({...form, dni: e.target.value})} placeholder="00000000" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-4 text-slate-400"/>
                  <input className={`${inputStyle} pl-11 font-mono`} value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="999888777" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección Principal</label>
              <input className={inputStyle} value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} placeholder="Ej: Av. Principal 123, Cieneguilla" />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Link de Google Maps</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-4 text-[#00B4D8]"/>
                <input className={`${inputStyle} pl-11 text-[#00B4D8]`} value={form.ubicacion_link} onChange={e => setForm({...form, ubicacion_link: e.target.value})} placeholder="https://maps.google.com/..." />
              </div>
            </div>

            <button disabled={loading} type="submit" className="w-full bg-[#00B4D8] hover:bg-[#0096b4] text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex justify-center items-center gap-2 shadow-lg shadow-[#00B4D8]/30 transition-all mt-4">
              {loading ? <Loader2 className="animate-spin" size={20}/> : <><Save size={20}/> Guardar Cliente</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};