// src/sections/clientes/ListaClientes.tsx
import { useState, useEffect } from 'react';
import { clientesService } from '../../services/supabase'; 
import type { Cliente } from '../../services/supabase';
import { Search, Plus, Edit2, Trash2, Loader2, MapPin, ExternalLink,  ArrowRight, UserSquare2 } from 'lucide-react';
import { ClienteFormModal } from './ClienteFormModal';

interface ClienteExtendido extends Cliente {
  dni?: string;
}

interface ListaClientesProps {
  onVerHistorial: (cliente: Cliente) => void;
}

export const ListaClientes = ({ onVerHistorial }: ListaClientesProps) => {
  const [clientes, setClientes] = useState<ClienteExtendido[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [clienteSelect, setClienteSelect] = useState<ClienteExtendido | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await clientesService.listar();
      setClientes(data as ClienteExtendido[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const eliminarCliente = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este cliente?")) return;
    try {
      await clientesService.eliminar(id);
      setClientes(clientes.filter(c => c.id !== id));
    } catch (e) { alert("Error al eliminar"); }
  };

  const filtrados = clientes.filter(c => 
    c.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase()) || 
    (c.dni && c.dni.includes(busqueda))
  );

  return (
    <div className="w-full animate-in fade-in duration-300">
      {/* HEADER DE SECCIÓN - SQUARE STYLE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 border-l-8 border-[#00B4D8] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-[#1e293b] p-2">
            <UserSquare2 className="text-[#00B4D8]" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#1e293b]  tracking-tighter">Directorio de Clientes</h2>
            <p className="text-[10px] text-slate-400 font-bold  tracking-[0.2em] mt-1">Gestión de Cartera & Bandejas</p>
          </div>
        </div>
        <button 
          onClick={() => { setClienteSelect(null); setShowForm(true); }} 
          className="bg-[#00B4D8] text-white px-6 py-3 flex items-center gap-2 font-black text-[11px]  tracking-widest hover:bg-[#1e293b] transition-all shadow-md"
        >
          <Plus size={18} /> Registrar Cliente
        </button>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        {/* BUSCADOR - HIGH CONTRAST */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
          <div className="relative w-full md:w-96">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
  placeholder="Buscar por nombre o DNI..." 
  className="w-full bg-white border border-slate-300 py-3 pl-12 pr-4 text-[13px] font-black tracking-tight outline-none focus:border-[#00B4D8] transition-all"
  value={busqueda}
  onChange={e => setBusqueda(e.target.value)}
/>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead>
  <tr className="bg-white border-b-2 border-slate-100 text-[10px] font-black text-slate-400  tracking-[0.2em]">
    <th className="py-5 px-8">Código</th>
    <th className="py-5 px-4">Titular del Cliente</th>
    <th className="py-5 px-4">Contacto</th>
    <th className="py-5 px-4">E-mail</th>
    <th className="py-5 px-4">Ubicación</th>
    <th className="py-5 px-4 text-center">Bandejas</th>
  </tr>
</thead>
           <tbody className="divide-y divide-slate-50">
  {loading ? (
    /* Cambiado colSpan de 6 a 7 */
    <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#00B4D8]" size={32}/></td></tr>
  ) : filtrados.map((c) => (
    <tr key={c.id} className="hover:bg-[#f8fafc] transition-colors group">
                  <td className="py-5 px-8 font-mono text-[12px] font-black text-[#00B4D8]">CL-{String(c.id).padStart(4, '0')}</td>
                  <td className="py-5 px-4">
                    <div className="flex flex-col">
                      <span className="font-black text-[14px] text-[#1e293b]  group-hover:text-[#00B4D8] transition-colors">{c.nombre_cliente}</span>
                      <span className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">DNI/RUC: {c.dni || 'NO REGISTRADO'}</span>
                    </div>
                  </td>
                  {/* ... después de la celda de Contacto (Teléfono) */}
<td className="py-5 px-4">
  <div className="flex flex-col">
    <span className="text-[11px] text-[#1e293b] font-bold font-mono lowercase truncate max-w-[180px] block" title={c.email}>
      {c.email || 'sin correo'}
    </span>
  </div>
</td>
                  <td className="py-5 px-4">
                    <div className="flex flex-col max-w-[200px]">
                      <span className="text-[11px] text-slate-500 font-bold truncate" title={c.direccion}>{c.direccion || 'DIRECCIÓN NO ASIGNADA'}</span>
                      {c.ubicacion_link && (
                        <a href={c.ubicacion_link} target="_blank" rel="noreferrer" className="text-[9px] text-[#00B4D8] font-black flex items-center gap-1 hover:text-[#1e293b] mt-1 transition-colors">
                          <MapPin size={10}/> VER EN GOOGLE MAPS <ExternalLink size={10}/>
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="py-5 px-4 text-center">
  <button 
    onClick={() => onVerHistorial(c)} 
    className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e293b] text-white hover:bg-[#00B4D8] transition-all duration-300 group shadow-sm relative overflow-hidden"
  >
    {/* Línea decorativa lateral estilo Square */}
    <div className="absolute left-0 top-0 h-full w-1 bg-[#00B4D8] group-hover:bg-white transition-colors" />
    
    <span className="text-[10px] font-black  tracking-[0.15em] pl-1">
      Ver Bandeja
    </span>
    
    <ArrowRight 
      size={15} 
      className="text-[#00B4D8] group-hover:text-white group-hover:translate-x-1 transition-all" 
    />
  </button>
</td>
                  <td className="py-5 px-8 text-right">
                    <div className="flex justify-end gap-3  transition-opacity">
                      <button onClick={() => { setClienteSelect(c); setShowForm(true); }} className="p-2 text-slate-400 hover:text-[#00B4D8] transition-colors"><Edit2 size={16}/></button>
                      <button onClick={() => eliminarCliente(c.id!)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ClienteFormModal 
          clienteEditando={clienteSelect} 
          onClose={() => setShowForm(false)} 
          onSaved={() => { setShowForm(false); cargarDatos(); }} 
        />
      )}
    </div>
  );
};