// src/sections/clientes/ClienteFormModal.tsx
import { useState } from 'react';
import { X, Save, Loader2, MapPin, Phone, User, CreditCard, ShieldCheck, Mail } from 'lucide-react';
import { clientesService } from '../../services/supabase';
import type { Cliente } from '../../services/supabase';

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
    email: (clienteEditando as any)?.email || '',
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

  // Se eliminó la clase 'uppercase' de inputStyle para permitir visualización de minúsculas
  const inputStyle = "w-full border border-slate-300 bg-white p-4 text-[14px] font-black tracking-tight text-[#1e293b] outline-none focus:border-[#00B4D8] transition-all shadow-sm";
  const labelStyle = "text-[10px] font-black text-[#1e293b] tracking-[0.2em] mb-2 block ml-1";

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-[#1e293b]/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 border-b-8 border-[#00B4D8]">
        
        {/* MODAL HEADER */}
        <div className="p-8 bg-[#1e293b] text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="bg-[#00B4D8] p-2">
                <ShieldCheck className="text-[#1e293b]" size={22} />
             </div>
             <div>
               <h3 className="text-xl font-black tracking-tighter uppercase">
                 {clienteEditando ? 'Modificar Perfil' : 'Registro Maestro'}
               </h3>
               <p className="text-[9px] text-[#00B4D8] font-bold tracking-widest mt-0.5 uppercase">Cartera de Clientes Sistema Pro</p>
             </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-[#00B4D8] transition-colors"><X size={24}/></button>
        </div>

        <div className="p-8 bg-[#f8fafc]">
          <form onSubmit={handleGuardar} className="space-y-6">
            <div>
              <label className={labelStyle}>Titular del Cliente / Empresa</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                {/* Se quitó .toUpperCase() para permitir minúsculas */}
                <input 
                  required 
                  className={`${inputStyle} pl-12`} 
                  value={form.nombre_cliente} 
                  onChange={e => setForm({...form, nombre_cliente: e.target.value})} 
                  placeholder="Ej: Juan Pérez o Constructora S.A.C." 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={labelStyle}>Identificación (RUC/DNI)</label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input className={`${inputStyle} pl-12 font-mono`} value={form.dni} onChange={e => setForm({...form, dni: e.target.value})} placeholder="00000000" />
                </div>
              </div>
              <div>
                <label className={labelStyle}>Teléfono Central</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input className={`${inputStyle} pl-12 font-mono`} value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="999-000-111" />
                </div>
              </div>
            </div>

            <div>
              <label className={labelStyle}>Dirección Operativa</label>
              {/* Se quitó .toUpperCase() para permitir minúsculas */}
              <input 
                className={inputStyle} 
                value={form.direccion} 
                onChange={e => setForm({...form, direccion: e.target.value})} 
                placeholder="Ej: Av. Las Palmeras 123, Cieneguilla" 
              />
            </div>

            <div>
              <label className={labelStyle}>Correo Electrónico</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input 
                  type="email"
                  className={`${inputStyle} pl-12 font-mono lowercase`} 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value.toLowerCase()})} 
                  placeholder="ejemplo@correo.com" 
                />
              </div>
            </div>

            <div>
              <label className={labelStyle}>Coordenadas de Maps (Link)</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00B4D8]"/>
                <input className={`${inputStyle} pl-12 text-[#00B4D8] font-mono lowercase`} value={form.ubicacion_link} onChange={e => setForm({...form, ubicacion_link: e.target.value})} placeholder="https://maps.google.com/..." />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
               <button type="button" onClick={onClose} className="flex-1 bg-white border border-slate-300 text-[#1e293b] py-4 font-black text-[11px] tracking-widest hover:bg-slate-50 transition-all uppercase">
                  Cancelar
               </button>
               <button disabled={loading} type="submit" className="flex-[2] bg-[#00B4D8] text-white py-4 font-black text-[11px] tracking-widest hover:bg-[#1e293b] transition-all flex justify-center items-center gap-2 shadow-lg shadow-[#00B4D8]/20 uppercase">
                 {loading ? <Loader2 className="animate-spin" size={18}/> : <><Save size={18}/> Confirmar Datos</>}
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};