// src/sesiones/movimientos/index.tsx
import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import FormularioMovimiento from './components/FormularioMovimiento';
import ResumenTemporal from './components/ResumenTemporal';
import { movimientosService } from '../../db/supabase';

// Memoria RAM Temporal
export interface ItemLote {
  temp_id: number;
  trabajador_id: number;
  trabajador_nombre: string;
  trabajador_documento: string; // <-- CRÍTICO PARA LA EDICIÓN EXACTA
  item_id: number;
  codigo_sku: string;
  item_nombre: string;
  tipo_item: string;
  tipo_movimiento: 'SALIDA' | 'DEVOLUCION';
  cantidad: number;
}

export default function MovimientosSession() {
  const [lote, setLote] = useState<ItemLote[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [itemAEditar, setItemAEditar] = useState<ItemLote | null>(null);

  const agregarAlLote = (item: ItemLote) => setLote(prev => [...prev, item]);
  const quitarDelLote = (temp_id: number) => setLote(prev => prev.filter(i => i.temp_id !== temp_id));
  const vaciarLote = () => setLote([]);

  const editarDelLote = (temp_id: number) => {
    const item = lote.find(i => i.temp_id === temp_id);
    if (item) {
      setItemAEditar(item);
      quitarDelLote(temp_id);
    }
  };

  const limpiarEdicion = () => setItemAEditar(null);

  const procesarLote = async () => {
    if (lote.length === 0) return;
    setProcesando(true);
    
    try {
      for (const item of lote) {
        let estadoFinal: 'COMPLETADO' | 'PENDIENTE_RETORNO' | 'RETORNADO' = 'COMPLETADO';
        if (item.tipo_item === 'HERRAMIENTA') {
          estadoFinal = item.tipo_movimiento === 'SALIDA' ? 'PENDIENTE_RETORNO' : 'RETORNADO';
        }

        await movimientosService.registrarTransaccion({
          item_id: item.item_id,
          trabajador_id: item.trabajador_id,
          tipo_movimiento: item.tipo_movimiento,
          cantidad: item.cantidad,
          estado: estadoFinal
        });
      }
      
      vaciarLote();
      setRefreshKey(prev => prev + 1); 
    } catch (error) {
      console.error(error);
      alert("ERROR DE INTEGRIDAD: Fallo al procesar el lote con Supabase.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4 animate-in fade-in duration-700 pb-2">
      
      <header className="border-l-[12px] border-eco-oscuro pl-4 shrink-0 border-y border-r border-eco-gris-borde bg-eco-blanco p-4 shadow-sm">
        <h2 className="text-xl font-black text-eco-oscuro uppercase tracking-tighter flex items-center gap-2 italic">
          <ArrowLeftRight size={24} className="text-eco-celeste drop-shadow-sm" />
          Registro Rápido de Movimientos
        </h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        <section className="lg:col-span-5 h-full overflow-y-auto custom-scrollbar">
          <FormularioMovimiento 
            onAgregar={agregarAlLote} 
            refreshKey={refreshKey} 
            itemAEditar={itemAEditar}
            onLimpiarEdicion={limpiarEdicion}
          />
        </section>

        <section className="lg:col-span-7 h-full flex flex-col overflow-hidden">
          <ResumenTemporal 
            lote={lote} 
            onQuitar={quitarDelLote} 
            onEditar={editarDelLote}
            onVaciar={vaciarLote} 
            onProcesar={procesarLote} 
            procesando={procesando} 
          />
        </section>

      </div>
    </div>
  );
}