import { useState, useEffect } from 'react';
import { clientesService } from '../../services/supabase'; 
import type { Cliente } from '../../services/supabase';
import { Search, Plus, Edit2, Trash2, Loader2, MapPin, ExternalLink, Phone, ArrowRight } from 'lucide-react';
import { ClienteFormModal } from './ClienteFormModal';

// Extendemos la interfaz para que TS reconozca los campos adicionales
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Directorio de Clientes</h2>
          <p className="text-sm text-slate-500 font-medium">Gestión de contactos y expedientes.</p>
        </div>
        <button 
          onClick={() => { setClienteSelect(null); setShowForm(true); }} 
          className="bg-[#00B4D8] hover:bg-[#0096b4] text-white px-5 py-2.5 flex items-center gap-2 rounded-xl font-bold text-xs uppercase shadow-lg shadow-[#00B4D8]/20"
        >
          <Plus size={18} /> Nuevo Cliente
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              placeholder="Buscar por nombre o DNI..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-sm font-bold outline-none focus:ring-2 ring-[#00B4D8]/20"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-4">Cliente</th>
                <th className="py-4 px-4">Teléfono</th>
                <th className="py-4 px-4">Ubicación</th>
                <th className="py-4 px-4">Historial</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#00B4D8]" /></td></tr>
              ) : filtrados.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-mono text-xs font-bold text-slate-400">CL-{String(c.id).padStart(4, '0')}</td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="font-black text-sm text-slate-800 uppercase">{c.nombre_cliente}</span>
                      <span className="text-[10px] text-slate-400">DNI: {c.dni || '---'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                      <Phone size={14} className="text-[#00B4D8]"/> {c.telefono || 'N/A'}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col max-w-[180px]">
                      <span className="text-xs text-slate-600 truncate font-medium">{c.direccion || 'Sin dirección'}</span>
                      {c.ubicacion_link && (
                        <a href={c.ubicacion_link} target="_blank" rel="noreferrer" className="text-[10px] text-[#00B4D8] font-black flex items-center gap-1 hover:underline">
                          <MapPin size={10}/> MAPS <ExternalLink size={10}/>
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <button 
                      onClick={() => onVerHistorial(c)} 
                      className="text-[#00B4D8] hover:text-[#0096b4] text-xs font-black uppercase flex items-center gap-1 group"
                    >
                      Ver Expediente <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setClienteSelect(c); setShowForm(true); }} className="p-2 text-slate-400 hover:text-[#00B4D8] rounded-lg hover:bg-[#E0F7FA] transition-colors"><Edit2 size={16}/></button>
                      <button onClick={() => eliminarCliente(c.id!)} className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"><Trash2 size={16}/></button>
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