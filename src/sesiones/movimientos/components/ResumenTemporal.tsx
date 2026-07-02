// src/sesiones/movimientos/components/ResumenTemporal.tsx
import { ShoppingCart, Trash2, CheckCircle2, ArrowUpRight, ArrowDownLeft, Loader2, Edit2 } from 'lucide-react';
import type { ItemLote } from '../index';

interface ResumenProps {
  lote: ItemLote[];
  onQuitar: (temp_id: number) => void;
  onEditar: (temp_id: number) => void;
  onVaciar: () => void;
  onProcesar: () => void;
  procesando: boolean;
}

export default function ResumenTemporal({ lote, onQuitar, onEditar, onVaciar, onProcesar, procesando }: ResumenProps) {
  return (
    <div className="card-ecosistema bg-white shadow-xl shadow-eco-oscuro/5 h-full flex flex-col border border-eco-gris-borde rounded-none">
      
      <div className="p-4 border-b border-eco-gris-borde flex justify-between items-center bg-eco-gris-claro shrink-0">
        <h3 className="text-xs font-black uppercase tracking-widest text-eco-oscuro flex items-center gap-2">
          <ShoppingCart size={18} className="text-eco-celeste" />
          Cola de Procesamiento ({lote.length})
        </h3>
        {lote.length > 0 && (
          <button 
            onClick={onVaciar}
            disabled={procesando}
            className="text-[9px] font-black text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 uppercase tracking-[0.2em] transition-colors border border-transparent hover:border-red-200 disabled:opacity-50"
          >
            Vaciar Lote
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-white border-b-2 border-eco-gris-borde z-10 shadow-sm">
            <tr className="text-eco-oscuro text-[9px] uppercase tracking-[0.2em] font-black">
              <th className="p-4">Ficha Técnica</th>
              <th className="p-4 text-center">Operación</th>
              <th className="p-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {lote.map((item) => (
              <tr key={item.temp_id} className="border-b border-eco-gris-borde/40 hover:bg-eco-celeste/10 transition-colors group">
                <td className="p-4">
                  <div className="font-black text-eco-oscuro text-[11px] truncate max-w-[220px] uppercase">{item.item_nombre}</div>
                  <div className="text-[10px] text-eco-gris font-bold mt-1 uppercase tracking-widest">
                    SKU: <span className="text-eco-celeste font-mono">{item.codigo_sku}</span>
                  </div>
                  <div className="text-[9px] text-eco-oscuro font-black mt-2 uppercase tracking-widest bg-eco-gris-claro px-2 py-1 inline-block border border-eco-gris-borde">
                    A Cargo: {item.trabajador_nombre}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-[9px] font-black uppercase tracking-widest border rounded-none ${
                    item.tipo_movimiento === 'SALIDA' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {item.tipo_movimiento === 'SALIDA' ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                    {item.tipo_movimiento}
                  </span>
                  <div className="mt-2 text-[14px] font-black text-eco-oscuro">{item.cantidad} UND</div>
                </td>
                
                {/* BOTONES DE ACCIÓN: EDITAR Y ELIMINAR */}
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => onEditar(item.temp_id)}
                      disabled={procesando}
                      title="Editar y devolver a Registro"
                      className="p-2 text-eco-gris bg-eco-gris-claro border border-eco-gris-borde hover:text-white hover:bg-eco-oscuro hover:border-eco-oscuro transition-colors disabled:opacity-50"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => onQuitar(item.temp_id)}
                      disabled={procesando}
                      title="Quitar del Lote"
                      className="p-2 text-eco-gris bg-eco-gris-claro border border-eco-gris-borde hover:text-white hover:bg-red-500 hover:border-red-500 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>

              </tr>
            ))}
            {lote.length === 0 && (
              <tr>
                <td colSpan={3} className="py-24 text-center text-eco-gris text-[10px] font-black uppercase tracking-widest">
                  La cola de procesamiento está vacía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t-2 border-eco-gris-borde bg-eco-blanco shrink-0">
        <button 
          onClick={onProcesar}
          disabled={lote.length === 0 || procesando}
          className="w-full py-4 bg-eco-oscuro text-eco-celeste font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all hover:bg-eco-celeste hover:text-eco-oscuro disabled:opacity-50 disabled:hover:bg-eco-oscuro disabled:hover:text-eco-celeste border border-transparent"
        >
          {procesando ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
          {procesando ? 'Procesando Envíos...' : 'Confirmar y Actualizar BD'}
        </button>
      </div>

    </div>
  );
}