// src/sections/clientes/HistorialClienteView.tsx
import { useState, useEffect } from 'react';
import { finanzasService, obrasService, clientesService } from '../../services/supabase';
import type { Cliente } from '../../services/supabase';
import { Loader2, History,FileText, User, X, Box, Calculator, LayoutGrid, ChevronDown } from 'lucide-react';

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

  useEffect(() => {
    if (clienteInicial) setFiltroClienteId(clienteInicial.id?.toString() || "");
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
            ...c, tipo: 'COTIZACIÓN', fecha: new Date(c.created_at || c.fecha_emision), 
            monto: c.monto_total || 0, items_detalle: c.detalles || []
          })),
          ...obras.map((o: any) => {
            const salidas = o.materiales_asignados?.reduce((acc: number, m: any) => acc + (Number(m.cantidad || 0) * Number(m.precioUnit || 0)), 0) || 0;
            const devoluciones = o.devoluciones?.reduce((acc: number, d: any) => acc + (Number(d.cantidad || 0) * Number(d.precioUnit || 0)), 0) || 0;
            return {
              ...o, tipo: 'PROYECTO', fecha: new Date(o.created_at || o.fecha_inicio), 
              monto: (salidas - devoluciones) || 0,
              detalles: { 
                salidas, devoluciones, codigo: o.codigo_obra,
                lista_salidas: o.materiales_asignados || [],
                lista_devoluciones: o.devoluciones || []
              }
            };
          })
        ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
        setHistorial(timeline);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    cargarBase();
  }, []);

  const datosFiltrados = filtroClienteId ? historial.filter(h => h.cliente_id?.toString() === filtroClienteId) : historial;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER: BLANCO CON TÍTULO MEDIO Y SELECTOR DECORADO */}
      <div className="bg-white p-6 border border-slate-200 border-b-4 border-b-[#00B4D8] flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-white p-2.5 border border-[#00B4D8]">
            <History className="text-[#00B4D8]" size={24} />
          </div>
          <div className="text-left">
            {/* TÍTULO EN TAMAÑO MEDIO (PUNTO MEDIO) */}
            <h2 className="text-xl font-black text-[#334155] uppercase tracking-tight italic">Expediente Maestro</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Archivo técnico consolidado</p>
          </div>
        </div>
        
        {/* DESPLEGABLE DECORADO */}
        <div className="relative group w-full md:w-auto">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none border-r border-slate-200 pr-3">
            <User size={16} className="text-[#00B4D8]" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden lg:inline">CLIENTE:</span>
          </div>
          <select 
            className="w-full md:w-[320px] bg-white border-2 border-slate-200 hover:border-[#00B4D8] pl-28 pr-10 py-3.5 text-[11px] font-black uppercase tracking-wider outline-none text-[#334155] cursor-pointer appearance-none transition-all shadow-sm rounded-none"
            value={filtroClienteId}
            onChange={(e) => {
              const val = e.target.value;
              setFiltroClienteId(val);
              if (val === "") onLimpiarFiltro();
            }}
          >
            <option value="">TODOS LOS REGISTROS</option>
            {clientes.map(c => <option key={c.id} value={c.id?.toString()} className="font-bold py-2">{c.nombre_cliente}</option>)}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown size={16} className="text-[#00B4D8]" />
          </div>
        </div>
      </div>

      {/* LÍNEA DE TIEMPO: CUADROS BLANCOS */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-24 flex flex-col items-center border border-slate-200">
            <Loader2 className="animate-spin text-[#00B4D8] mb-4" size={40}/>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando base de datos...</p>
          </div>
        ) : datosFiltrados.length > 0 ? (
          datosFiltrados.map((item, idx) => (
            <div key={idx} className="bg-white border-l-[10px] border-[#00B4D8] border-r border-t border-b border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center hover:bg-[#f8fafc] transition-all group shadow-sm">
              <div className="flex-1 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[11px] font-black text-[#334155] bg-slate-50 px-2 py-1 border border-slate-200 font-mono tracking-tighter">
                    {item.fecha.toLocaleDateString('es-PE')}
                  </span>
                  <span className={`text-[9px] font-black px-2 py-1 uppercase tracking-widest border ${item.tipo === 'COTIZACIÓN' ? 'border-blue-200 text-blue-500 bg-blue-50' : 'border-emerald-200 text-emerald-500 bg-emerald-50'}`}>
                    {item.tipo}
                  </span>
                </div>
                <h4 className="text-lg font-black text-[#334155] uppercase tracking-tighter group-hover:text-[#00B4D8] transition-colors italic">
                  {item.tipo === 'PROYECTO' ? `${item.detalles?.codigo || 'OBRA'} - ${item.nombre_obra}` : `Presupuesto COT-${String(item.id).padStart(4, '0')}`}
                </h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">
                  RESPONSABLE: {clientes.find(c => c.id === item.cliente_id)?.nombre_cliente}
                </p>
              </div>
              
              <div className="flex items-center gap-8 mt-4 md:mt-0">
                <div className="text-right min-w-[140px] border-r border-slate-100 pr-8">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-0.5">Inversión Final</span>
                  <span className="text-xl font-black text-[#334155] font-mono tracking-tighter">
                    S/ {Number(item.monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <button onClick={() => setItemSeleccionado(item)} className="bg-white border border-slate-200 p-3.5 text-slate-400 hover:text-[#00B4D8] hover:border-[#00B4D8] transition-all shadow-sm">
                  <FileText size={22} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-32 text-center bg-white border border-dashed border-slate-300">
             <LayoutGrid size={48} className="mx-auto text-slate-100 mb-4" />
             <p className="text-slate-300 font-black uppercase text-[11px] tracking-[0.4em]">Sin registros maestros</p>
          </div>
        )}
      </div>

      {/* MODAL DETALLE: ESTILO LIQUIDACIÓN SUAVIZADA */}
      {itemSeleccionado && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[95vh] shadow-2xl overflow-hidden flex flex-col border border-slate-200 border-b-8 border-b-[#00B4D8] animate-in zoom-in-95">
            <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-4 text-left">
                <div className="bg-white border border-[#00B4D8] p-2">
                   <FileText size={24} className="text-[#00B4D8]" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#334155] uppercase tracking-tighter italic">Liquidación Técnica</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Titular: {clientes.find(c => c.id === itemSeleccionado.cliente_id)?.nombre_cliente}</p>
                </div>
              </div>
              <button onClick={() => setItemSeleccionado(null)} className="p-2 text-slate-300 hover:text-[#00B4D8] transition-colors"><X size={28} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-white">
              {/* BLOQUES BLANCOS CON BORDES SUAVES */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 p-6 flex flex-col items-center text-center">
                  <Box className="text-[#00B4D8] mb-3" size={24} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Materiales</span>
                  <span className="text-lg font-black text-[#334155] font-mono">S/ {Number(itemSeleccionado.detalles?.salidas || itemSeleccionado.monto).toFixed(2)}</span>
                </div>
                <div className="bg-white border border-slate-200 p-6 flex flex-col items-center text-center">
                  <History className="text-emerald-500 mb-3" size={24} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Crédito Retorno</span>
                  <span className="text-lg font-black text-emerald-600 font-mono">S/ {Number(itemSeleccionado.detalles?.devoluciones || 0).toFixed(2)}</span>
                </div>
                <div className="bg-[#f8fafc] border border-[#00B4D8] p-6 flex flex-col items-center text-center">
                  <Calculator className="text-[#00B4D8] mb-3" size={24} />
                  <span className="text-[10px] font-black text-[#00B4D8] uppercase tracking-widest">Saldo Final</span>
                  <span className="text-2xl font-black text-[#334155] font-mono">S/ {Number(itemSeleccionado.monto).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-6 text-left">
                <h4 className="text-[10px] font-black text-[#334155] uppercase tracking-[0.3em] flex items-center gap-3">
                  <div className="w-10 h-1 bg-[#00B4D8]"></div> Detalle de Insumos
                </h4>
                <div className="bg-white border border-slate-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="py-4 px-6 text-left">Descripción</th>
                        <th className="py-4 px-4 text-center">Cant.</th>
                        <th className="py-4 px-4 text-right">P. Unitario</th>
                        <th className="py-4 px-6 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                      {(itemSeleccionado.tipo === 'COTIZACIÓN' ? itemSeleccionado.items_detalle : itemSeleccionado.detalles?.lista_salidas).map((mat: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 uppercase text-[10px]">
                          <td className="py-4 px-6 text-left">{mat.producto || mat.descripcion || mat.nombre}</td>
                          <td className="py-4 px-4 text-center">{mat.cantidad}</td>
                          <td className="py-4 px-4 text-right italic font-mono text-slate-400">S/ {Number(mat.precioUnit || mat.precio).toFixed(2)}</td>
                          <td className="py-4 px-6 text-right font-mono text-[#334155]">S/ {(mat.cantidad * (mat.precioUnit || mat.precio)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* PIE DEL MODAL - BLANCO SUAVIZADO */}
            <div className="p-8 bg-[#f8fafc] border-t border-slate-100 flex justify-between items-center shrink-0 text-left">
               <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Certificación:</span>
                  <span className="px-4 py-1 border border-[#00B4D8] text-[#00B4D8] text-[9px] font-black uppercase tracking-widest bg-white italic shadow-sm">
                    {itemSeleccionado.estado || 'REGISTRO CERRADO'}
                  </span>
               </div>
               <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto Neto Percibido</p>
                  <p className="text-4xl font-black font-mono tracking-tighter text-[#334155]">S/ {Number(itemSeleccionado.monto).toFixed(2)}</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};