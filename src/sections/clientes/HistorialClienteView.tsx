import { useState, useEffect } from 'react';
import { finanzasService, obrasService, clientesService } from '../../services/supabase';
import type { Cliente } from '../../services/supabase';
import { Loader2, History, Search, ArrowUpRight, ArrowDownRight, FileText, User, X, Box, Calculator } from 'lucide-react';

interface Props {
  clienteInicial: Cliente | null;
  onLimpiarFiltro: () => void;
}

export const HistorialGeneralView = ({ clienteInicial, onLimpiarFiltro }: Props) => {
  const [loading, setLoading] = useState(true);
  const [historial, setHistorial] = useState<any[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtroClienteId, setFiltroClienteId] = useState<string>(clienteInicial?.id?.toString() || "");
  const [itemSeleccionado, setItemSeleccionado] = useState<any | null>(null);

  // Sincronizar el filtro si el cliente inicial cambia desde el componente padre
  useEffect(() => {
    if (clienteInicial) {
      setFiltroClienteId(clienteInicial.id?.toString() || "");
    }
  }, [clienteInicial]);

  useEffect(() => {
    const cargarBase = async () => {
      setLoading(true);
      try {
        const [cots, obras, clis] = await Promise.all([
          finanzasService.listarCotizacionesTodas(),
          obrasService.listar(),
          clientesService.listar()
        ]);
        setClientes(clis);

        const timeline = [
          ...cots.map((c: any) => ({
            ...c, 
            tipo: 'COTIZACIÓN', 
            fecha: new Date(c.created_at || c.fecha_emision), 
            monto: c.monto_total || 0,
            items_detalle: c.detalles || []
          })),
          ...obras.map((o: any) => {
            const salidas = o.materiales_asignados?.reduce((acc: number, m: any) => acc + (Number(m.cantidad || 0) * Number(m.precioUnit || 0)), 0) || 0;
            const devoluciones = o.devoluciones?.reduce((acc: number, d: any) => acc + (Number(d.cantidad || 0) * Number(d.precioUnit || 0)), 0) || 0;
            return {
              ...o, 
              tipo: 'PROYECTO', 
              fecha: new Date(o.created_at || o.fecha_inicio), 
              monto: (salidas - devoluciones) || 0,
              detalles: { 
                salidas, 
                devoluciones,
                codigo: o.codigo_obra,
                lista_salidas: o.materiales_asignados || [],
                lista_devoluciones: o.devoluciones || []
              }
            };
          })
        ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

        setHistorial(timeline);
      } catch (e) { 
        console.error("Error cargando historial:", e); 
      } finally { 
        setLoading(false); 
      }
    };
    cargarBase();
  }, []);

  const datosFiltrados = filtroClienteId 
    ? historial.filter(h => h.cliente_id?.toString() === filtroClienteId)
    : historial;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* HEADER DE FILTROS */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#E0F7FA] p-2.5 rounded-2xl">
            <History className="text-[#00B4D8]" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Expediente Maestro</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Control consolidado de clientes y proyectos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 w-full md:w-auto">
          <User size={16} className="text-slate-400" />
          <select 
            className="bg-transparent text-sm font-bold outline-none text-slate-700 min-w-[200px] cursor-pointer"
            value={filtroClienteId}
            onChange={(e) => {
              const valor = e.target.value;
              setFiltroClienteId(valor);
              if (valor === "") onLimpiarFiltro();
            }}
          >
            <option value="">TODOS LOS CLIENTES</option>
            {clientes.map(c => <option key={c.id} value={c.id?.toString()}>{c.nombre_cliente}</option>)}
          </select>
        </div>
      </div>

      {/* LISTADO DE HITOS */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-3xl p-20 flex flex-col items-center border border-slate-100 shadow-sm">
            <Loader2 className="animate-spin text-[#00B4D8] mb-4" size={40}/>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sincronizando línea de tiempo comercial...</p>
          </div>
        ) : datosFiltrados.length > 0 ? (
          datosFiltrados.map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center hover:border-[#00B4D8]/40 hover:shadow-md transition-all group">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                    {item.fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${item.tipo === 'COTIZACIÓN' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {item.tipo}
                  </span>
                </div>
                <h4 className="text-lg font-black text-slate-800 uppercase">
                  {item.tipo === 'PROYECTO' ? `${item.detalles?.codigo} - ${item.nombre_obra}` : `Presupuesto Inicial Base`}
                </h4>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">
                  {clientes.find(c => c.id === item.cliente_id)?.nombre_cliente || 'Cliente no registrado'}
                </p>
              </div>
              
              <div className="flex items-center gap-8 mt-4 md:mt-0">
                {item.detalles && (
                  <div className="flex gap-4 border-r border-slate-100 pr-6">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-300 uppercase">Salidas</p>
                      <p className="text-xs font-bold text-rose-500">S/ {Number(item.detalles.salidas || 0).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-300 uppercase">Devols.</p>
                      <p className="text-xs font-bold text-emerald-500">S/ {Number(item.detalles.devoluciones || 0).toFixed(2)}</p>
                    </div>
                  </div>
                )}
                <div className="text-right min-w-[140px]">
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">Inversión Real Final</span>
                  <span className="text-xl font-black text-slate-900 font-mono tracking-tighter">
                    S/ {Number(item.monto || 0).toFixed(2)}
                  </span>
                </div>
                <button 
                  onClick={() => setItemSeleccionado(item)}
                  className="bg-slate-50 p-3 rounded-xl text-slate-400 hover:text-[#00B4D8] hover:bg-[#E0F7FA] transition-all"
                  title="Ver Detalle Word"
                >
                  <FileText size={22} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <History size={40} className="mx-auto text-slate-300 mb-4 opacity-30" />
            <p className="text-slate-400 font-bold uppercase text-xs">No se encontraron movimientos registrados</p>
          </div>
        )}
      </div>

      {/* MODAL DETALLADO (ESTILO WORD) */}
      {itemSeleccionado && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                  <FileText className="text-[#00B4D8]" size={28} /> Detalle de Liquidación Final
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase mt-1">
                  Expediente: {clientes.find(c => c.id === itemSeleccionado.cliente_id)?.nombre_cliente}
                </p>
              </div>
              <button onClick={() => setItemSeleccionado(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                <X size={28} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              {/* RESUMEN ANALÍTICO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col items-center text-center">
                  <Box className="text-[#00B4D8] mb-3" size={24} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salidas de Almacén</span>
                  <span className="text-xl font-black text-slate-800 font-mono">S/ {Number(itemSeleccionado.detalles?.salidas || itemSeleccionado.monto).toFixed(2)}</span>
                </div>
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col items-center text-center">
                  <History className="text-emerald-500 mb-3" size={24} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retorno Devoluciones</span>
                  <span className="text-xl font-black text-emerald-600 font-mono">S/ {Number(itemSeleccionado.detalles?.devoluciones || 0).toFixed(2)}</span>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl shadow-xl flex flex-col items-center text-center">
                  <Calculator className="text-[#00B4D8] mb-3" size={24} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inversión Neta Final</span>
                  <span className="text-xl font-black text-white font-mono">S/ {Number(itemSeleccionado.monto).toFixed(2)}</span>
                </div>
              </div>

              {/* DETALLE TABULAR */}
              <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3">
                  <div className="w-8 h-px bg-[#00B4D8]"></div> Movimientos de Materiales
                </h4>
                
                <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="py-4 px-6 text-left">Descripción del Recurso</th>
                        <th className="py-4 px-4 text-center">Cant.</th>
                        <th className="py-4 px-4 text-right">P. Unitario</th>
                        <th className="py-4 px-6 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-bold text-slate-600">
                      {/* Mostrar items (Salidas o Items de Cotización) */}
                      {(itemSeleccionado.tipo === 'COTIZACIÓN' ? itemSeleccionado.items_detalle : itemSeleccionado.detalles?.lista_salidas).map((mat: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 uppercase text-[11px]">
                          <td className="py-4 px-6">{mat.nombre || mat.descripcion}</td>
                          <td className="py-4 px-4 text-center">{mat.cantidad}</td>
                          <td className="py-4 px-4 text-right">S/ {Number(mat.precioUnit || mat.precio).toFixed(2)}</td>
                          <td className="py-4 px-6 text-right text-slate-900 font-mono">S/ {(mat.cantidad * (mat.precioUnit || mat.precio)).toFixed(2)}</td>
                        </tr>
                      ))}
                      {/* Si hay devoluciones, restarlas visualmente */}
                      {itemSeleccionado.detalles?.lista_devoluciones?.map((dev: any, i: number) => (
                        <tr key={`dev-${i}`} className="bg-emerald-50/30 text-emerald-600 uppercase text-[11px]">
                          <td className="py-4 px-6 flex items-center gap-2"><ArrowDownRight size={14}/> DEVOLUCIÓN: {dev.nombre}</td>
                          <td className="py-4 px-4 text-center">-{dev.cantidad}</td>
                          <td className="py-4 px-4 text-right">S/ {Number(dev.precioUnit).toFixed(2)}</td>
                          <td className="py-4 px-6 text-right font-mono">- S/ {(dev.cantidad * dev.precioUnit).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
               <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Estado de Cuenta Final</span>
                  <span className="px-4 py-1 bg-[#00B4D8] rounded-full text-[10px] font-black uppercase tracking-widest">{itemSeleccionado.estado || 'LIQUIDADO'}</span>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Neto Percibido</p>
                  <p className="text-4xl font-black font-mono tracking-tighter text-[#00B4D8]">S/ {Number(itemSeleccionado.monto).toFixed(2)}</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};