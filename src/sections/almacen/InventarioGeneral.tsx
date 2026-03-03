// src/sections/almacen/InventarioGeneral.tsx
import { useState, useEffect } from 'react';
import { Search, Plus, Package, Edit2, Trash2, X, Loader2, Save, DollarSign, AlertTriangle, Calculator, CalendarClock, Box, Scale, Ruler, History } from 'lucide-react';
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
  precio: number; 
  stock_actual: number;
  unidad_medida?: string; 
  costo_promedio?: number; 
  lotes?: Lote[]; 
}

// ESTILOS TÉCNICOS DE ALTO CONTRASTE Y GEOMETRÍA CUADRADA
const inputModerno = "w-full h-12 bg-white border border-slate-200 rounded-none px-4 text-[13px] font-bold text-[#1E293B] uppercase outline-none focus:border-[#00B4D8] transition-all shadow-none";
const labelModerno = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2";

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
  
  // --- CONTROL DE PERMISOS ---
  const [usuario, setUsuario] = useState<any>(null);
  const puedeVerPrecios = usuario?.role === 'admin';

  // Estados de Modales
  const [showModalProducto, setShowModalProducto] = useState(false);
  const [showModalLote, setShowModalLote] = useState(false);
  const [showModalHistorial, setShowModalHistorial] = useState(false);
  
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

  // Formularios
  const [formProducto, setFormProducto] = useState({ producto: '', categoria: '', precio: '', unidad_medida: 'Unidad', stock_actual: '' });
  const [formLote, setFormLote] = useState({ cantidad: '', costo_total: '' });

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await inventarioService.listar();
      setAlmacen(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { 
    const session = localStorage.getItem('userSession');
    if (session) {
      setUsuario(JSON.parse(session));
    }
    cargarDatos(); 
  }, []);

  const handleChangeProd = (campo: string, valor: string) => setFormProducto(prev => ({ ...prev, [campo]: valor }));

  // --- LÓGICA DE PRODUCTOS Y AJUSTE MANUAL ---
  const abrirModalProducto = (prod: Producto | null) => {
    setProductoSeleccionado(prod);
    if (prod) {
      setFormProducto({ 
        producto: prod.producto || '', 
        categoria: prod.categoria || '', 
        precio: String(prod.precio || ''),
        unidad_medida: prod.unidad_medida || 'Unidad',
        stock_actual: String(prod.stock_actual || 0)
      });
    } else {
      setFormProducto({ producto: '', categoria: '', precio: '', unidad_medida: 'Unidad', stock_actual: '0' });
    }
    setShowModalProducto(true);
  };

  const handleGuardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProducto.producto || !formProducto.categoria) return alert("Completa los campos obligatorios.");

    setProcesando(true);
    try {
      const payload: any = {
        producto: formProducto.producto.toUpperCase(),
        categoria: formProducto.categoria,
        unidad_medida: formProducto.unidad_medida
      };

      // Si puede ver precios, lo actualiza. Si no, lo deja como estaba o lo pone en 0 si es nuevo.
      if (puedeVerPrecios) {
        payload.precio = parseFloat(formProducto.precio || '0');
      } else if (!productoSeleccionado) {
        payload.precio = 0; 
      }

      if (productoSeleccionado) {
        payload.stock_actual = parseFloat(formProducto.stock_actual);
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
    if (confirm('¿Estás seguro de eliminar este artículo por completo del sistema? Se perderá su historial.')) {
      try { await inventarioService.eliminar(id); setAlmacen(almacen.filter(p => p.id !== id)); } catch (e) { alert("Error al eliminar."); }
    }
  };

  // --- LÓGICA DE LOTES Y CÁLCULO ---
  const abrirModalLote = (prod: Producto) => {
    setProductoSeleccionado(prod);
    setFormLote({ cantidad: '', costo_total: '' });
    setShowModalLote(true);
  };

  const handleGuardarLote = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(formLote.cantidad);
    
    // Si el usuario no tiene permisos de precio, calculamos el costo asumiendo el costo promedio anterior para no arruinar la data contable
    const costoPromedioAnterior = productoSeleccionado!.costo_promedio || 0;
    const cost = puedeVerPrecios ? parseFloat(formLote.costo_total) : (qty * costoPromedioAnterior);

    if (isNaN(qty) || qty <= 0 || (puedeVerPrecios && (isNaN(cost) || cost < 0))) {
      return alert("Ingresa valores válidos mayores a cero.");
    }

    setProcesando(true);
    try {
      const costoUnitarioLote = cost / qty;
      const stockAnterior = Math.max(0, productoSeleccionado!.stock_actual || 0);

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

      alert("✅ Lote ingresado exitosamente.");
      setShowModalLote(false);
      await cargarDatos();
    } catch (e) { alert("Error al procesar el lote."); } finally { setProcesando(false); }
  };

  const eliminarLote = async (idLote: number) => {
     if (!confirm("¿Eliminar esta compra del historial? Se restará del stock actual y recalculará el costo.")) return;
     
     const loteAElminar = productoSeleccionado!.lotes!.find(l => l.id === idLote);
     if (!loteAElminar) return;

     setProcesando(true);
     try {
        const historialNuevo = productoSeleccionado!.lotes!.filter(l => l.id !== idLote);
        const stockAnterior = Math.max(0, productoSeleccionado!.stock_actual);
        const nuevoStock = Math.max(0, stockAnterior - loteAElminar.cantidad);
        
        let nuevoCostoPromedio = 0;
        if (nuevoStock > 0) {
           const valorInventarioActual = stockAnterior * (productoSeleccionado!.costo_promedio || 0);
           const valorRestante = Math.max(0, valorInventarioActual - loteAElminar.costo_total);
           nuevoCostoPromedio = valorRestante / nuevoStock;
        }

        const payload = {
          stock_actual: nuevoStock,
          costo_promedio: nuevoCostoPromedio,
          lotes: historialNuevo
        };

        await inventarioService.actualizar(productoSeleccionado!.id!, payload);
        setProductoSeleccionado({ ...productoSeleccionado!, ...payload });
        await cargarDatos();
     } catch (e) {
        alert("Error al eliminar el lote.");
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
    return { fecha: d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }), hora: d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) };
  };

  const formatStock = (val: number) => Number.isInteger(val) ? val : parseFloat(Number(val).toFixed(3));
  
  const getSiglaUnidad = (unidad?: string) => {
     if(!unidad) return 'UND';
     if(unidad === 'Unidad') return 'UND';
     return unidad.toUpperCase();
  };

  const productosFiltrados = almacen.filter(p => 
    p.producto?.toLowerCase().includes(busqueda.toLowerCase()) || 
    p.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="w-full animate-in fade-in duration-300 bg-white" style={{ zoom: `${zoom}%` }}>
      
      {/* HEADER TÉCNICO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 p-6 border-l-[12px] border-[#1E293B] bg-white shadow-sm border-y border-r border-slate-200">
         <div>
           <div className="flex items-center gap-3">
             <h2 className="text-3xl font-black text-[#1E293B] uppercase tracking-tighter italic">Catálogo Maestro</h2>
             {loading && <Loader2 size={16} className="text-[#00B4D8] animate-spin" />}
           </div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Gestión Estructural de Inventarios</p>
         </div>
         <div className="flex gap-3 w-full md:w-auto">
            <button onClick={() => abrirModalProducto(null)} className="bg-[#1E293B] hover:bg-[#00B4D8] text-white rounded-none px-6 py-4 shadow-none font-black text-[10px] uppercase tracking-widest transition-all flex items-center">
               <Plus size={16} className="mr-2" /> Ingresar Nueva Ficha
            </button>
         </div>
      </div>

      {/* MÉTRICAS PLANAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-slate-200 mb-8 bg-slate-50">
         <div className="bg-white p-6 border-r border-slate-200 flex items-center gap-4">
            <div className="p-3 border border-slate-200 text-[#00B4D8] bg-slate-50"><Package size={24} /></div>
            <div>
               <p className="text-2xl font-black text-[#1E293B] font-mono">{almacen.length}</p>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Materiales Reg.</p>
            </div>
         </div>
         
         {/* SOLO ADMINS VEN ESTO */}
         {puedeVerPrecios && (
           <>
             <div className="bg-white p-6 border-r border-slate-200 flex items-center gap-4">
                <div className="p-3 border border-slate-200 text-[#1E293B] bg-slate-50"><Calculator size={24} /></div>
                <div>
                   <p className="text-2xl font-black text-[#1E293B] font-mono">
                      S/ {(almacen.reduce((sum, p) => sum + (Math.max(0, p.stock_actual) * (p.costo_promedio || 0)), 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                   </p>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Inventario (Costo)</p>
                </div>
             </div>
             <div className="bg-white p-6 border-r border-slate-200 flex items-center gap-4">
                <div className="p-3 border border-slate-200 text-[#1E293B] bg-slate-50"><DollarSign size={24} /></div>
                <div>
                   <p className="text-2xl font-black text-[#1E293B] font-mono">
                      S/ {(almacen.reduce((sum, p) => sum + (Math.max(0, p.stock_actual) * (p.precio || 0)), 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                   </p>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Valor Venta Estimado</p>
                </div>
             </div>
           </>
         )}

         <div className={`bg-white p-6 flex items-center gap-4 ${!puedeVerPrecios && 'col-span-3'}`}>
            <div className="p-3 border border-orange-200 text-orange-500 bg-orange-50"><AlertTriangle size={24} /></div>
            <div>
               <p className="text-2xl font-black text-orange-600 font-mono">{almacen.filter(p => p.stock_actual <= 0).length}</p>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Agotados / Crítico</p>
            </div>
         </div>
      </div>

      {/* TABLA DE INVENTARIO CUADRADA */}
      <div className="bg-white border border-slate-200 rounded-none shadow-none mb-6">
        <div className="flex flex-wrap justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
           <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Mostrando {productosFiltrados.length} Registros Técnicos</div>
           <div className="relative w-full md:w-96 mt-3 md:mt-0">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="w-full bg-white border border-slate-200 rounded-none py-3 pl-11 pr-4 text-[12px] font-bold uppercase focus:border-[#00B4D8] outline-none placeholder:text-slate-300 transition-all shadow-none" placeholder="BUSCAR CÓDIGO, DESCRIPCIÓN O CATEGORÍA..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
           </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-white border-b-2 border-slate-200 text-[#1E293B]">
                <th className="py-4 px-6 text-[9px] font-black uppercase tracking-widest text-left">SKU / Especificación</th>
                <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest">Familia</th>
                <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest">Ud. Medida</th>
                
                {puedeVerPrecios && (
                  <>
                    <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest">Venta Público</th>
                    <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 border-l border-slate-200">Costo Base</th>
                  </>
                )}

                <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest text-[#00B4D8] bg-[#f0f9ff] border-l border-slate-200">Stock Actual</th>
                <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest border-l border-slate-200">Operaciones Stock</th>
                <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest border-l border-slate-200">Ficha Técnica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? ( <tr><td colSpan={8} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#00B4D8]" size={32}/></td></tr> ) : 
               productosFiltrados.length > 0 ? productosFiltrados.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors bg-white">
                    <td className="py-4 px-6 text-left max-w-[250px]">
                      <div className="flex items-start gap-4">
                         <div className="w-10 h-10 bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200 text-slate-400 rounded-none">
                           {p.unidad_medida === 'Kilos' ? <Scale size={18}/> : p.unidad_medida === 'Metros' ? <Ruler size={18}/> : <Package size={18}/>}
                         </div>
                         <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[11px] text-[#00B4D8] font-mono font-black">{p.codigo}</span>
                            <span className="font-black text-[#1E293B] text-[12px] uppercase leading-tight mt-1">{p.producto}</span>
                         </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4 text-center align-middle">
                       <span className="inline-block text-center text-[#1E293B] text-[9px] font-black uppercase tracking-widest bg-slate-100 px-2 py-1 border border-slate-200 rounded-none shadow-none">
                         {p.categoria}
                       </span>
                    </td>
                    
                    <td className="py-4 px-4 text-center align-middle">
                       <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-none">
                         {p.unidad_medida || 'UNIDAD'}
                       </span>
                    </td>

                    {puedeVerPrecios && (
                      <>
                        <td className="py-4 px-4 text-center align-middle">
                           <span className="font-mono font-black text-[#1E293B] text-[14px]">S/ {Number(p.precio).toFixed(2)}</span>
                        </td>
                        <td className="py-4 px-4 text-center align-middle border-l border-slate-200 bg-slate-50">
                           <span className="font-mono font-black text-slate-500 text-[14px]">S/ {Number(p.costo_promedio || 0).toFixed(2)}</span>
                        </td>
                      </>
                    )}

                    <td className="py-4 px-4 text-center align-middle border-l border-slate-200 bg-[#fbfcfd]">
                       <span className={`font-mono font-black text-[20px] leading-none ${p.stock_actual <= 0 ? 'text-orange-500' : 'text-[#00B4D8]'}`}>
                         {formatStock(p.stock_actual)} 
                         <span className="text-[10px] font-bold ml-1 uppercase">{getSiglaUnidad(p.unidad_medida)}</span>
                       </span>
                    </td>
                    
                    <td className="py-4 px-4 text-center align-middle border-l border-slate-200">
                      <div className="flex flex-col gap-2 items-center">
                         <button onClick={() => abrirModalLote(p)} className="w-28 bg-white border border-[#1E293B] text-[#1E293B] hover:bg-[#1E293B] hover:text-white py-1.5 rounded-none text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors">
                           <Plus size={12}/> Entrada
                         </button>
                         <button onClick={() => abrirModalHistorial(p)} className="w-28 bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-200 py-1.5 rounded-none text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors">
                           <History size={12}/> Auditar
                         </button>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center align-middle border-l border-slate-200">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => abrirModalProducto(p)} className="p-2 bg-slate-50 border border-slate-200 hover:bg-[#00B4D8] hover:text-white hover:border-[#00B4D8] text-slate-400 rounded-none transition-colors">
                          <Edit2 size={14}/>
                        </button>
                        <button onClick={() => eliminarProducto(p.id!)} className="p-2 bg-slate-50 border border-slate-200 hover:bg-red-500 hover:text-white hover:border-red-500 text-slate-400 rounded-none transition-colors">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              : ( <tr><td colSpan={8} className="py-24 text-center text-slate-400 font-black uppercase text-[12px] tracking-[0.3em]">Directorio de Materiales Vacío.</td></tr> )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================
          MODAL 1: CREAR / EDITAR PRODUCTO
      ========================================= */}
      {showModalProducto && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#1E293B]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-none shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border-t-8 border-[#00B4D8] animate-in zoom-in-95">
            
            <div className="px-8 py-6 border-b border-slate-100 bg-white flex justify-between items-start shrink-0">
              <div>
                 <h3 className="text-xl font-black text-[#1E293B] uppercase tracking-tighter italic">{productoSeleccionado ? 'Modificar Especificación Técnica' : 'Apertura de Ficha de Material'}</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Definición de propiedades para el catálogo base</p>
              </div>
              <button onClick={() => setShowModalProducto(false)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleGuardarProducto} className="p-8 space-y-6 bg-slate-50 overflow-y-auto max-h-[70vh]">
              
              <div className="bg-white p-6 border border-slate-200 shadow-sm space-y-5 rounded-none">
                 <div>
                   <label className={labelModerno}>Descripción Oficial <span className="text-[#00B4D8]">*</span></label>
                   <input required type="text" className={`${inputModerno}`} placeholder="Ej: TUBO PVC 2 PULGADAS AGUA FRIA..." value={formProducto.producto} onChange={e => handleChangeProd('producto', e.target.value)} />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div>
                     <label className={labelModerno}>Familia Comercial <span className="text-[#00B4D8]">*</span></label>
                     <select required className={`${inputModerno} cursor-pointer appearance-none`} value={formProducto.categoria} onChange={e => handleChangeProd('categoria', e.target.value)}>
                        <option value="" disabled>-- SELECCIONAR FAMILIA --</option>
                        {CATEGORIAS_PREDEFINIDAS.map((cat, i) => (<option key={i} value={cat}>{cat}</option>))}
                     </select>
                   </div>
                   
                   {/* SOLO ADMINS VEN Y EDITAN PRECIO */}
                   {puedeVerPrecios && (
                     <div>
                       <label className={labelModerno}>Precio de Lista (PVP) <span className="text-[#00B4D8]">*</span></label>
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#1E293B]">S/</span>
                          <input required type="number" step="0.01" min="0" className={`${inputModerno} pl-10 text-center font-mono text-lg text-[#00B4D8]`} placeholder="0.00" value={formProducto.precio} onChange={e => handleChangeProd('precio', e.target.value)} />
                       </div>
                     </div>
                   )}
                 </div>

                 {productoSeleccionado && (
                   <div className="pt-5 border-t border-slate-100">
                     <label className={labelModerno}>Cuadre Manual de Inventario <span className="text-[#00B4D8]">*</span></label>
                     <div className="relative">
                        <Package size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500"/>
                        <input required type="number" step="0.01" min="0" className={`${inputModerno} pl-12 font-mono text-lg text-[#1E293B]`} value={formProducto.stock_actual} onChange={e => handleChangeProd('stock_actual', e.target.value)} />
                     </div>
                     <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase tracking-widest italic">Intervención directa: Solo para ajustes de merma o auditoría física.</p>
                   </div>
                 )}
              </div>

              <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-none">
                 <label className={labelModerno}>Formato de Despacho <span className="text-[#00B4D8]">*</span></label>
                 
                 <div className="grid grid-cols-3 gap-4 mt-4">
                    {[
                      { id: 'Unidad', icon: <Box size={20}/> },
                      { id: 'Kilos', icon: <Scale size={20}/> },
                      { id: 'Metros', icon: <Ruler size={20}/> }
                    ].map(u => {
                      const isActive = formProducto.unidad_medida === u.id;
                      return (
                        <button
                           type="button"
                           key={u.id}
                           onClick={() => handleChangeProd('unidad_medida', u.id)}
                           className={`p-4 rounded-none border-2 flex flex-col items-center justify-center gap-3 transition-all outline-none
                             ${isActive 
                               ? 'border-[#00B4D8] bg-[#f0f9ff] text-[#00B4D8]' 
                               : 'border-slate-100 bg-white text-slate-400 hover:border-[#1E293B] hover:text-[#1E293B]'}`}
                        >
                           <div>{u.icon}</div>
                           <span className="text-[10px] font-black uppercase tracking-widest">{u.id}</span>
                        </button>
                      );
                    })}
                 </div>
              </div>

              <button type="submit" id="btn-submit-producto" className="hidden"></button>
            </form>
            
            <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end gap-4 shrink-0">
              <button type="button" onClick={() => setShowModalProducto(false)} className="px-8 py-4 bg-white border border-transparent text-slate-400 hover:text-[#1E293B] rounded-none text-[10px] font-black uppercase tracking-widest transition-colors">Abortar</button>
              <button disabled={procesando} onClick={() => document.getElementById('btn-submit-producto')?.click()} className="px-8 py-4 bg-[#1E293B] hover:bg-[#00B4D8] text-white rounded-none text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm disabled:opacity-50 transition-all">
                 {procesando ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Procesar Ficha Técnica
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 2: INGRESAR NUEVO LOTE
      ========================================= */}
      {showModalLote && productoSeleccionado && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#1E293B]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-none shadow-2xl w-full max-w-md border-t-8 border-[#1E293B] overflow-hidden animate-in zoom-in-95">
             <div className="px-8 py-6 border-b border-slate-100 bg-white flex justify-between items-center">
                <h3 className="text-lg font-black text-[#1E293B] uppercase flex items-center gap-2 tracking-tighter italic">
                   Declaración de Ingreso
                </h3>
                <button onClick={() => setShowModalLote(false)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={20}/></button>
             </div>
             
             <form onSubmit={handleGuardarLote} className="p-8 space-y-6">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-none text-center">
                  <p className="text-[12px] font-black text-[#1E293B] uppercase tracking-tighter">{productoSeleccionado.producto}</p>
                  <p className="text-[10px] font-bold text-[#00B4D8] font-mono mt-1">{productoSeleccionado.codigo}</p>
                </div>

                <div className={`grid ${puedeVerPrecios ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                   <div>
                      <label className={labelModerno}>Volumen Entrante</label>
                      <div className="relative">
                        <input required type="number" step="0.01" min="0.01" className={`${inputModerno} text-center font-mono text-xl text-[#00B4D8]`} placeholder="0.00" value={formLote.cantidad} onChange={e => setFormLote({...formLote, cantidad: e.target.value})} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">{getSiglaUnidad(productoSeleccionado.unidad_medida)}</span>
                      </div>
                   </div>

                   {/* SOLO ADMINS INGRESAN COSTOS, LOS SUPERVISORES SOLO SUMAN STOCK */}
                   {puedeVerPrecios && (
                     <div>
                        <label className={labelModerno}>Inversión Total</label>
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E293B] font-black">S/</span>
                           <input required type="number" step="0.01" min="0" className={`${inputModerno} pl-10 text-center font-mono text-xl text-[#1E293B]`} placeholder="0.00" value={formLote.costo_total} onChange={e => setFormLote({...formLote, costo_total: e.target.value})} />
                        </div>
                     </div>
                   )}
                </div>

                {puedeVerPrecios && Number(formLote.cantidad) > 0 && Number(formLote.costo_total) >= 0 && (
                   <div className="bg-[#f0f9ff] border border-[#00B4D8] p-5 rounded-none shadow-none text-center animate-in fade-in">
                      <p className="text-[9px] font-black text-[#00B4D8] uppercase tracking-widest mb-1">Costo Unitario (Lote Actual)</p>
                      <p className="text-2xl font-black text-[#1E293B] font-mono">S/ {(Number(formLote.costo_total) / Number(formLote.cantidad)).toFixed(2)}</p>
                      <p className="text-[9px] text-slate-500 font-bold mt-2 uppercase tracking-widest italic">El sistema ajustará el promedio global automáticamente.</p>
                   </div>
                )}

                <button disabled={procesando} type="submit" className="w-full bg-[#1E293B] hover:bg-[#00B4D8] text-white py-4 rounded-none flex justify-center items-center gap-2 font-black uppercase tracking-widest text-[11px] transition-all shadow-none disabled:opacity-50 mt-4">
                  {procesando ? <Loader2 size={18} className="animate-spin"/> : "Inyectar a Inventario"}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 3: HISTORIAL DE LOTES
      ========================================= */}
      {showModalHistorial && productoSeleccionado && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#1E293B]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-none shadow-2xl w-full max-w-4xl border border-slate-200 overflow-hidden animate-in zoom-in-95 flex flex-col h-[80vh]">
             <div className="px-8 py-6 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-[#1E293B] text-[#00B4D8] rounded-none flex items-center justify-center"><History size={20} /></div>
                   <div className="flex-1 min-w-0 pr-4">
                     <h3 className="text-xl font-black text-[#1E293B] uppercase tracking-tighter italic">Auditoría de Inyecciones</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1"><span className="text-[#00B4D8] font-mono">{productoSeleccionado.codigo}</span> — {productoSeleccionado.producto}</p>
                   </div>
                </div>
                <button onClick={() => setShowModalHistorial(false)} className="p-2 text-slate-300 hover:text-red-500 transition-colors bg-white rounded-none border border-transparent hover:border-slate-200 shadow-none shrink-0"><X size={24}/></button>
             </div>
             
             <div className="flex-1 bg-slate-50 p-8 overflow-y-auto">
                {(productoSeleccionado.lotes || []).length > 0 ? (
                  <div className="space-y-4">
                     {[...(productoSeleccionado.lotes || [])].reverse().map((lote) => {
                        const { fecha, hora } = formatearFechaHora(lote.fecha);
                        return (
                           <div key={lote.id} className="bg-white border border-slate-200 rounded-none p-5 shadow-none flex flex-col md:flex-row justify-between items-center gap-4 hover:border-[#00B4D8] transition-colors group">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-slate-400 rounded-none">
                                   <CalendarClock size={16}/>
                                 </div>
                                 <div>
                                    <p className="font-mono font-black text-[#1E293B] text-[13px]">{fecha}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{hora}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-8 md:text-right border-l border-slate-200 pl-8">
                                 <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Volumen Agregado</p>
                                    <p className="font-black font-mono text-xl text-[#00B4D8]">{formatStock(lote.cantidad)} <span className="text-[10px] uppercase font-sans text-slate-400">{getSiglaUnidad(productoSeleccionado.unidad_medida)}</span></p>
                                 </div>
                                 
                                 {/* SOLO ADMINS VEN ESTAS DOS COLUMNAS DE DINERO EN EL HISTORIAL */}
                                 {puedeVerPrecios && (
                                   <>
                                     <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Gasto Declarado</p>
                                        <p className="font-black font-mono text-[16px] text-[#1E293B]">S/ {lote.costo_total.toFixed(2)}</p>
                                     </div>
                                     <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-none">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Ratio Unit.</p>
                                        <p className="font-black font-mono text-[16px] text-[#1E293B]">S/ {lote.costo_unitario.toFixed(2)}</p>
                                     </div>
                                   </>
                                 )}
                                 
                                 <div className="border-l border-slate-200 pl-4">
                                    <button 
                                      onClick={() => eliminarLote(lote.id)} 
                                      className="p-3 text-slate-300 hover:text-white hover:bg-red-500 hover:border-red-500 border border-transparent rounded-none transition-colors"
                                      title="Anular ingreso contable"
                                    >
                                      {procesando ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    </button>
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>
                ) : (
                  <div className="text-center py-32 bg-white rounded-none border border-slate-200 shadow-none">
                     <History size={48} className="mx-auto mb-4 text-slate-200"/>
                     <p className="text-[12px] font-black uppercase tracking-widest text-[#1E293B]">Historial en Blanco</p>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">No se detectan movimientos de entrada para este material.</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

    </div>
  );
};