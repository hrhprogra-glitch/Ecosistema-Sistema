import { useState, useEffect } from 'react';
import { adminService } from '../../services/db';
import { User, ShoppingCart, Trash2, Printer } from 'lucide-react';

export const SalidaObra = ({ zoom }: { zoom: number }) => {
  const [personal, setPersonal] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  
  // Estado del Despacho
  const [trabajadorId, setTrabajadorId] = useState('');
  const [carrito, setCarrito] = useState<any[]>([]);
  const [prodSelec, setProdSelec] = useState('');
  const [cantSelec, setCantSelec] = useState(1);

  useEffect(() => {
    // Cargar listas para los selects
    adminService.obtenerTodosLosUsuarios().then(setPersonal);
    adminService.obtenerAlmacen().then(setProductos);
  }, []);

  const agregarAlCarrito = () => {
    if (!prodSelec || cantSelec <= 0) return;
    const productoReal = productos.find(p => p.id === Number(prodSelec));
    if (!productoReal) return;

    setCarrito([...carrito, { 
      id: productoReal.id, 
      nombre: productoReal.producto, 
      codigo: productoReal.codigo,
      cantidad: cantSelec 
    }]);
    setProdSelec('');
    setCantSelec(1);
  };

  const confirmarSalida = () => {
    alert("Salida Registrada. Generando Hoja de Despacho PDF...");
    // Aquí iría la lógica para descontar del stock en DB
    setCarrito([]);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500" style={{ fontSize: `${(zoom / 100) * 12}px` }}>
      
      {/* PANEL IZQUIERDO: SELECCIÓN */}
      <div className="md:col-span-1 space-y-4">
        <div className="bg-[#01001a] border border-white/10 p-6 rounded-sm">
          <h3 className="text-[#00B4D8] font-black uppercase mb-4">1. Responsable</h3>
          <div className="relative mb-4">
             <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
             <select 
               className="w-full bg-black border border-white/10 p-3 pl-10 text-white outline-none focus:border-[#00B4D8]"
               value={trabajadorId} onChange={e => setTrabajadorId(e.target.value)}
             >
               <option value="">SELECCIONAR TRABAJADOR...</option>
               {personal.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
             </select>
          </div>

          <h3 className="text-[#00B4D8] font-black uppercase mb-4 mt-6">2. Agregar Material</h3>
          <select 
               className="w-full bg-black border border-white/10 p-3 text-white outline-none focus:border-[#00B4D8] mb-2"
               value={prodSelec} onChange={e => setProdSelec(e.target.value)}
          >
             <option value="">BUSCAR PRODUCTO...</option>
             {productos.map(p => <option key={p.id} value={p.id}>{p.producto} (Stock: {p.stock_actual})</option>)}
          </select>
          <div className="flex gap-2">
            <input 
              type="number" min="1"
              className="w-20 bg-black border border-white/10 p-3 text-center text-white outline-none focus:border-[#00B4D8]"
              value={cantSelec} onChange={e => setCantSelec(Number(e.target.value))}
            />
            <button onClick={agregarAlCarrito} className="flex-1 bg-white/10 text-white font-black uppercase hover:bg-white/20 transition-all">
               + Agregar
            </button>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO: LISTA DE DESPACHO */}
      <div className="md:col-span-2">
        <div className="bg-[#01001a] border border-white/10 rounded-sm h-full flex flex-col">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
             <div className="flex items-center gap-2">
               <ShoppingCart size={18} className="text-[#00B4D8]"/>
               <span className="font-black uppercase tracking-widest text-white">Lista de Salida / Hoja de Cargo</span>
             </div>
             <span className="text-[10px] text-slate-500">{carrito.length} Ítems</span>
          </div>

          <div className="flex-1 p-4 overflow-auto">
             <table className="w-full text-left text-[0.9em]">
                <thead>
                   <tr className="text-slate-500 border-b border-white/10">
                      <th className="pb-2">CANT.</th>
                      <th className="pb-2">CÓDIGO</th>
                      <th className="pb-2">DESCRIPCIÓN</th>
                      <th className="pb-2 text-right">ACCIÓN</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   {carrito.map((item, idx) => (
                      <tr key={idx} className="text-white">
                         <td className="py-2 font-black text-[#00B4D8]">{item.cantidad}</td>
                         <td className="py-2 font-mono text-slate-400">{item.codigo}</td>
                         <td className="py-2">{item.nombre}</td>
                         <td className="py-2 text-right">
                            <button onClick={() => setCarrito(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-white"><Trash2 size={14}/></button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
             {carrito.length === 0 && <p className="text-center text-slate-600 mt-10 italic">Lista vacía. Agregue productos...</p>}
          </div>

          <div className="p-4 border-t border-white/10 bg-black/20">
             <button onClick={confirmarSalida} className="w-full bg-[#00B4D8] text-black font-black uppercase py-4 flex justify-center items-center gap-2 hover:bg-white transition-all shadow-lg">
                <Printer size={18}/> Confirmar Salida e Imprimir Hoja
             </button>
          </div>
        </div>
      </div>

    </div>
  );
};