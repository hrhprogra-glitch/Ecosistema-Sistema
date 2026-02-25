// src/sections/obras/DevolucionesTab.tsx
import { ArrowLeftRight, Search, RotateCcw } from 'lucide-react';

export const DevolucionesTab = ({ zoom }: { zoom: number }) => {
  return (
    <div className="bg-white border border-slate-200 p-12 text-center animate-in fade-in duration-500 rounded-none shadow-sm" style={{ fontSize: `${(zoom / 100) * 12}px` }}>
       <div className="max-w-xl mx-auto">
          <div className="w-16 h-16 border border-slate-200 bg-[#f8fafc] flex items-center justify-center mx-auto mb-6 rounded-none shadow-sm">
            <ArrowLeftRight size={24} className="text-[#00B4D8]"/>
          </div>
          <h2 className="text-[#1E293B] text-2xl font-black uppercase tracking-tighter mb-3 italic">Retornos de Material</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-10 max-w-sm mx-auto leading-relaxed border-b border-slate-100 pb-6">
            Gestión técnica de liquidación. Ingrese el ID de despacho para reingresar el excedente de obra.
          </p>
          
          <div className="flex flex-col md:flex-row gap-0 border border-slate-200 shadow-sm">
             <div className="bg-[#f8fafc] p-4 border-r border-slate-200 flex items-center justify-center">
                <Search size={18} className="text-slate-300" />
             </div>
             <input 
               type="text" 
               placeholder="CÓDIGO DE PROYECTO..." 
               className="flex-1 p-4 text-[13px] font-bold uppercase outline-none placeholder:text-slate-200 bg-white"
             />
             <button className="bg-[#1E293B] text-white px-8 font-black uppercase tracking-widest text-[10px] hover:bg-[#00B4D8] transition-all rounded-none">
                LOCALIZAR
             </button>
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-4 text-slate-200">
            <RotateCcw size={12} />
            <span className="text-[9px] font-black uppercase tracking-[0.4em]">Sincronización en tiempo real</span>
          </div>
       </div>
    </div>
  );
};