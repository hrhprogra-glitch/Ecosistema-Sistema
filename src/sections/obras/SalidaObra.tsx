// src/sections/obras/SalidaObra.tsx
import { useState, useEffect, useRef } from 'react';
import { inventarioService, obrasService, usuariosService } from '../../services/supabase';
import { ShoppingCart, Trash2, Printer, PackagePlus, ArrowUpRight, ArrowDownRight, Loader2, Plus, Minus, Check, Users } from 'lucide-react';

export const SalidaObra = ({ zoom, obraInicial }: { zoom: number, obraInicial?: any }) => {
  const [personal, setPersonal] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [trabajadoresSeleccionados, setTrabajadoresSeleccionados] = useState<any[]>([]);
  
  const [carrito, setCarrito] = useState<any[]>([]);
  const [itemsOriginales, setItemsOriginales] = useState<any[]>([]); 
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [prodSelec, setProdSelec] = useState('');
  const [cantSelec, setCantSelec] = useState(1);
  const [busquedaProd, setBusquedaProd] = useState('');
  const [cargando, setCargando] = useState(false);
  const [guardadoExito, setGuardadoExito] = useState(false);
  const [obraActiva, setObraActiva] = useState<any>(null);
  const [obraCargadaId, setObraCargadaId] = useState<number | null>(null);
  const [indexResaltado, setIndexResaltado] = useState(0);
  // 🟢 REFERENCIAS PARA EL TECLADO
  const prodSelectRef = useRef<HTMLSelectElement>(null);
  const cantInputRef = useRef<HTMLInputElement>(null);

  const cargarInventario = async () => {
    const [inv, usu] = await Promise.all([inventarioService.listar(), usuariosService.listar()]);
    setProductos(inv || []);
    setPersonal(usu || []);
  };
  // Cerrar resultados al hacer clic fuera del buscador
  useEffect(() => {
    const handleClickFuera = () => setMostrarResultados(false); // <--- AHORA SÍ ENCONTRARÁ LA FUNCIÓN
    window.addEventListener('click', handleClickFuera);
    return () => window.removeEventListener('click', handleClickFuera);
  }, []);
  useEffect(() => { cargarInventario(); }, []);

  useEffect(() => {
    if (obraInicial && productos.length > 0 && obraCargadaId !== obraInicial.id) {
      setObraActiva(obraInicial);
      if (obraInicial.trabajadores_asignados) {
        setTrabajadoresSeleccionados(obraInicial.trabajadores_asignados);
      } else {
        setTrabajadoresSeleccionados([]);
      }
      if (obraInicial.materiales_asignados) {
         const cargados = obraInicial.materiales_asignados.map((m: any) => {
            const prodDB = productos.find(p => p.codigo === m.codigo);
            return {
               id: prodDB ? prodDB.id : Date.now() + Math.random(),
               codigo: m.codigo,
               nombre: m.producto,
               cantidad: Number(m.cantidad),
               precio: Number(m.precioUnit) || 0
            };
         });
         setCarrito(cargados);
         setItemsOriginales(JSON.parse(JSON.stringify(cargados))); 
      } else {
         setCarrito([]);
         setItemsOriginales([]);
      }
      setObraCargadaId(obraInicial.id); 
    }
  }, [obraInicial, productos, obraCargadaId]);

  // 🟢 ATAJOS DE TECLADO GLOBALES (F2 y F9)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // F2: Enfocar el buscador de productos
      if (e.key === 'F2') {
        e.preventDefault();
        prodSelectRef.current?.focus();
      }
      // F9: Procesar (Hacemos click virtual en el botón para usar el estado más reciente)
      if (e.key === 'F9') {
        e.preventDefault();
        document.getElementById('btn-procesar')?.click();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const agregarAlCarrito = (tipo: 'SALIDA' | 'DEVOLUCION') => {
    if (!prodSelec || cantSelec <= 0) return;
    const productoReal = productos.find(p => p.id === Number(prodSelec));
    if (!productoReal) return;
    
    setCarrito(prev => {
      const newCarrito = [...prev];
      const index = newCarrito.findIndex(c => c.codigo === productoReal.codigo);

      if (index >= 0) {
         if (tipo === 'SALIDA') newCarrito[index].cantidad += cantSelec;
         else newCarrito[index].cantidad = Math.max(0, newCarrito[index].cantidad - cantSelec);
      } else {
         newCarrito.push({
           id: productoReal.id, 
           nombre: productoReal.producto, 
           codigo: productoReal.codigo, 
           cantidad: tipo === 'SALIDA' ? cantSelec : 0, 
           precio: productoReal.precio || 0
         });
      }
      return newCarrito;
    });
    
    setProdSelec('');
    setCantSelec(1);
    
    // 🟢 Regresa el foco al selector de productos para seguir escaneando/buscando
    setTimeout(() => prodSelectRef.current?.focus(), 50);
    setBusquedaProd(''); // Limpia el texto del buscador
    setMostrarResultados(false); // Cierra la lista de resultados
  };

  // 🟢 MANEJAR "ENTER" EN EL INPUT DE CANTIDAD
  const handleCantKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        agregarAlCarrito('DEVOLUCION'); // Shift + Enter
      } else {
        agregarAlCarrito('SALIDA'); // Enter normal
      }
    }
  };

  const modificarCantidad = (idx: number, delta: number) => {
     setCarrito(prev => {
       const newCarrito = [...prev];
       newCarrito[idx].cantidad = Math.max(0, newCarrito[idx].cantidad + delta);
       return newCarrito;
     });
  };

  const procesarMovimientos = async () => {
    if (!obraActiva) return;
    setCargando(true);
    
    try {
       const oldMap: Record<string, number> = {};
       itemsOriginales.forEach(i => oldMap[i.codigo] = (oldMap[i.codigo] || 0) + i.cantidad);

       const newMap: Record<string, number> = {};
       carrito.forEach(i => newMap[i.codigo] = (newMap[i.codigo] || 0) + i.cantidad);

       const todosLosCodigos = Array.from(new Set([...Object.keys(oldMap), ...Object.keys(newMap)]));

       for (const codigo of todosLosCodigos) {
           const oldQ = oldMap[codigo] || 0;
           const newQ = newMap[codigo] || 0;
           const delta = newQ - oldQ; 

           if (delta !== 0) {
               const prodDB = productos.find(p => p.codigo === codigo);
               if (prodDB) {
                   const nuevoStock = prodDB.stock_actual - delta;
                   await inventarioService.actualizar(prodDB.id, { stock_actual: nuevoStock });
               }
           }
       }

       const nombresTrabajadores = trabajadoresSeleccionados.map(t => t.nombre).join(', ');
       const listadoFinalObra = carrito
          .filter(c => c.cantidad > 0)
          .map(c => ({
             id: Date.now() + Math.random(),
             codigo: c.codigo,
             producto: c.nombre,
             unidad: 'UND',
             cantidad: c.cantidad,
             precioUnit: c.precio,
             fecha_retiro: new Date().toISOString(),
             trabajador_nombre: nombresTrabajadores || 'SISTEMA POS'
       }));

       // Creamos una "foto" exacta (Snapshot) de este movimiento.
       // Al guardar el carrito completo, evitamos que los materiales 
       // desaparezcan del historial si solo se edita el personal.
       const nuevoRegistro = {
         fecha: new Date().toISOString(),
         personal: nombresTrabajadores || 'SISTEMA POS',
         materiales: carrito
           .filter(c => c.cantidad > 0)
           .map(c => ({ 
             nombre: c.nombre, 
             cantidad: c.cantidad 
           }))
       };
       
       // Recuperamos el historial anterior (si existe) y le sumamos el nuevo
       const historialPrevio = obraActiva.historial_movimientos || [];

       await obrasService.actualizar(obraActiva.id, { 
           materiales_asignados: listadoFinalObra,
           trabajadores_asignados: trabajadoresSeleccionados,
           historial_movimientos: [...historialPrevio, nuevoRegistro]
       });

       setItemsOriginales(JSON.parse(JSON.stringify(carrito)));
       setGuardadoExito(true);
       setTimeout(() => setGuardadoExito(false), 2000); 
       cargarInventario(); 

    } catch(e) {
       console.error(e);
       alert("Error de conexión al guardar.");
    } finally {
       setCargando(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-slate-200 bg-white animate-in fade-in duration-500 rounded-none shadow-sm" style={{ fontSize: `${(zoom / 100) * 12}px` }}>
      
      {/* SELECCIÓN IZQUIERDA */}
      <div className="md:col-span-4 border-r border-slate-200 p-8 bg-[#fbfcfd]">
        <div className="flex items-center gap-3 mb-6 border-l-2 border-[#00B4D8] pl-3">
          <PackagePlus className="text-[#1E293B]" size={18} />
          <h3 className="text-[#1E293B] font-black uppercase tracking-tighter text-md">Configurar Movimiento</h3>
        </div>

        <div className="mb-6 p-4 bg-amber-50 border border-amber-200">
           <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Proyecto Vinculado</p>
           {obraActiva ? (
             <>
               <p className="font-black text-[#1e293b] text-[13px] uppercase">{obraActiva.codigo_obra}</p>
               <p className="font-bold text-slate-600 text-[11px] uppercase truncate">{obraActiva.nombre_obra}</p>
             </>
           ) : (
             <p className="font-black text-red-500 text-[10px] uppercase animate-pulse">
               ⚠️ Selecciona una obra desde el panel
             </p>
           )}
        </div>

        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
              <Users size={12}/> Asignar Personal al Proyecto
            </label>
            <select 
              className="w-full bg-white border border-slate-200 p-3 text-[12px] font-bold uppercase rounded-none outline-none focus:border-[#00B4D8] transition-all cursor-pointer"
              value="" 
              onChange={e => {
                const idSeleccionado = Number(e.target.value);
                const usuario = personal.find(p => p.id === idSeleccionado);
                if (usuario && !trabajadoresSeleccionados.find(t => t.id === idSeleccionado)) {
                  setTrabajadoresSeleccionados([...trabajadoresSeleccionados, { id: usuario.id, nombre: usuario.full_name }]);
                }
              }}
            >
              <option value="">-- SELECCIONAR OPERARIO (CLICK PARA AÑADIR) --</option>
              {personal.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>

            {trabajadoresSeleccionados.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 p-3 bg-slate-50 border border-slate-100">
                {trabajadoresSeleccionados.map(t => (
                  <span key={t.id} className="bg-[#1e293b] text-white px-2 py-1.5 text-[10px] font-black uppercase flex items-center gap-2 shadow-sm">
                    {t.nombre}
                    <button 
                      onClick={() => setTrabajadoresSeleccionados(prev => prev.filter(x => x.id !== t.id))} 
                      className="text-slate-400 hover:text-red-400 transition-colors bg-black/20 p-0.5 rounded-sm"
                    >
                      <Trash2 size={12}/>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center mb-2">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Buscador Logístico (F2)</label>
               <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-sm font-bold">POS MODE</span>
            </div>
            
            {/* 🟢 NUEVO BUSCADOR DESPLAZABLE */}
            <div className="relative">
              <input 
                ref={prodSelectRef as any}
                type="text"
                placeholder="ESCRIBE CÓDIGO O NOMBRE..."
                className="w-full bg-white border border-slate-200 p-3 text-[12px] font-bold uppercase rounded-none outline-none focus:border-[#00B4D8] transition-all"
                value={busquedaProd}
                onChange={(e) => {
                  setBusquedaProd(e.target.value);
                  setMostrarResultados(true);
                  setIndexResaltado(0);
                }}
                onFocus={() => setMostrarResultados(true)}
                onKeyDown={(e) => {
                  const filtrados = productos.filter(p => 
                    p.producto.toLowerCase().includes(busquedaProd.toLowerCase()) || 
                    p.codigo.toLowerCase().includes(busquedaProd.toLowerCase())
                  ).slice(0, 10); // Límite de 10 resultados

                  if (e.key === 'ArrowDown') {
                    setIndexResaltado(prev => (prev + 1) % filtrados.length);
                  } else if (e.key === 'ArrowUp') {
                    setIndexResaltado(prev => (prev - 1 + filtrados.length) % filtrados.length);
                  } else if (e.key === 'Enter' && mostrarResultados && filtrados.length > 0) {
                    e.preventDefault();
                    const p = filtrados[indexResaltado];
                    setProdSelec(p.id.toString());
                    setBusquedaProd(p.producto);
                    setMostrarResultados(false);
                    setTimeout(() => cantInputRef.current?.focus(), 50);
                  }
                }}
              />

              {/* Lista Desplazable Flotante */}
              {mostrarResultados && busquedaProd.length > 0 && (
                <div className="absolute z-50 w-full bg-white border border-slate-200 shadow-xl mt-1 max-h-60 overflow-y-auto">
                  {productos
                    .filter(p => 
                      p.producto.toLowerCase().includes(busquedaProd.toLowerCase()) || 
                      p.codigo.toLowerCase().includes(busquedaProd.toLowerCase())
                    )
                    .slice(0, 10) // 🟢 LÍMITE DE 10 RESULTADOS
                    .map((p, i) => (
                      <div 
                        key={p.id}
                        className={`p-3 border-b border-slate-50 cursor-pointer flex justify-between items-center ${i === indexResaltado ? 'bg-[#00B4D8] text-white' : 'hover:bg-slate-50 text-[#1E293B]'}`}
                        onClick={() => {
                          setProdSelec(p.id.toString());
                          setBusquedaProd(p.producto);
                          setMostrarResultados(false);
                          setTimeout(() => cantInputRef.current?.focus(), 50);
                        }}
                      >
                        <div>
                          <p className="font-black text-[11px] uppercase">{p.producto}</p>
                          <p className={`text-[9px] font-mono ${i === indexResaltado ? 'text-white/70' : 'text-slate-400'}`}>{p.codigo}</p>
                        </div>
                        <span className="font-black text-[10px]">STK: {p.stock_actual}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-2 items-stretch mt-3">
              <input 
                ref={cantInputRef}
                type="number" min="1"
                className="w-20 bg-white border border-slate-200 p-3 text-center font-black rounded-none outline-none focus:border-[#00B4D8]"
                value={cantSelec} onChange={e => setCantSelec(Number(e.target.value))}
                onKeyDown={handleCantKeyDown}
              />
              <div className="flex flex-col gap-1 flex-1">
                 <button onClick={() => { agregarAlCarrito('SALIDA'); setBusquedaProd(''); }} className="w-full bg-[#1E293B] text-white font-black uppercase tracking-widest text-[9px] hover:bg-[#00B4D8] transition-all p-1.5 flex justify-between items-center px-3">
                    <span className="flex items-center gap-1"><ArrowUpRight size={12}/> Salida</span>
                    <span className="opacity-50 text-[8px]">[Enter]</span>
                 </button>
                 <button onClick={() => { agregarAlCarrito('DEVOLUCION'); setBusquedaProd(''); }} className="w-full bg-slate-100 text-[#1E293B] font-black uppercase tracking-widest text-[9px] hover:bg-slate-200 transition-all p-1.5 flex justify-between items-center px-3 border border-slate-200">
                    <span className="flex items-center gap-1"><ArrowDownRight size={12}/> Devol.</span>
                    <span className="opacity-50 text-[8px]">[Shift+Ent]</span>
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LISTA DERECHA - EL CARRITO / INVENTARIO DE LA OBRA */}
      <div className="md:col-span-8 flex flex-col bg-white">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
           <div className="flex items-center gap-3">
             <ShoppingCart size={18} className="text-[#00B4D8]"/>
             <div>
               <span className="font-black uppercase tracking-tighter text-[#1E293B] block">Listado Final del Proyecto</span>
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ajusta aquí para devolver o sacar insumos</span>
             </div>
           </div>
           <span className="border border-slate-200 text-[#00B4D8] px-3 py-1 text-[11px] font-black uppercase rounded-none tracking-widest shadow-sm bg-slate-50">
             {carrito.length} Diferentes
           </span>
        </div>

        <div className="flex-1 p-8 overflow-auto min-h-[400px]">
           <table className="w-full text-left">
              <thead>
                 <tr className="text-slate-400 border-b border-slate-100 bg-slate-50/50">
                    <th className="p-4 font-black uppercase text-[9px] tracking-widest w-32 text-center">Cant. Final</th>
                    <th className="p-4 font-black uppercase text-[9px] tracking-widest">Descripción Técnica</th>
                    <th className="p-4 text-right font-black uppercase text-[9px] tracking-widest">Remover todo</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {carrito.map((item, idx) => {
                    const originalQ = itemsOriginales.find(i => i.codigo === item.codigo)?.cantidad || 0;
                    const diferencia = item.cantidad - originalQ;

                    return (
                    <tr key={idx} className={`hover:bg-slate-50 transition-colors ${item.cantidad === 0 ? 'opacity-30' : ''}`}>
                       <td className="p-4 flex items-center justify-center gap-2">
                          <button onClick={() => modificarCantidad(idx, -1)} className="p-1 bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded-full transition-colors"><Minus size={12}/></button>
                          <span className="font-black text-[#00B4D8] text-[18px] font-mono w-8 text-center">{item.cantidad}</span>
                          <button onClick={() => modificarCantidad(idx, 1)} className="p-1 bg-slate-100 hover:bg-emerald-100 text-slate-400 hover:text-emerald-500 rounded-full transition-colors"><Plus size={12}/></button>
                       </td>
                       <td className="p-4">
                          <p className={`font-black uppercase text-[12px] ${item.cantidad === 0 ? 'text-red-500 line-through' : 'text-[#1E293B]'}`}>{item.nombre}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">{item.codigo}</span>
                            {diferencia > 0 && <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1 font-black uppercase">+{diferencia} Nuevos</span>}
                            {diferencia < 0 && <span className="text-[8px] bg-orange-100 text-orange-700 px-1 font-black uppercase">{diferencia} Devueltos</span>}
                          </div>
                       </td>
                       <td className="p-4 text-right">
                          <button onClick={() => {
                             setCarrito(prev => {
                               const newC = [...prev];
                               newC[idx].cantidad = 0;
                               return newC;
                             });
                          }} className="text-slate-300 hover:text-red-500 transition-colors p-2 bg-white shadow-sm border border-slate-100">
                            <Trash2 size={16}/>
                          </button>
                       </td>
                    </tr>
                 )})}
              </tbody>
           </table>
           {carrito.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 grayscale">
               <PackagePlus size={40} className="mb-2" />
               <p className="font-black uppercase tracking-[0.3em] text-[10px]">Sin materiales asignados</p>
             </div>
           )}
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-4">
           {/* 🟢 ID btn-procesar Y ATAJO VISUAL F9 */}
           <button 
              id="btn-procesar"
              onClick={procesarMovimientos}
              disabled={cargando || carrito.length === 0}
              className={`flex-1 text-white font-black uppercase py-4 flex justify-between px-6 items-center gap-3 transition-all rounded-none tracking-widest text-[11px] shadow-sm disabled:opacity-50 ${guardadoExito ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-[#1E293B] hover:bg-[#00B4D8]'}`}
           >
              <div className="flex items-center gap-3">
                 {cargando ? <Loader2 className="animate-spin" size={18}/> : (guardadoExito ? <Check size={18}/> : <Printer size={18} className={guardadoExito ? "text-white" : "text-[#00B4D8]"}/>)} 
                 {cargando ? 'Sincronizando...' : (guardadoExito ? '¡Guardado con éxito!' : 'Guardar y Sincronizar Almacén')}
              </div>
              {!cargando && !guardadoExito && <span className="bg-white/20 px-2 py-1 rounded-sm text-[9px]">[F9]</span>}
           </button>
        </div>
      </div>
    </div>
  );
};  