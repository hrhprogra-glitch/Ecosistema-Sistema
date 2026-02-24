import { useState, useEffect } from 'react';
import { finanzasService, obrasService, clientesService } from '../../services/supabase';
import type { Cliente } from '../../services/supabase';
import { Loader2, History, ArrowUpRight, ArrowDownRight, FileText, User, X, Box, RefreshCcw, Calculator } from 'lucide-react';

interface Props {
  clienteInicial: Cliente | null;
  onLimpiarFiltro: () => void;
}

export const HistorialGeneralView = ({ clienteInicial, onLimpiarFiltro }: Props) => {
  const [loading, setLoading] = useState(true);
  const [historial, setHistorial] = useState<any[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtroClienteId, setFiltroClienteId] = useState<string>(clienteInicial?.id?.toString() || "");
  
  // Estado para el modal de detalles (El "Presupuesto Word" detallado)
  const [itemSeleccionado, setItemSeleccionado] = useState<any | null>(null);

  useEffect(() => {
    if (clienteInicial) {
      setFiltroClienteId(clienteInicial.id?.toString() || "");
    }
  }, [clienteInicial]);

  useEffect(() => {
    const cargarDatos = async () => {
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
            items_originales: c.detalles || [] 
          })),
          ...obras.map((o: any) => {
            const salidas = o.materiales_asignados?.reduce((acc: number, m: any) => acc + (Number(m.cantidad || 0) * (Number(m.precioUnit || 0))), 0) || 0;
            const devoluciones = o.devoluciones?.reduce((acc: number, d: any) => acc + (Number(d.cantidad || 0) * (Number(d.precioUnit || 0))), 0) || 0;
            return {
              ...o, 
              tipo: 'PROYECTO', 
              fecha: new Date(o.created_at || o.fecha_inicio), 
              monto: salidas - devoluciones,
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
    cargarDatos();
  }, []);

  const datosFiltrados = filtroClienteId 
    ? historial.filter(h => h.cliente_id?.toString() === filtroClienteId)
    : historial;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Barra de Filtros */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#E0F7FA] p-2 rounded-xl">
            <History className="text-[#00B4D8]" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Expediente Maestro</h2>
            <p className="text-xs text-slate-400 font-bold uppercase">Consolidado de Obras y Presupuestos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 w-full md:w-auto">
          <User size={16} className="text-slate-400" />
          <select 
            className="bg-transparent text-sm font-bold outline-none text-slate-700 min-w-[200px] cursor-pointer"
            value={filtroClienteId}
            onChange={(e) => {
              const val = e.target.value;
              setFiltroClienteId(val);
              if (val === "") onLimpiarFiltro();
            }}
          >
            <option value="">TODOS LOS CLIENTES</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id?.toString()}>{c.nombre_cliente}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Listado Principal */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-3xl p-20 flex flex-col items-center shadow-sm border border-slate-100">
            <Loader2 className="animate-spin text-[#00B4D8] mb-4" size={40}/>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculando balances reales...</p>
          </div>
        ) : datosFiltrados.length > 0 ? (
          datosFiltrados.map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center hover:border-[#00B4D8]/30 hover:shadow-md transition-all">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {item.fecha.toLocaleDateString('es-PE')}
                  </span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${item.tipo === 'COTIZACIÓN' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {item.tipo}
                  </span>
                </div>
                <h4 className="text-md font-black text-slate-800 uppercase">
                  {item.tipo === 'PROYECTO' ? `${item.detalles?.codigo || 'PROY'} - ${item.nombre_obra}` : `Presupuesto COT-${String(item.id).padStart(4, '0')}`}
                </h4>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
                  {clientes.find(c => c.id === item.cliente_id)?.nombre_cliente}
                </p>
              </div>
              
              <div className="flex items-center gap-8 mt-4 md:mt-0">
                {item.detalles && (
                  <div className="flex gap-4 border-r border-slate-100 pr-6">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Salidas</p>
                      <p className="text-xs font-bold text-rose-500">S/ {Number(item.detalles.salidas).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Devols.</p>
                      <p className="text-xs font-bold text-emerald-500">S/ {Number(item.detalles.devoluciones).toFixed(2)}</p>
                    </div>
                  </div>
                )}
                <div className="text-right min-w-[130px]">
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Balance Final</span>
                  <span className="text-lg font-black text-slate-900 font-mono">S/ {Number(item.monto).toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => setItemSeleccionado(item)}
                  className="bg-slate-50 p-3 rounded-xl text-slate-400 hover:text-[#00B4D8] hover:bg-[#E0F7FA] transition-all"
                >
                  <FileText size={20} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold uppercase text-xs">No hay movimientos registrados</p>
          </div>
        )}
      </div>

      {/* MODAL DE DETALLE (EL "WORD" DEL PRESUPUESTO FINAL) */}
      {itemSeleccionado && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            {/* Header Modal */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                  <FileText className="text-[#00B4D8]" /> Detalle Final de Obra
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Cliente: {clientes.find(c => c.id === itemSeleccionado.cliente_id)?.nombre_cliente}
                </p>
              </div>
              <button onClick={() => setItemSeleccionado(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Contenido Estilo "Documento" */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              
              {/* Resumen Superior */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#F0FDFF] border border-[#00B4D8]/20 p-5 rounded-2xl flex flex-col items-center text-center">
                  <Box className="text-[#00B4D8] mb-2" size={20} />
                  <span className="text-[9px] font-black text-slate-400 uppercase">Total Salidas Almacén</span>
                  <span className="text-lg font-black text-slate-800">S/ {Number(itemSeleccionado.detalles?.salidas || itemSeleccionado.monto).toFixed(2)}</span>
                </div>
                <div className="bg-[#F0FFF4] border border-emerald-100 p-5 rounded-2xl flex flex-col items-center text-center">
                  <RefreshCcw className="text-emerald-500 mb-2" size={20} />
                  <span className="text-[9px] font-black text-slate-400 uppercase">Total Devoluciones</span>
                  <span className="text-lg font-black text-emerald-600">S/ {Number(itemSeleccionado.detalles?.devoluciones || 0).toFixed(2)}</span>
                </div>
                <div className="bg-slate-900 p-5 rounded-2xl flex flex-col items-center text-center">
                  <Calculator className="text-[#00B4D8] mb-2" size={20} />
                  <span className="text-[9px] font-black text-slate-400 uppercase">Costo Real de Obra</span>
                  <span className="text-lg font-black text-white font-mono">S/ {Number(itemSeleccionado.monto).toFixed(2)}</span>
                </div>
              </div>

              {/* Listado de Materiales (Salidas) */}
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <ArrowUpRight size={14} className="text-rose-500" /> Detalle de Salidas (Obra)
                </h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase">
                      <tr>
                        <th className="py-3 px-4">Producto</th>
                        <th className="py-3 px-4 text-center">Cantidad</th>
                        <th className="py-3 px-4 text-right">Unitario</th>
                        <th className="py-3 px-4 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(itemSeleccionado.tipo === 'COTIZACIÓN' ? itemSeleccionado.items_originales : itemSeleccionado.detalles?.lista_salidas).map((mat: any, i: number) => (
                        <tr key={i} className="text-slate-600 font-bold text-xs uppercase">
                          <td className="py-3 px-4">{mat.nombre || mat.descripcion}</td>
                          <td className="py-3 px-4 text-center">{mat.cantidad}</td>
                          <td className="py-3 px-4 text-right">S/ {Number(mat.precioUnit || mat.precio).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-800">S/ {(mat.cantidad * (mat.precioUnit || mat.precio)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Listado de Devoluciones */}
              {itemSeleccionado.detalles?.lista_devoluciones?.length > 0 && (
                <div className="animate-in slide-in-from-top-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <ArrowDownRight size={14} className="text-emerald-500" /> Detalle de Devoluciones
                  </h4>
                  <div className="border border-emerald-50 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-emerald-50/50 border-b border-emerald-100 text-[10px] font-black text-emerald-400 uppercase">
                        <tr>
                          <th className="py-3 px-4">Producto</th>
                          <th className="py-3 px-4 text-center">Cantidad</th>
                          <th className="py-3 px-4 text-right">Unitario</th>
                          <th className="py-3 px-4 text-right">Crédito</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-50">
                        {itemSeleccionado.detalles.lista_devoluciones.map((dev: any, i: number) => (
                          <tr key={i} className="text-slate-600 font-bold text-xs uppercase">
                            <td className="py-3 px-4">{dev.nombre}</td>
                            <td className="py-3 px-4 text-center">{dev.cantidad}</td>
                            <td className="py-3 px-4 text-right">S/ {Number(dev.precioUnit).toFixed(2)}</td>
                            <td className="py-3 px-4 text-right font-mono text-emerald-600">S/ {(dev.cantidad * dev.precioUnit).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Modal con Balance Final */}
            <div className="p-8 bg-slate-900 flex justify-between items-center text-white">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Liquidación Final de Proyecto</span>
                <span className="px-3 py-1 bg-[#00B4D8] rounded text-[10px] font-black uppercase">{itemSeleccionado.tipo}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Monto Líquido a Pagar</span>
                <span className="text-3xl font-black font-mono">S/ {Number(itemSeleccionado.monto).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};