import { useState, useRef, useEffect } from 'react';
import { Search, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function FormularioMovimiento() {
  const [tipoMovimiento, setTipoMovimiento] = useState<'SALIDA' | 'RETORNO'>('SALIDA');
  const inputRef = useRef<HTMLInputElement>(null);

  // UX: Auto-focus al cargar o al cambiar de modo para evitar uso del mouse
  useEffect(() => {
    inputRef.current?.focus();
  }, [tipoMovimiento]);

  return (
    <div className="card-ecosistema bg-eco-blanco shadow-xl shadow-eco-oscuro/5 h-full flex flex-col p-5 border-t-4 border-eco-oscuro">
      
      {/* Selectores de Tipo (High Contrast) */}
      <div className="flex gap-2 mb-6 shrink-0">
        <button 
          onClick={() => setTipoMovimiento('SALIDA')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 border-2 ${tipoMovimiento === 'SALIDA' ? 'bg-eco-oscuro border-eco-oscuro text-eco-blanco shadow-md' : 'bg-transparent border-eco-gris-borde text-eco-gris hover:border-eco-oscuro/50'}`}
        >
          <ArrowUpRight size={16} className="inline mr-2" /> Salida
        </button>
        <button 
          onClick={() => setTipoMovimiento('RETORNO')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 border-2 ${tipoMovimiento === 'RETORNO' ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-transparent border-eco-gris-borde text-eco-gris hover:border-emerald-600/50'}`}
        >
          <ArrowDownLeft size={16} className="inline mr-2" /> Retorno
        </button>
      </div>

      {/* Campos de Ingreso Rápido */}
      <div className="flex flex-col gap-5 flex-1">
        {/* Input de Personal (Destino/Origen) */}
        <div>
          <label className="block text-[10px] font-bold text-eco-gris uppercase tracking-wider mb-1">
            {tipoMovimiento === 'SALIDA' ? 'Asignar a (DNI / Nombre)' : 'Devuelto por (DNI / Nombre)'}
          </label>
          <input 
            type="text" 
            placeholder="Ej. Juan Pérez..." 
            className="w-full bg-eco-gris-claro border border-eco-gris-borde text-eco-oscuro font-bold px-3 py-2.5 outline-none focus:border-eco-celeste focus:ring-1 focus:ring-eco-celeste transition-all"
          />
        </div>

        {/* Input de Producto - Visualmente Dominante */}
        <div className="mt-2">
          <label className="block text-[10px] font-bold text-eco-gris uppercase tracking-wider mb-1">SKU o Código de Barras</label>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-eco-gris" />
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Escanea o escribe..." 
              className="w-full bg-white border-2 border-eco-oscuro text-eco-oscuro font-black text-lg px-10 py-4 outline-none focus:border-eco-celeste transition-colors shadow-inner"
            />
          </div>
        </div>

        {/* Cantidad y Botón de Acción */}
        <div className="grid grid-cols-5 gap-4 mt-2">
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-eco-gris uppercase tracking-wider mb-1">Cant.</label>
            <input 
              type="number" 
              defaultValue={1}
              min={1}
              className="w-full bg-white border border-eco-gris-borde text-eco-oscuro font-bold text-center text-lg px-3 py-3 outline-none focus:border-eco-celeste"
            />
          </div>
          <div className="col-span-3 flex items-end">
            <button className="w-full h-[54px] bg-eco-celeste hover:bg-sky-400 text-eco-oscuro font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-colors shadow-sm">
              <Plus size={16} /> Agregar
            </button>
          </div>
        </div>
      </div>
      
      {/* Refuerzo UX de Velocidad */}
      <p className="text-[10px] text-eco-gris text-center mt-6 font-medium flex items-center justify-center gap-1">
        <kbd className="bg-eco-gris-claro px-1.5 py-0.5 rounded border border-eco-gris-borde font-mono font-bold text-eco-oscuro">Enter</kbd> para agregar al lote rápidamente
      </p>

    </div>
  );
}