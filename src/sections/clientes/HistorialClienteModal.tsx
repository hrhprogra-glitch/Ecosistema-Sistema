// src/sections/clientes/HistorialClienteModal.tsx
import { useState, useEffect } from 'react';
import { X, FileText, ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, Loader2, History, TrendingUp } from 'lucide-react';
import { finanzasService, obrasService } from '../../services/supabase';
import type { Cliente } from '../../services/supabase';

interface HistorialItem {
  id: number;
  tipo: 'COTIZACIÓN' | 'PROYECTO';
  nombre: string;
  estado: string;
  monto: number;
  fecha: Date;
  detalles?: any;
}

export const HistorialClienteModal = ({ cliente, onClose }: { cliente: Cliente, onClose: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);

  useEffect(() => {
    const cargarHistorialCompleto = async () => {
      setLoading(true);
      try {
        const [cotizaciones, obras] = await Promise.all([
          finanzasService.listarCotizacionesTodas(),
          obrasService.listar()
        ]);

        // 1. Procesar Cotizaciones del cliente
        const cots = cotizaciones
          .filter((c: any) => c.cliente_id === cliente.id)
          .map((c: any) => ({
            id: c.id,
            tipo: 'COTIZACIÓN' as const,
            nombre: `Presupuesto Inicial`,
            estado: c.estado,
            monto: c.monto_total,
            fecha: new Date(c.created_at || c.fecha_emision),
            detalles: c.detalles
          }));

        // 2. Procesar Obras (Cálculo solicitado: Salidas - Devoluciones)
        const proys = obras
          .filter((o: any) => o.cliente_id === cliente.id)
          .map((o: any) => {
            const totalSalidas = o.materiales_asignados?.reduce((acc: number, m: any) => acc + (m.cantidad * (m.precioUnit || 0)), 0) || 0;
            const totalDevoluciones = o.devoluciones?.reduce((acc: number, d: any) => acc + (d.cantidad * (d.precioUnit || 0)), 0) || 0;
            
            return {
              id: o.id,
              tipo: 'PROYECTO' as const,
              nombre: o.nombre_obra,
              estado: o.estado,
              monto: totalSalidas - totalDevoluciones, // BALANCE FINAL SOLICITADO
              fecha: new Date(o.created_at || o.fecha_inicio),
              detalles: { salidas: totalSalidas, devoluciones: totalDevoluciones, codigo: o.codigo_obra }
            };
          });

        const combined = [...cots, ...proys].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
        setHistorial(combined);
      } catch (error) {
        console.error("Error al cargar historial:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarHistorialCompleto();
  }, [cliente.id]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <History size={16} className="text-[#00B4D8]"/>
               <span className="text-[10px] font-black text-[#00B4D8] uppercase tracking-[0.2em] bg-[#E0F7FA] px-3 py-1 rounded-full">Expediente Histórico</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{cliente.nombre_cliente}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"><X size={28}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-[#00B4D8] mb-4" size={40}/>
              <p className="font-bold text-slate-400 uppercase tracking-widest text-xs text-center">Cruzando datos de Presupuestos, Salidas y Devoluciones...</p>
            </div>
          ) : historial.length > 0 ? (
            historial.map((item, idx) => (
              <div key={idx} className="relative pl-8 border-l-2 border-slate-200 pb-2 group">
                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm transition-transform group-hover:scale-125 ${item.tipo === 'COTIZACIÓN' ? 'bg-[#00B4D8]' : 'bg-emerald-500'}`}></div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {item.fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${item.tipo === 'COTIZACIÓN' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {item.tipo}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      {item.tipo === 'PROYECTO' ? `${item.detalles.codigo} - ${item.nombre}` : `COT-${String(item.id).padStart(4, '0')} ${item.nombre}`}
                    </h4>
                    <div className="mt-4 flex flex-wrap gap-4">
                      {item.tipo === 'PROYECTO' && (
                        <>
                          <div className="flex items-center gap-2 text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                            <ArrowUpRight size={14}/> Salidas: S/ {item.detalles.salidas.toFixed(2)}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                            <ArrowDownRight size={14}/> Devoluciones: S/ {item.detalles.devoluciones.toFixed(2)}
                          </div>
                        </>
                      )}
                      <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border ${
                        item.estado === 'Aprobado' || item.estado === 'Completado' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                      }`}>
                        {item.estado === 'Completado' ? <CheckCircle2 size={14}/> : <Clock size={14}/>}
                        {item.estado.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-center border-l border-slate-100 pl-6 min-w-[200px] bg-slate-50/50 rounded-r-2xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {item.tipo === 'PROYECTO' ? 'Inversión Real Final' : 'Monto Presupuestado'}
                    </span>
                    <span className="text-2xl font-black text-slate-900 font-mono">S/ {item.monto.toFixed(2)}</span>
                    <button className="mt-3 flex items-center gap-2 text-[10px] font-black text-[#00B4D8] uppercase hover:underline"><FileText size={14}/> Ver Detalle / Word</button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <TrendingUp size={64} className="mb-4 opacity-20"/>
              <p className="font-bold uppercase tracking-widest text-sm text-slate-400">Sin actividad registrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};