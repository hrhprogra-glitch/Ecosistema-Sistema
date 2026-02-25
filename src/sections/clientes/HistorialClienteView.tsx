// src/sections/clientes/HistorialClienteView.tsx
import { useState, useEffect } from 'react';
import { finanzasService, obrasService, clientesService } from '../../services/supabase';
import type { Cliente } from '../../services/supabase';
import { Loader2, History, FileText, X, Box, Calculator, LayoutGrid, ChevronDown, Landmark, DollarSign, CheckCircle2, Printer, Trash2, Edit3 } from 'lucide-react';

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

  // Estados para Gestión de Pagos
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [montoAbono, setMontoAbono] = useState<string>("");
  const [metodoPago, setMetodoPago] = useState("Transferencia");
  const [itemParaPagar, setItemParaPagar] = useState<any>(null);
  const [pagoAEditar, setPagoAEditar] = useState<any>(null);

  // Estado para Impresión de Hoja A4
  const [comprobanteImprimir, setComprobanteImprimir] = useState<any | null>(null);

  useEffect(() => {
    if (clienteInicial) setFiltroClienteId(clienteInicial.id?.toString() || "");
  }, [clienteInicial]);

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

  useEffect(() => { cargarBase(); }, []);

  const datosFiltrados = filtroClienteId ? historial.filter(h => h.cliente_id?.toString() === filtroClienteId) : historial;

  // LOGICA DE PAGOS (REGISTRAR / EDITAR)
  const confirmarAbono = async () => {
    const monto = Number(montoAbono);
    if (isNaN(monto) || monto <= 0) return alert("Ingrese un monto válido.");
    
    try {
      if (pagoAEditar) {
        // Lógica de edición
        // @ts-ignore
        await finanzasService.actualizarPago(pagoAEditar.id, {
          monto_pagado: monto,
          metodo: metodoPago
        });
      } else {
        // Lógica de nuevo registro
        const nuevoPago = {
          cotizacion_id: itemParaPagar.id,
          monto_pagado: monto,
          fecha_pago: new Date().toISOString(),
          metodo: metodoPago
        };
        const yaAbonado = itemParaPagar.pagos?.reduce((a:number, b:any) => a + (b.monto_pagado || 0), 0) || 0;
        const nuevoEstado = (yaAbonado + monto) >= itemParaPagar.monto ? 'Completado' : 'Parcial';
        await finanzasService.registrarPago(nuevoPago, itemParaPagar.id, nuevoEstado);
      }
      
      alert("✅ Transacción procesada correctamente.");
      setShowPagoModal(false);
      setMontoAbono("");
      setPagoAEditar(null);
      cargarBase();
    } catch (error) { 
      console.error(error);
      alert("Error en la transacción."); 
    }
  };

  const handleEditarAbono = (pago: any, cot: any) => {
    setItemParaPagar(cot);
    setPagoAEditar(pago);
    setMontoAbono(pago.monto_pagado.toString());
    setMetodoPago(pago.metodo);
    setShowPagoModal(true);
  };

  const handleEliminarAbono = async (pagoId: number) => {
    if (!confirm("¿Desea eliminar este registro de pago?")) return;
    try {
      // @ts-ignore
      await finanzasService.eliminarPago(pagoId);
      alert("Pago eliminado.");
      cargarBase();
    } catch (e) { alert("Error al eliminar."); }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER: PANEL DE COBRANZAS */}
      <div className="bg-white p-6 border border-slate-200 border-l-[12px] border-l-emerald-500 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
        <div className="flex items-center gap-4 text-left">
          <div className="bg-white p-2.5 border border-emerald-500">
            <Landmark className="text-emerald-500" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#334155] uppercase tracking-tight italic">Gestión de Cobranzas</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Monitoreo de Deudas y Abonos</p>
          </div>
        </div>
        
        <div className="relative w-full md:w-auto">
          <select 
            className="w-full md:w-[320px] bg-white border-2 border-slate-200 hover:border-emerald-500 pl-4 pr-10 py-3.5 text-[11px] font-black uppercase outline-none transition-all appearance-none"
            value={filtroClienteId}
            onChange={(e) => {
              setFiltroClienteId(e.target.value);
              if (e.target.value === "") onLimpiarFiltro();
            }}
          >
            <option value="">TODOS LOS EXPEDIENTES</option>
            {clientes.map(c => <option key={c.id} value={c.id?.toString()}>{c.nombre_cliente}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* LISTADO DE HISTORIAL CON SALDOS */}
      <div className="space-y-6">
        {loading ? (
          <div className="bg-white p-24 flex flex-col items-center border border-slate-200">
            <Loader2 className="animate-spin text-emerald-500 mb-4" size={40}/>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando cuentas...</p>
          </div>
        ) : datosFiltrados.length > 0 ? (
          datosFiltrados.map((item, idx) => {
            const abonos = item.pagos || [];
            const abonadoTotal = abonos.reduce((acc: number, p: any) => acc + (p.monto_pagado || 0), 0) || 0;
            const saldo = item.monto - abonadoTotal;
            const esFactura = item.monto > 700;

            return (
              <div key={idx} className="bg-white border border-slate-200 shadow-sm group">
                <div className="flex flex-col md:flex-row">
                  <div className={`w-full md:w-2 ${saldo <= 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  <div className="flex-1 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 font-mono">COT-{String(item.id).padStart(4, '0')}</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 border ${esFactura ? 'border-blue-200 text-blue-600 bg-blue-50' : 'border-slate-200 text-slate-500 bg-slate-50'}`}>
                          {esFactura ? 'COMPROBANTE: FACTURA' : 'COMPROBANTE: BOLETA'}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-[#334155] uppercase tracking-tighter italic">
                        {clientes.find(c => c.id === item.cliente_id)?.nombre_cliente}
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 items-center border-l border-slate-100 pl-8 text-right">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Presupuesto</p>
                        <p className="text-sm font-black text-slate-700 font-mono">S/ {item.monto.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Abonado</p>
                        <p className="text-sm font-black text-emerald-600 font-mono">S/ {abonadoTotal.toFixed(2)}</p>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Saldo</p>
                        <p className={`text-sm font-black font-mono ${saldo > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {saldo > 0 ? `S/ ${saldo.toFixed(2)}` : 'CANCELADO'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setItemSeleccionado(item)} className="p-3 bg-slate-100 text-slate-500 hover:bg-slate-200" title="Ver Detalle Técnico">
                        <FileText size={20} />
                      </button>
                      {saldo > 0 && (
                        <button 
                          onClick={() => { setItemParaPagar(item); setShowPagoModal(true); setPagoAEditar(null); setMontoAbono(""); }}
                          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 text-[10px] font-black uppercase hover:bg-slate-900 transition-all"
                        >
                          <DollarSign size={14}/> Abonar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* HISTORIAL DE ABONOS (EDICIÓN Y HOJA DE PAGO) */}
                {abonos.length > 0 && (
                  <div className="bg-slate-50 p-4 px-8 border-t border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Transacciones Realizadas:</p>
                    <div className="flex flex-wrap gap-4">
                      {abonos.map((p: any, pIdx: number) => (
                        <div key={pIdx} className="bg-white border border-slate-200 p-2 px-4 flex items-center gap-4 shadow-sm animate-in slide-in-from-left-2">
                          <div className="text-left border-r pr-4">
                            <p className="text-[10px] font-black text-slate-700">S/ {p.monto_pagado.toFixed(2)}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase">{new Date(p.fecha_pago).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setComprobanteImprimir({ ...p, cotizacion: item, cliente: clientes.find(c => c.id === item.cliente_id) })} className="text-blue-500 hover:scale-110 transition-transform" title="Generar Recibo"><Printer size={15}/></button>
                            <button onClick={() => handleEditarAbono(p, item)} className="text-amber-500" title="Editar Monto"><Edit3 size={15}/></button>
                            <button onClick={() => handleEliminarAbono(p.id)} className="text-red-300 hover:text-red-500" title="Eliminar"><Trash2 size={15}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-32 text-center bg-white border border-dashed border-slate-300 opacity-50">
             <LayoutGrid size={48} className="mx-auto text-slate-200 mb-4" />
             <p className="text-slate-400 font-black uppercase text-[11px] tracking-[0.4em]">Sin cuentas pendientes</p>
          </div>
        )}
      </div>

      {/* MODAL PARA ABONAR / EDITAR PAGO */}
      {showPagoModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm shadow-2xl border-b-8 border-emerald-500 animate-in zoom-in-95">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-black uppercase tracking-tighter italic flex items-center gap-2">
                <Landmark size={20}/> {pagoAEditar ? 'Editar Pago' : 'Nuevo Abono'}
              </h3>
              <button onClick={() => setShowPagoModal(false)}><X size={24}/></button>
            </div>
            <div className="p-8 space-y-6 text-left">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Monto a Recibir (S/)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border-2 border-slate-200 p-4 text-2xl font-black font-mono outline-none focus:border-emerald-500"
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Método</label>
                <select className="w-full bg-slate-50 border-2 border-slate-200 p-3 text-xs font-black uppercase outline-none" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Yape / Plin">Yape / Plin</option>
                  <option value="Tarjeta">Tarjeta</option>
                </select>
              </div>
              <button onClick={confirmarAbono} className="w-full bg-emerald-500 text-white py-4 font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                <CheckCircle2 size={18} /> {pagoAEditar ? 'ACTUALIZAR DATOS' : 'CONFIRMAR ABONO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOJA DE PAGO (REVISIÓN DE BOLETA / FACTURA) */}
      {comprobanteImprimir && (
        <div className="fixed inset-0 z-[700] bg-slate-900/80 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-[600px] min-h-[750px] p-12 shadow-2xl relative flex flex-col font-sans text-black animate-in fade-in duration-300">
                <button onClick={() => setComprobanteImprimir(null)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 print:hidden transition-all"><X size={32}/></button>
                
                <div className="text-center border-b-4 border-slate-900 pb-8 mb-8">
                    <h1 className="text-3xl font-black tracking-tighter">ECO SISTEMAS URH SAC</h1>
                    <p className="text-[11px] font-bold text-slate-500 uppercase mt-1 tracking-widest">Mz A LT 9 A.V NUEVA GALES CIENEGUILLA</p>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Telf: 998270102 – 985832096</p>
                </div>

                <div className="flex justify-between items-start mb-10">
                    <div className="text-left">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Señor(es):</p>
                        <h2 className="text-lg font-black uppercase text-slate-900 leading-tight">{comprobanteImprimir.cliente?.nombre_cliente}</h2>
                        <p className="text-[10px] font-bold text-slate-500 mt-1 italic">DNI/RUC: {comprobanteImprimir.cliente?.dni_ruc || '----------'}</p>
                    </div>
                    <div className="text-right border-l-2 pl-6 border-slate-100">
                        <p className="text-[10px] font-black text-emerald-600 uppercase italic">
                            RECIBO DE ABONO DE {comprobanteImprimir.cotizacion.monto > 700 ? 'FACTURA' : 'BOLETA'}
                        </p>
                        <p className="text-[11px] font-bold mt-2">N° COT: {String(comprobanteImprimir.cotizacion.id).padStart(4,'0')}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {new Date(comprobanteImprimir.fecha_pago).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="bg-slate-50 border-y-2 border-slate-200 p-10 text-center mb-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">CONCEPTO: ABONO POR SERVICIOS TÉCNICOS</p>
                    <p className="text-6xl font-black font-mono tracking-tighter">S/ {comprobanteImprimir.monto_pagado.toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-emerald-600 mt-4 uppercase tracking-tighter">Medio de Pago: {comprobanteImprimir.metodo}</p>
                </div>

                <div className="flex-1 space-y-4">
                    <div className="flex justify-between border-b py-2 text-[12px]">
                        <span className="font-bold text-slate-500 uppercase">Inversión Total del Proyecto:</span>
                        <span className="font-black text-slate-900 font-mono">S/ {comprobanteImprimir.cotizacion.monto.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b py-2 text-[12px] bg-emerald-50 px-3 italic">
                        <span className="font-bold text-emerald-600 uppercase">Monto de este Abono:</span>
                        <span className="font-black text-emerald-600 font-mono">S/ {comprobanteImprimir.monto_pagado.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 text-[15px] text-red-600 font-black px-3 border-b-2 border-dashed border-red-200">
                        <span className="uppercase tracking-widest">Saldo Pendiente a Liquidar:</span>
                        <span className="font-mono text-2xl">
                            S/ {(comprobanteImprimir.cotizacion.monto - (comprobanteImprimir.cotizacion.pagos.reduce((a:any,b:any)=>a+b.monto_pagado,0))).toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="mt-20 flex justify-between items-end border-t border-slate-100 pt-10">
                    <div className="text-[9px] text-slate-400 font-bold italic leading-relaxed">
                        <p>* Comprobante interno de abono no válido para fines tributarios.</p>
                        <p>* ECO SISTEMAS URH SAC agradece su preferencia.</p>
                    </div>
                    <div className="w-48 border-t-2 border-slate-900 text-center pt-2">
                        <p className="text-[10px] font-black uppercase tracking-widest">Firma Autorizada</p>
                    </div>
                </div>

                <button onClick={() => window.print()} className="mt-12 bg-slate-900 text-white py-4 px-8 font-black uppercase text-xs flex items-center gap-3 justify-center hover:bg-emerald-600 transition-all print:hidden shadow-2xl">
                    <Printer size={20}/> Imprimir Recibo Oficial
                </button>
            </div>
        </div>
      )}

      {/* MODAL DETALLE TECNICO ORIGINAL (Mantenido) */}
      {itemSeleccionado && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[95vh] shadow-2xl overflow-hidden flex flex-col border border-slate-200 border-b-8 border-b-[#00B4D8] animate-in zoom-in-95">
            <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center text-left">
              <div className="flex items-center gap-4">
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
          </div>
        </div>
      )}
    </div>
  );
};