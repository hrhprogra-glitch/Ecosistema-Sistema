// src/sesiones/historial/components/TablaHistorialGlobal.tsx
import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, RotateCcw, Loader2, CornerDownLeft, Eye, X, Activity, Edit2, Save, CheckCircle2 } from 'lucide-react';
import { movimientosService } from '../../../db/supabase';

interface Props {
  onNavigate?: (tab: string) => void;
}

export default function TablaHistorialGlobal({ onNavigate }: Props) {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados Modales
  const [cicloSeleccionado, setCicloSeleccionado] = useState<any | null>(null);
  const [movEditar, setMovEditar] = useState<any | null>(null);
  const [nuevaCantidad, setNuevaCantidad] = useState<number | string>('');
  const [guardando, setGuardando] = useState(false);

  const cargarHistorial = async () => {
    try {
      const data = await movimientosService.listarHistorial();
      setHistorial(data);
    } catch (error) {
      console.error("Error cargando auditoría:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  // MOTOR DE TRANSICIÓN: Enviar a "Registro -> Retorno"
  const handleIniciarRetorno = (trx: any) => {
    const payloadInfo = {
      dni_trabajador: trx.trabajadores?.documento_identidad || '',
      sku_item: trx.inventario?.codigo_sku || ''
    };
    sessionStorage.setItem('eco_transicion_retorno', JSON.stringify(payloadInfo));
    if (onNavigate) onNavigate('movimientos');
  };

  // MOTOR DE EDICIÓN: Corregir cantidad de salida
  const abrirEdicion = (trx: any) => {
    setMovEditar(trx);
    setNuevaCantidad(trx.cantidad);
  };

  const guardarEdicion = async () => {
    const cantFinal = Number(nuevaCantidad);
    if (isNaN(cantFinal) || cantFinal <= 0) return alert("Cantidad inválida.");
    
    setGuardando(true);
    try {
      await movimientosService.actualizarTransaccion(
        movEditar.id,
        movEditar.item_id,
        movEditar.tipo_movimiento,
        movEditar.cantidad,
        cantFinal
      );
      setMovEditar(null);
      await cargarHistorial(); // Refrescamos matriz
    } catch (error) {
      console.error(error);
      alert("Fallo al aplicar corrección en base de datos.");
    } finally {
      setGuardando(false);
    }
  };

  const historialCicloVida = cicloSeleccionado 
    ? historial.filter(h => h.item_id === cicloSeleccionado.item_id && h.trabajador_id === cicloSeleccionado.trabajador_id)
               .sort((a,b) => new Date(b.fecha_movimiento).getTime() - new Date(a.fecha_movimiento).getTime())
    : [];

  return (
    <div className="w-full overflow-x-auto bg-eco-blanco border border-eco-gris-borde rounded-none shadow-none">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-eco-gris-claro border-b-2 border-eco-gris-borde text-eco-oscuro text-[10px] uppercase tracking-widest font-black">
            <th className="p-4">Registro / Fecha</th>
            <th className="p-4">Operación</th>
            <th className="p-4">Inventario Base</th>
            <th className="p-4">Personal</th>
            <th className="p-4 text-center border-l border-eco-gris-borde">Auditoría / Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-eco-gris-borde/50">
          {loading ? (
            <tr>
              <td colSpan={5} className="py-20 text-center text-eco-gris">
                <Loader2 size={32} className="animate-spin mx-auto text-eco-celeste" />
              </td>
            </tr>
          ) : historial.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-20 text-center text-[10px] uppercase tracking-widest font-black text-eco-gris">
                El historial de auditoría está en cero
              </td>
            </tr>
          ) : (
            historial.map((trx) => (
              <tr key={trx.id} className="border-b border-eco-gris-borde/50 hover:bg-eco-celeste/10 transition-colors duration-300">
                
                <td className="p-4">
                  <div className="font-mono font-black text-eco-celeste text-[10px]">{trx.id.split('-')[0].toUpperCase()}</div>
                  <div className="text-[11px] font-bold text-eco-gris mt-1 uppercase tracking-widest">
                    {new Date(trx.fecha_movimiento).toLocaleString()}
                  </div>
                </td>

                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-none border shadow-none ${
                    trx.tipo_movimiento === 'SALIDA' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {trx.tipo_movimiento === 'SALIDA' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                    {trx.tipo_movimiento}
                  </span>
                  <div className="font-black text-eco-oscuro mt-2 text-[13px]">{trx.cantidad} UNIDAD(ES)</div>
                </td>

                <td className="p-4">
                  <div className="font-black text-eco-oscuro text-[12px] uppercase">{trx.inventario?.nombre || 'Desconocido'}</div>
                  <div className="text-[10px] text-eco-gris font-bold mt-1 uppercase tracking-widest">
                    SKU: <span className="text-eco-oscuro">{trx.inventario?.codigo_sku || 'N/A'}</span> • {trx.inventario?.tipo}
                  </div>
                </td>

                <td className="p-4">
                  <div className="font-black text-eco-oscuro text-[12px] uppercase">{trx.trabajadores?.nombre_completo || 'Desconocido'}</div>
                  <div className="text-[10px] text-eco-gris font-bold mt-1 uppercase tracking-widest">
                    DNI: <span className="text-eco-oscuro">{trx.trabajadores?.documento_identidad || 'N/A'}</span>
                  </div>
                </td>

                {/* SINGLE ROW ACTIONS - COMPACT UI */}
                <td className="p-4 text-center border-l border-eco-gris-borde">
                  <div className="flex flex-row items-center justify-center gap-1.5 w-full">
                    
                    {/* ESTADO (Iconografía Compacta) */}
                    {trx.estado === 'PENDIENTE_RETORNO' ? (
                      <span title="En Campo" className="p-2 bg-eco-oscuro text-eco-blanco border border-transparent shadow-none cursor-help">
                        <RotateCcw size={14} />
                      </span>
                    ) : (
                      <span title={trx.estado} className={`p-2 border shadow-none cursor-help ${
                        trx.estado === 'COMPLETADO' ? 'text-eco-gris bg-eco-gris-claro border-eco-gris-borde' : 'text-blue-700 bg-blue-50 border-blue-200'
                      }`}>
                        <CheckCircle2 size={14} />
                      </span>
                    )}

                    <div className="w-px h-6 bg-eco-gris-borde mx-1"></div>

                    {/* LÍNEA DE TIEMPO */}
                    <button 
                      onClick={() => setCicloSeleccionado(trx)}
                      className="p-2 bg-eco-gris-claro hover:bg-eco-oscuro hover:text-white text-eco-oscuro transition-colors border border-eco-gris-borde rounded-none"
                      title="Ver Línea de Tiempo de este elemento"
                    >
                      <Eye size={14} />
                    </button>
                    
                    {/* CORREGIR SALIDA (Solo editable si fue una salida) */}
                    {trx.tipo_movimiento === 'SALIDA' && (
                      <button 
                        onClick={() => abrirEdicion(trx)}
                        className="p-2 bg-eco-gris-claro hover:bg-amber-500 hover:text-white text-eco-oscuro transition-colors border border-eco-gris-borde rounded-none"
                        title="Corregir Error de Salida"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}

                    {/* BOTÓN RETORNAR */}
                    {trx.estado === 'PENDIENTE_RETORNO' && (
                      <button 
                        onClick={() => handleIniciarRetorno(trx)}
                        className="p-2 bg-eco-celeste hover:bg-sky-400 text-eco-oscuro transition-colors border border-transparent rounded-none"
                        title="Procesar Retorno a Inventario"
                      >
                        <CornerDownLeft size={14} />
                      </button>
                    )}

                  </div>
                </td>

              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ==============================================
          MODAL 1: CORRECCIÓN DE SALIDA (EDITAR)
          ============================================== */}
      {movEditar && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-eco-oscuro/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="card-ecosistema w-full max-w-sm bg-eco-blanco p-0 flex flex-col shadow-2xl scale-in-95 duration-300 rounded-none border-t-8 border-amber-500">
            <div className="p-6 border-b border-eco-gris-borde bg-amber-50 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tighter text-amber-700 flex items-center gap-2">
                  <Edit2 size={20} /> Corregir Salida
                </h3>
                <p className="text-[10px] text-amber-600/80 font-bold uppercase tracking-widest mt-1">
                  Recálculo automático de Inventario
                </p>
              </div>
              <button onClick={() => setMovEditar(null)} className="text-amber-600 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="bg-eco-gris-claro border border-eco-gris-borde p-3 rounded-none">
                <p className="text-[10px] font-black text-eco-gris uppercase tracking-widest mb-1">Producto a afectar</p>
                <p className="font-bold text-eco-oscuro text-xs uppercase">{movEditar.inventario?.nombre}</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-eco-oscuro uppercase tracking-[0.2em] mb-2">Cantidad Real Despachada</label>
                <input 
                  type="number" min="1"
                  className="w-full bg-white border border-eco-gris-borde px-4 py-4 text-center font-mono text-xl font-black outline-none focus:border-amber-500 transition-colors shadow-inner rounded-none no-spinners"
                  value={nuevaCantidad}
                  onChange={e => setNuevaCantidad(e.target.value)}
                  onFocus={e => e.target.select()}
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={() => setMovEditar(null)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-eco-gris hover:bg-eco-gris-claro transition-colors border border-eco-gris-borde">
                  Abortar
                </button>
                <button onClick={guardarEdicion} disabled={guardando} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50 border border-transparent">
                  {guardando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                  Corregir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================
          MODAL 2: LÍNEA DE TIEMPO DEL CICLO DE VIDA 
          ============================================== */}
      {cicloSeleccionado && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-eco-oscuro/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="card-ecosistema w-full max-w-2xl bg-eco-blanco p-0 flex flex-col shadow-2xl scale-in-95 duration-300 rounded-none border-t-8 border-eco-celeste max-h-[85vh]">
            
            <div className="p-6 border-b border-eco-gris-borde bg-eco-gris-claro flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-eco-oscuro flex items-center gap-2 italic">
                  <Activity size={24} className="text-eco-celeste" /> 
                  Auditoría Detallada
                </h3>
                <p className="text-[10px] text-eco-gris font-bold uppercase tracking-widest mt-1">
                  Trabajador: <span className="text-eco-oscuro">{cicloSeleccionado.trabajadores?.nombre_completo}</span>
                </p>
                <p className="text-[10px] text-eco-gris font-bold uppercase tracking-widest mt-0.5">
                  Herramienta: <span className="text-eco-oscuro">{cicloSeleccionado.inventario?.nombre}</span>
                </p>
              </div>
              <button onClick={() => setCicloSeleccionado(null)} className="text-eco-gris hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
              <div className="relative border-l-2 border-eco-gris-borde ml-4 space-y-8">
                {historialCicloVida.map((item) => (
                  <div key={item.id} className="relative pl-8">
                    {/* Indicador en la línea de tiempo */}
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-eco-blanco ${
                      item.tipo_movimiento === 'SALIDA' ? 'bg-orange-500' : 'bg-emerald-500'
                    }`}></div>
                    
                    <div className="bg-eco-gris-claro border border-eco-gris-borde p-4 rounded-none">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white ${
                          item.tipo_movimiento === 'SALIDA' ? 'bg-orange-500' : 'bg-emerald-500'
                        }`}>
                          {item.tipo_movimiento}
                        </span>
                        <span className="text-[10px] font-black text-eco-gris uppercase tracking-widest">
                          Cant: {item.cantidad}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-eco-oscuro uppercase mt-2">
                        Fecha Operación: <span className="font-mono text-eco-celeste">{new Date(item.fecha_movimiento).toLocaleString()}</span>
                      </p>
                      <p className="text-[9px] font-bold text-eco-gris uppercase tracking-widest mt-1">
                        ID Sistema: {item.id}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-eco-gris-borde bg-eco-blanco text-center shrink-0">
              <p className="text-[10px] text-eco-gris font-black uppercase tracking-widest">Fin del reporte de auditoría</p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}