import { useState, useEffect } from 'react';
import { Search, Plus, Package, Edit2, Trash2, X, Loader2, Save, DollarSign, AlertTriangle, Printer, AlertCircle, PackagePlus, History, Calculator, CalendarClock } from 'lucide-react';
import { inventarioService } from '../../services/supabase';

// --- INTERFACES ---
interface Lote {
  id: number;
  fecha: string;
  cantidad: number;
  costo_total: number;
  costo_unitario: number;
}

interface Producto {
  id?: number;
  codigo: string;
  producto: string;  
  categoria: string;
  precio: number; // Precio de Venta
  stock_actual: number;
  costo_promedio?: number; // Costo Promedio Ponderado
  lotes?: Lote[]; // Historial JSONB
}

const inputModerno = "w-full h-12 bg-slate-50 border border-slate-300 rounded-xl px-4 text-[14px] font-medium text-slate-800 outline-none focus:bg-white focus:border-[#00B4D8] focus:ring-4 focus:ring-[#00B4D8]/20 transition-all shadow-sm";
const labelModerno = "block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1";

// Categorías extraídas de tu base de datos
const CATEGORIAS_PREDEFINIDAS = [
  'Control y Automatización',
  'Válvulas',
  'Mangueras y Tuberías',
  'Conexiones y Acoples',
  'Otros Accesorios',
  'Emisores de Riego',
  'Accesorios y Protección'
];

export const InventarioGeneral = ({ zoom }: { zoom: number }) => {
  const [almacen, setAlmacen] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  // Estados de Modales
  const [showModalProducto, setShowModalProducto] = useState(false);
  const [showModalLote, setShowModalLote] = useState(false);
  const [showModalHistorial, setShowModalHistorial] = useState(false);
  
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

  // Formularios
  const [formProducto, setFormProducto] = useState({ producto: '', categoria: '', precio: '' });
  const [formLote, setFormLote] = useState({ cantidad: '', costo_total: '' });

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await inventarioService.listar();
      setAlmacen(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleChangeProd = (campo: string, valor: string) => setFormProducto(prev => ({ ...prev, [campo]: valor }));

  // --- LÓGICA DE PRODUCTOS BASE ---
  const abrirModalProducto = (prod: Producto | null) => {
    setProductoSeleccionado(prod);
    if (prod) {
      setFormProducto({ producto: prod.producto || '', categoria: prod.categoria || '', precio: String(prod.precio || '') });
    } else {
      setFormProducto({ producto: '', categoria: '', precio: '' });
    }
    setShowModalProducto(true);
  };

  const handleGuardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProducto.producto || !formProducto.categoria || !formProducto.precio) return alert("Completa los campos obligatorios.");

    setProcesando(true);
    try {
      const payload = {
        producto: formProducto.producto.toUpperCase(),
        categoria: formProducto.categoria,
        precio: parseFloat(formProducto.precio)
      };

      if (productoSeleccionado) {
        await inventarioService.actualizar(productoSeleccionado.id!, payload);
      } else {
        const totalProds = almacen.length + 1;
        const codigoGenerado = `ITEM-${String(totalProds).padStart(3, '0')}`;
        await inventarioService.crear({ ...payload, codigo: codigoGenerado, stock_actual: 0, costo_promedio: 0, lotes: [] });
      }
      setShowModalProducto(false); await cargarDatos();
    } catch (e) { alert("Error al guardar."); } finally { setProcesando(false); }
  };

  const eliminarProducto = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este producto? Se perderá su historial de lotes.')) {
      try { await inventarioService.eliminar(id); setAlmacen(almacen.filter(p => p.id !== id)); } catch (e) { alert("Error al eliminar."); }
    }
  };

  // --- LÓGICA AVANZADA DE LOTES Y COSTO PROMEDIO ---
  const abrirModalLote = (prod: Producto) => {
    setProductoSeleccionado(prod);
    setFormLote({ cantidad: '', costo_total: '' });
    setShowModalLote(true);
  };

  const handleGuardarLote = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(formLote.cantidad);
    const cost = parseFloat(formLote.costo_total);
    if (isNaN(qty) || qty <= 0 || isNaN(cost) || cost < 0) return alert("Ingresa valores válidos mayores a cero.");

    setProcesando(true);
    try {
      const costoUnitarioLote = cost / qty;
      const stockAnterior = Math.max(0, productoSeleccionado!.stock_actual || 0);
      const costoPromedioAnterior = productoSeleccionado!.costo_promedio || 0;

      // FÓRMULA DE PROMEDIO PONDERADO HISTÓRICO
      const valorInventarioActual = stockAnterior * costoPromedioAnterior;
      const nuevoStock = stockAnterior + qty;
      const nuevoCostoPromedio = (valorInventarioActual + cost) / nuevoStock;

      const nuevoLote: Lote = {
        id: Date.now(),
        fecha: new Date().toISOString(),
        cantidad: qty,
        costo_total: cost,
        costo_unitario: costoUnitarioLote
      };

      const historialActualizado = [...(productoSeleccionado!.lotes || []), nuevoLote];

      await inventarioService.actualizar(productoSeleccionado!.id!, {
        stock_actual: nuevoStock,
        costo_promedio: nuevoCostoPromedio,
        lotes: historialActualizado
      });

      alert("✅ Lote ingresado y costo promedio actualizado.");
      setShowModalLote(false);
      await cargarDatos();
    } catch (e) {
      alert("Error al procesar el lote. Asegúrate de haber ejecutado el script SQL.");
    } finally {
      setProcesando(false);
    }
  };

  const abrirModalHistorial = (prod: Producto) => {
    setProductoSeleccionado(prod);
    setShowModalHistorial(true);
  };

  const formatearFechaHora = (isoString: string) => {
    const d = new Date(isoString);
    return {
      fecha: d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      hora: d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const productosFiltrados = almacen.filter(p => 
    p.producto?.toLowerCase().includes(busqueda.toLowerCase()) || 
    p.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="w-full animate-in fade-in duration-300" style={{ zoom: `${zoom}%` }}>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
         <div>
           <div className="flex items-center gap-3">
             <h2 className="text-2xl font-black text-slate-800 tracking-tight">Inventario y Costeo</h2>
             {loading && <Loader2 size={16} className="text-[#00B4D8] animate-spin" />}
           </div>
           <p className="text-[13px] text-slate-500 mt-1 font-medium uppercase tracking-wide">Gestiona catálogo, ingresos por lotes y promedios ponderados.</p>
         </div>
         <div className="flex gap-3 w-full md:w-auto">
            <button className="clean-btn-secondary rounded-xl">
               <Printer size={16} /> <span className="font-bold uppercase tracking-wider text-[11px]">Exportar</span>
            </button>
            <button onClick={() => abrirModalProducto(null)} className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-6 py-3 shadow-md font-black text-[12px] uppercase tracking-wider transition-all flex items-center">
               <Plus size={16} className="mr-2" /> Nuevo Material
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-[#e0f7fa] text-[#00B4D8] rounded-xl"><Package size={24} /></div>
            <div>
               <p className="text-2xl font-black text-slate-800">{almacen.length}</p>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Materiales Reg.</p>
            </div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl"><Calculator size={24} /></div>
            <div>
               <p className="text-2xl font-black text-slate-800">
                  S/ {(almacen.reduce((sum, p) => sum + (p.stock_actual * (p.costo_promedio || 0)), 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </p>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Valor Inventario Costo</p>
            </div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-xl"><DollarSign size={24} /></div>
            <div>
               <p className="text-2xl font-black text-slate-800">
                  S/ {(almacen.reduce((sum, p) => sum + (p.stock_actual * (p.precio || 0)), 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </p>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Valor Venta Estimado</p>
            </div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-500 rounded-xl"><AlertTriangle size={24} /></div>
            <div>
               <p className="text-2xl font-black text-slate-800">{almacen.filter(p => p.stock_actual <= 0).length}</p>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Agotados</p>
            </div>
         </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="flex flex-wrap justify-between items-center p-5 border-b border-slate-200 bg-slate-50/50">
           <div className="text-[12px] text-slate-500 font-bold uppercase tracking-wider">Mostrando {productosFiltrados.length} artículos</div>
           <div className="relative w-full md:w-80 mt-3 md:mt-0">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-11 pr-4 text-[13px] font-medium focus:ring-4 focus:ring-[#00B4D8]/20 focus:border-[#00B4D8] outline-none placeholder:text-slate-400 transition-all shadow-sm" placeholder="Buscar producto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
           </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-[13px] text-center">
            <thead>
              <tr className="bg-slate-100/50">
                <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-slate-500 text-left border-b border-slate-200">SKU / Artículo</th>
                <th className="py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">Categoría</th>
                <th className="py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">Venta Unid.</th>
                <th className="py-4 text-[11px] font-black uppercase tracking-widest text-orange-600 bg-orange-50/50 border-l border-b border-slate-200">Costo Ponderado</th>
                <th className="py-4 text-[11px] font-black uppercase tracking-widest text-[#00B4D8] bg-blue-50/50 border-l border-b border-slate-200">Stock Actual</th>
                <th className="py-4 text-[11px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50/50 border-l border-b border-slate-200">Lotes</th>
                <th className="py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 border-l border-b border-slate-200">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? ( <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#00B4D8]" size={32}/></td></tr> ) : 
               productosFiltrados.length > 0 ? productosFiltrados.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                    <td className="py-4 px-6 text-left">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 shadow-sm text-slate-500"><Package size={18} /></div>
                         <div className="flex flex-col">
                            <span className="text-[11px] text-[#00B4D8] font-mono font-black mb-0.5">{p.codigo}</span>
                            <span className="font-bold text-slate-800 text-[13px] uppercase leading-tight max-w-[250px] truncate" title={p.producto}>{p.producto}</span>
                         </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                       <span className="inline-flex text-slate-600 text-[10px] font-black uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 truncate max-w-[150px]" title={p.categoria}>{p.categoria}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                       <span className="font-mono font-black text-slate-800 text-[14px]">S/ {Number(p.precio).toFixed(2)}</span>
                    </td>
                    
                    {/* COSTO PONDERADO */}
                    <td className="py-4 px-4 text-center border-l border-slate-100 bg-orange-50/10">
                       <span className="font-mono font-black text-orange-600 text-[14px]">S/ {Number(p.costo_promedio || 0).toFixed(2)}</span>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Costo Compra</p>
                    </td>

                    {/* STOCK ACTUAL */}
                    <td className="py-4 px-4 text-center border-l border-slate-100 bg-blue-50/10">
                       <span className={`font-black text-[20px] leading-none ${p.stock_actual <= 0 ? 'text-red-500' : 'text-[#00B4D8]'}`}>{p.stock_actual}</span>
                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Unid.</p>
                    </td>
                    
                    {/* GESTIÓN DE LOTES */}
                    <td className="py-4 px-4 text-center border-l border-slate-100 bg-emerald-50/10">
                      <div className="flex flex-col gap-2 items-center">
                         <button onClick={() => abrirModalLote(p)} className="w-28 bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                           <PackagePlus size={14}/> Nuevo Lote
                         </button>
                         <button onClick={() => abrirModalHistorial(p)} className="w-28 bg-white border border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                           <History size={14}/> Ver Historial
                         </button>
                      </div>
                    </td>

                    {/* ACCIONES BÁSICAS */}
                    <td className="py-4 px-4 text-center border-l border-slate-100">
                      <div className="flex flex-col gap-2 items-center">
                        <button onClick={() => abrirModalProducto(p)} className="w-24 bg-slate-100 hover:bg-slate-200 text-slate-600 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors">
                          <Edit2 size={12}/> Editar
                        </button>
                        <button onClick={() => eliminarProducto(p.id!)} className="w-24 bg-red-50 hover:bg-red-100 text-red-500 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors">
                          <Trash2 size={12}/> Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              : ( <tr><td colSpan={7} className="py-24 text-center text-slate-400 font-bold">Catálogo Vacío.</td></tr> )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================
          MODAL 1: CREAR / EDITAR PRODUCTO (BASE)
      ========================================= */}
      {showModalProducto && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden border border-slate-300 animate-in zoom-in-95">
            <div className="px-8 py-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center shadow-sm"><Package size={20} /></div>
                 <h3 className="text-[18px] font-black text-slate-800 tracking-tight">{productoSeleccionado ? 'Editar Ficha' : 'Nuevo Artículo'}</h3>
              </div>
              <button onClick={() => setShowModalProducto(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleGuardarProducto} className="p-8 space-y-6 bg-slate-50/50">
              <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-5">
                 <div>
                   <label className={labelModerno}>Descripción del Artículo <span className="text-red-500">*</span></label>
                   <input required type="text" className={`${inputModerno} uppercase`} placeholder="Ej: Cemento Sol..." value={formProducto.producto} onChange={e => handleChangeProd('producto', e.target.value)} />
                 </div>
                 <div>
                   <label className={labelModerno}>Categoría <span className="text-red-500">*</span></label>
                   <select required className={`${inputModerno} cursor-pointer appearance-none uppercase`} value={formProducto.categoria} onChange={e => handleChangeProd('categoria', e.target.value)}>
                      <option value="" disabled>-- Seleccione --</option>
                      {CATEGORIAS_PREDEFINIDAS.map((cat, i) => (<option key={i} value={cat}>{cat}</option>))}
                   </select>
                 </div>
                 <div>
                   <label className={labelModerno}>Precio Venta (Público) <span className="text-red-500">*</span></label>
                   <div className="relative">
                      <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <input required type="number" step="0.01" min="0" className={`${inputModerno} pl-12 font-black font-mono text-lg`} placeholder="0.00" value={formProducto.precio} onChange={e => handleChangeProd('precio', e.target.value)} />
                   </div>
                 </div>
                 <div className="bg-[#e0f7fa]/50 border border-[#00B4D8]/30 p-4 rounded-xl flex items-start gap-3 mt-4">
                    <AlertCircle className="text-[#00B4D8] shrink-0" size={18} />
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">El stock inicial es 0. Una vez guardado el producto, utiliza el botón <b className="text-[#00B4D8]">"Nuevo Lote"</b> en la tabla para ingresar la mercancía con su costo real de compra y calcular el promedio ponderado.</p>
                 </div>
              </div>
              <button type="submit" id="btn-submit-producto" className="hidden"></button>
            </form>
            <div className="px-8 py-5 border-t border-slate-200 bg-white flex justify-end gap-4">
              <button type="button" onClick={() => setShowModalProducto(false)} className="px-6 py-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-[12px] font-black uppercase tracking-widest transition-colors">Cancelar</button>
              <button disabled={procesando} onClick={() => document.getElementById('btn-submit-producto')?.click()} className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg disabled:opacity-70">
                 {procesando ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Guardar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 2: INGRESAR NUEVO LOTE (CALCULA PROMEDIO)
      ========================================= */}
      {showModalLote && productoSeleccionado && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-t-emerald-500 border border-slate-200 overflow-hidden animate-in zoom-in-95">
             <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="text-[16px] font-black text-emerald-600 uppercase flex items-center gap-2 tracking-tight">
                   <PackagePlus size={20}/> Ingresar Lote de Compra
                </h3>
                <button onClick={() => setShowModalLote(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
             </div>
             
             <form onSubmit={handleGuardarLote} className="p-8 space-y-6">
                <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl text-center">
                  <p className="text-[13px] font-black text-slate-800 uppercase tracking-tight">{productoSeleccionado.producto}</p>
                  <p className="text-[10px] font-bold text-slate-500 font-mono mt-1">{productoSeleccionado.codigo}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className={labelModerno}>Cant. Adquirida</label>
                      <input required type="number" min="1" className={`${inputModerno} text-center font-black text-xl text-[#00B4D8]`} placeholder="0" value={formLote.cantidad} onChange={e => setFormLote({...formLote, cantidad: e.target.value})} />
                   </div>
                   <div>
                      <label className={labelModerno}>Costo Total Lote</label>
                      <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">S/</span>
                         <input required type="number" step="0.01" min="0" className={`${inputModerno} pl-10 text-center font-black text-xl text-emerald-600`} placeholder="0.00" value={formLote.costo_total} onChange={e => setFormLote({...formLote, costo_total: e.target.value})} />
                      </div>
                   </div>
                </div>

                {/* VISUALIZADOR DE CÁLCULO EN TIEMPO REAL */}
                {Number(formLote.cantidad) > 0 && Number(formLote.costo_total) >= 0 && (
                   <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl shadow-inner text-center animate-in fade-in">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Costo Unitario de este lote</p>
                      <p className="text-3xl font-black text-emerald-700 font-mono">S/ {(Number(formLote.costo_total) / Number(formLote.cantidad)).toFixed(2)}</p>
                      <p className="text-[10px] text-emerald-600 font-medium mt-2">El sistema promediará este valor automáticamente con tu stock actual ({productoSeleccionado.stock_actual} unid. a S/ {(productoSeleccionado.costo_promedio || 0).toFixed(2)}).</p>
                   </div>
                )}

                <button disabled={procesando} type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl flex justify-center items-center gap-2 font-black uppercase tracking-widest text-[13px] transition-all shadow-md shadow-emerald-500/30 disabled:opacity-50 mt-4">
                  {procesando ? <Loader2 size={18} className="animate-spin"/> : <><Save size={18}/> Cargar al Inventario</>}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 3: HISTORIAL DE LOTES (AUDITORÍA)
      ========================================= */}
      {showModalHistorial && productoSeleccionado && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-200 overflow-hidden animate-in zoom-in-95 flex flex-col h-[80vh]">
             <div className="px-8 py-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-blue-50 text-[#00B4D8] rounded-xl flex items-center justify-center"><History size={24} /></div>
                   <div>
                     <h3 className="text-[18px] font-black text-slate-800 uppercase tracking-tight leading-tight">Auditoría de Lotes de Ingreso</h3>
                     <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">{productoSeleccionado.codigo} • {productoSeleccionado.producto}</p>
                   </div>
                </div>
                <button onClick={() => setShowModalHistorial(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-white rounded-xl border border-slate-200 shadow-sm"><X size={20}/></button>
             </div>
             
             <div className="flex-1 bg-slate-50 p-8 overflow-y-auto custom-scrollbar">
                {(productoSeleccionado.lotes || []).length > 0 ? (
                  <div className="space-y-4">
                     {[...(productoSeleccionado.lotes || [])].reverse().map((lote, idx) => {
                        const { fecha, hora } = formatearFechaHora(lote.fecha);
                        return (
                           <div key={lote.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 hover:border-[#00B4D8]/30 transition-colors">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-slate-100 rounded-full flex flex-col items-center justify-center border border-slate-200 shrink-0 text-slate-500">
                                   <CalendarClock size={20}/>
                                 </div>
                                 <div>
                                    <p className="font-mono font-black text-slate-800 text-[14px]">{fecha}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{hora}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-8 md:text-right border-l-2 border-slate-100 pl-8">
                                 <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cantidad Ingresada</p>
                                    <p className="font-black text-2xl text-[#00B4D8]">{lote.cantidad} <span className="text-[12px] uppercase">Und.</span></p>
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inversión Lote</p>
                                    <p className="font-black font-mono text-[16px] text-slate-800">S/ {lote.costo_total.toFixed(2)}</p>
                                 </div>
                                 <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg">
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Costo Unit.</p>
                                    <p className="font-black font-mono text-[16px] text-emerald-700">S/ {lote.costo_unitario.toFixed(2)}</p>
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
                     <History size={48} className="mx-auto mb-4 text-slate-300"/>
                     <p className="text-[16px] font-black text-slate-700">Aún no hay ingresos de lotes</p>
                     <p className="text-[13px] text-slate-500 font-medium mt-1">Cuando ingreses stock, el historial detallado aparecerá aquí.</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

    </div>
  );
};