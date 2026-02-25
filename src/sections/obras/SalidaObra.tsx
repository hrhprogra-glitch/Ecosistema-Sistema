// src/sections/obras/SalidaObra.tsx
import { useState, useEffect } from 'react';
import { adminService } from '../../services/db';
import { ShoppingCart, Trash2, Printer, PackagePlus } from 'lucide-react';

export const SalidaObra = ({ zoom }: { zoom: number }) => {
  const [personal, setPersonal] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [trabajadorId, setTrabajadorId] = useState('');
  const [carrito, setCarrito] = useState<any[]>([]);
  const [prodSelec, setProdSelec] = useState('');
  const [cantSelec, setCantSelec] = useState(1);

  useEffect(() => {
    adminService.obtenerTodosLosUsuarios().then(setPersonal);
    adminService.obtenerAlmacen().then(setProductos);
  }, []);

  const agregarAlCarrito = () => {
    if (!prodSelec || cantSelec <= 0) return;
    const productoReal = productos.find(p => p.id === Number(prodSelec));
    if (!productoReal) return;
    setCarrito([...carrito, { id: productoReal.id, nombre: productoReal.producto, codigo: productoReal.codigo, cantidad: cantSelec }]);
    setProdSelec('');
    setCantSelec(1);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-slate-200 bg-white animate-in fade-in duration-500 rounded-none shadow-sm" style={{ fontSize: `${(zoom / 100) * 12}px` }}>
      
      {/* SELECCIÓN - BORDES SUAVES */}
      <div className="md:col-span-4 border-r border-slate-200 p-8 bg-[#fbfcfd]">
        <div className="flex items-center gap-3 mb-8 border-l-2 border-[#00B4D8] pl-3">
          <PackagePlus className="text-[#1E293B]" size={18} />
          <h3 className="text-[#1E293B] font-black uppercase tracking-tighter text-md">Configurar Cargo</h3>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Responsable Técnico</label>
            <select 
              className="w-full bg-white border border-slate-200 p-3 text-[12px] font-bold uppercase rounded-none outline-none focus:border-[#00B4D8] transition-all"
              value={trabajadorId} onChange={e => setTrabajadorId(e.target.value)}
            >
              <option value="">-- SELECCIONAR OPERARIO --</option>
              {personal.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Insumo de Almacén</label>
            <select 
              className="w-full bg-white border border-slate-200 p-3 text-[12px] font-bold uppercase rounded-none mb-3 outline-none focus:border-[#00B4D8] transition-all"
              value={prodSelec} onChange={e => setProdSelec(e.target.value)}
            >
               <option value="">BUSCAR PRODUCTO...</option>
               {productos.map(p => <option key={p.id} value={p.id}>{p.producto} (STK: {p.stock_actual})</option>)}
            </select>
            <div className="flex gap-2">
              <input 
                type="number" min="1"
                className="w-20 bg-white border border-slate-200 p-3 text-center font-black rounded-none outline-none"
                value={cantSelec} onChange={e => setCantSelec(Number(e.target.value))}
              />
              <button onClick={agregarAlCarrito} className="flex-1 bg-[#1E293B] text-white font-black uppercase tracking-widest text-[10px] hover:bg-[#00B4D8] transition-all rounded-none shadow-sm">
                 + Añadir Ítem
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LISTA - BORDES SUAVES */}
      <div className="md:col-span-8 flex flex-col bg-white">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
           <div className="flex items-center gap-3">
             <ShoppingCart size={18} className="text-[#00B4D8]"/>
             <span className="font-black uppercase tracking-tighter text-[#1E293B]">Detalle de Despacho</span>
           </div>
           <span className="border border-slate-200 text-slate-400 px-3 py-1 text-[9px] font-black uppercase rounded-none tracking-widest">
             {carrito.length} Ítems
           </span>
        </div>

        <div className="flex-1 p-8 overflow-auto min-h-[400px]">
           <table className="w-full text-left">
              <thead>
                 <tr className="text-slate-400 border-b border-slate-100">
                    <th className="pb-4 font-black uppercase text-[9px] tracking-widest">Cant.</th>
                    <th className="pb-4 font-black uppercase text-[9px] tracking-widest">Descripción Técnica</th>
                    <th className="pb-4 text-right font-black uppercase text-[9px] tracking-widest">Eliminar</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {carrito.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                       <td className="py-4 font-black text-[#00B4D8] text-[16px] font-mono">{item.cantidad}</td>
                       <td className="py-4">
                          <p className="font-black text-[#1E293B] uppercase text-[12px]">{item.nombre}</p>
                          <p className="text-[10px] text-slate-300 font-mono tracking-widest uppercase">{item.codigo}</p>
                       </td>
                       <td className="py-4 text-right">
                          <button onClick={() => setCarrito(prev => prev.filter((_, i) => i !== idx))} className="text-slate-200 hover:text-red-500 transition-colors p-1">
                            <Trash2 size={16}/>
                          </button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
           {carrito.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 grayscale">
               <PackagePlus size={40} className="mb-2" />
               <p className="font-black uppercase tracking-[0.3em] text-[10px]">Sin movimientos</p>
             </div>
           )}
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50/30">
           <button className="w-full bg-[#1E293B] text-white font-black uppercase py-4 flex justify-center items-center gap-3 hover:bg-[#00B4D8] transition-all rounded-none tracking-widest text-[11px] shadow-sm">
              <Printer size={18} className="text-[#00B4D8]"/> Procesar y Generar PDF
           </button>
        </div>
      </div>
    </div>
  );
};