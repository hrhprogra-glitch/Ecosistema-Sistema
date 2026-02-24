import { ArrowLeftRight } from 'lucide-react';

export const DevolucionesTab = ({ zoom }: { zoom: number }) => {
  return (
    <div className="animate-in fade-in duration-500" style={{ fontSize: `${(zoom / 100) * 12}px` }}>
       <div className="bg-[#01001a] border border-green-500/20 p-10 rounded-sm text-center">
          <ArrowLeftRight size={40} className="mx-auto text-green-500 mb-4"/>
          <h2 className="text-white font-black uppercase tracking-[0.3em] mb-4">Módulo de Devoluciones</h2>
          <p className="text-slate-400 max-w-lg mx-auto mb-8">
            Seleccione el "Despacho Original" para registrar qué materiales sobraron y deben reingresar al inventario.
          </p>
          <div className="p-4 border border-dashed border-white/10 bg-white/5 inline-block">
             <span className="text-[10px] text-slate-500 font-mono">SELECCIONE ID DE SALIDA O TRABAJADOR</span>
          </div>
       </div>
    </div>
  );
};