import { useState, useEffect } from 'react';
import { finanzasService } from '../../services/supabase';
import type { Cliente } from '../../services/supabase';
import { Plus, Trash2, Save, Loader2, ChevronDown, Check } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
interface ProductoInventario { id: number; codigo: string; producto: string; unidad_medida: string; precio: number; }
interface QuoteItem { 
  id: number; 
  codigo: string; 
  producto: string; 
  unidad: string; 
  cantidad: number; 
  precioUnit: number; 
  total: number; 
  moneda: string; // Añadido
}

interface Props {
  clientes: Cliente[];
  productos: ProductoInventario[];
  cotizacionPrevia?: any;
  onSuccess: () => void;
}

export const CotizacionGenerador = ({ clientes, productos, cotizacionPrevia, onSuccess }: Props) => {
  const [clienteSelect, setClienteSelect] = useState<Cliente | null>(null);
  const [busquedaCliente, setBusquedaCliente] = useState(''); 
  const [mostrarDropdownCliente, setMostrarDropdownCliente] = useState(false);
  const [fechaCotizacion, setFechaCotizacion] = useState(new Date().toISOString().split('T')[0]);
  const [nota, setNota] = useState('');
  const [descripcionTrabajo, setDescripcionTrabajo] = useState('');
  const [guardando, setGuardando] = useState(false);
  
  const [grupos, setGrupos] = useState<{id: number, subtitulo: string, items: QuoteItem[]}[]>([{ id: Date.now(), subtitulo: '', items: [] }]);
  const [grupoExpandidoId, setGrupoExpandidoId] = useState<number | null>(Date.now());
  const [grupoActivoId, setGrupoActivoId] = useState<number | null>(null);
  
  const [prodBusqueda, setProdBusqueda] = useState('');
  const [prodSelect, setProdSelect] = useState<ProductoInventario | null>(null);
  const [mostrarListadoProd, setMostrarListadoProd] = useState(false);
  
  const [cantidad, setCantidad] = useState<number | string>(1);
  const [precioEditable, setPrecioEditable] = useState<number | string>(0);
  const [monedaActual, setMonedaActual] = useState('S/'); // Estado para moneda
  const [itemEnEdicion, setItemEnEdicion] = useState<{ grupoId: number, itemId: number } | null>(null);  
  const [monedaGlobal, setMonedaGlobal] = useState('S/'); // Controla el valor por defecto
  const jumpTo = (id: string, cursorAtEnd = false) => {
    setTimeout(() => {
      const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;
      if (el) {
        el.focus();
        if (cursorAtEnd && el.value) {
          try { el.selectionStart = el.value.length; el.selectionEnd = el.value.length; } catch { }
        }
      }
    }, 50);
  };

  const checkBoundaryAndJump = (e: React.KeyboardEvent<any>, position: 'start' | 'end', targetId: string, placeCursorAtEnd = false) => {
    const target = e.currentTarget;
    try {
      if (position === 'start' && target.selectionStart === 0) {
        e.preventDefault(); jumpTo(targetId, placeCursorAtEnd);
      } else if (position === 'end' && target.selectionEnd === target.value.length) {
        e.preventDefault(); jumpTo(targetId, placeCursorAtEnd);
      }
    } catch (err) {
      e.preventDefault(); jumpTo(targetId, placeCursorAtEnd);
    }
  };

  useEffect(() => {
    if (cotizacionPrevia) {
      const cliente = clientes.find(c => c.id === cotizacionPrevia.cliente_id);
      setClienteSelect(cliente || null);
      if (cliente) setBusquedaCliente(cliente.nombre_cliente);
      setFechaCotizacion(cotizacionPrevia.fecha_emision || new Date().toISOString().split('T')[0]);
      setNota(cotizacionPrevia.nota || '');
      setDescripcionTrabajo(cotizacionPrevia.descripcion_trabajo || '');
      if (cotizacionPrevia.detalles && cotizacionPrevia.detalles.length > 0) {
        setGrupos(cotizacionPrevia.detalles);
        setGrupoExpandidoId(cotizacionPrevia.detalles[0].id);
      }
    }
  }, [cotizacionPrevia, clientes]);

  const clientesFiltrados = clientes.filter(c => c.nombre_cliente.toLowerCase().includes(busquedaCliente.toLowerCase())).slice(0, 12);
  const productosFiltrados = prodBusqueda ? productos.filter(p => p.producto.toLowerCase().includes(prodBusqueda.toLowerCase()) || p.codigo.toLowerCase().includes(prodBusqueda.toLowerCase())).slice(0, 8) : [];
  
  const seleccionarCliente = (c: Cliente) => {
    setClienteSelect(c); setBusquedaCliente(c.nombre_cliente); setMostrarDropdownCliente(false);
    jumpTo('input-fecha');
  };

  const agregarGrupo = () => { 
    const nuevoId = Date.now(); 
    setGrupos([...grupos, { id: nuevoId, subtitulo: '', items: [] }]); 
    setGrupoExpandidoId(nuevoId); 
    setGrupoActivoId(nuevoId);
    jumpTo(`input-grupo-nombre-${nuevoId}`);
  };

  const eliminarGrupo = (id: number) => {
    setGrupos(grupos.filter(g => g.id !== id));
    jumpTo('btn-add-grupo');
  };

  const actualizarSubtitulo = (id: number, subtitulo: string) => setGrupos(grupos.map(g => g.id === id ? { ...g, subtitulo } : g));

  const agregarItem = (grupoId: number) => {
    if (!prodSelect) return;
    const cantNum = Number(cantidad) || 0;
    const precNum = Number(precioEditable) || 0;
    
    setGrupos(grupos.map(g => {
      if (g.id === grupoId) {
        if (itemEnEdicion && itemEnEdicion.grupoId === grupoId) {
          return {
            ...g,
            items: g.items.map(i => i.id === itemEnEdicion.itemId ? 
              { ...i, codigo: prodSelect.codigo, producto: prodSelect.producto, unidad: prodSelect.unidad_medida, cantidad: cantNum, precioUnit: precNum, total: precNum * cantNum, moneda: monedaActual } 
              : i)
          };
        } else {
          const nuevo: QuoteItem = { 
            id: Date.now(), codigo: prodSelect.codigo, producto: prodSelect.producto, 
            unidad: prodSelect.unidad_medida, cantidad: cantNum, precioUnit: precNum, 
            total: precNum * cantNum, moneda: monedaActual
          };
          return { ...g, items: [...g.items, nuevo] };
        }
      }
      return g;
    })); 

    // LIMPIEZA (Ahora sí dentro de la función)
    setProdSelect(null); 
    setProdBusqueda(''); 
    setCantidad(1); 
    setPrecioEditable(0);
    setMostrarListadoProd(false); 
    setItemEnEdicion(null);
    setMonedaActual(monedaGlobal);
    jumpTo(`input-prod-${grupoId}`);
  };

  // --- NUEVA FUNCIÓN PARA EDITAR ---
  const iniciarEdicion = (grupoId: number, item: QuoteItem) => {
    // Busca en inventario, si no existe (es manual), crea el objeto temporalmente
    const productoBase = productos.find(p => p.codigo === item.codigo) || { 
      id: 0, 
      codigo: item.codigo, 
      producto: item.producto, 
      unidad_medida: item.unidad, 
      precio: item.precioUnit 
    };
    
    setGrupoExpandidoId(grupoId);
    setGrupoActivoId(grupoId);
    setProdSelect(productoBase);
    setProdBusqueda(item.producto);
    setCantidad(item.cantidad);
    setPrecioEditable(item.precioUnit);
    setMonedaActual(item.moneda);
    setItemEnEdicion({ grupoId, itemId: item.id });
    
    // Foco directo a cantidad
    jumpTo(`input-cant-${grupoId}`);
  };

  const eliminarItem = (grupoId: number, itemId: number) => {
    setGrupos(grupos.map(g => g.id === grupoId ? { ...g, items: g.items.filter(i => i.id !== itemId) } : g));
    jumpTo(`input-prod-${grupoId}`);
  };
  
  const granTotal = grupos.reduce((acc, g) => acc + g.items.reduce((sum, i) => sum + i.total, 0), 0);

  const procesarCotizacion = async () => {
    if (!clienteSelect) {
      alert("⚠️ Debe seleccionar un cliente.");
      jumpTo('input-cliente');
      return;
    }
    if (grupos.reduce((acc, g) => acc + g.items.length, 0) === 0) {
      alert("⚠️ Debe agregar al menos un producto.");
      return;
    }

    setGuardando(true);
    try {
      // 1. Armamos los datos limpios (SIN el ID)
      const datosCotizacion: any = {
        cliente_id: clienteSelect.id,
        fecha_emision: fechaCotizacion,
        monto_total: granTotal,
        estado: cotizacionPrevia?.estado || 'Pendiente',
        nota: nota,
        detalles: grupos,
        // descripcion_trabajo: descripcionTrabajo // <-- Descomenta esta línea si ya agregaste la columna en SQL
      };

      // 2. Solo le mandamos el ID si es una EDICIÓN (si ya existe). 
      // Si es nueva, Supabase generará el ID automáticamente.
      if (cotizacionPrevia?.id) {
        datosCotizacion.id = cotizacionPrevia.id;
      }

      await finanzasService.registrarCotizacion(datosCotizacion);
      
      alert("✅ Guardado exitosamente.");
      // Generar y descargar el PDF automáticamente
      const paginasHtml = document.querySelectorAll('.hoja-imprimible');
      if (paginasHtml.length > 0) {
        const pdf = new jsPDF('p', 'pt', 'a4');
        for (let i = 0; i < paginasHtml.length; i++) {
          const canvas = await html2canvas(paginasHtml[i] as HTMLElement, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
        pdf.save(`Cotizacion_${clienteSelect.nombre_cliente}.pdf`);
      } 
      onSuccess();
      
    } catch (error) { 
      console.error("Detalle del error de Supabase:", error); 
      alert("Error al guardar. Revisa la consola para más detalles."); 
    } finally { 
      setGuardando(false); 
    }
  };

  const obtenerFechaTexto = () => { 
    if (!fechaCotizacion) return ""; 
    const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"]; 
    const [anio, mes, dia] = fechaCotizacion.split('-').map(Number); 
    return `LIMA ${dia} DE ${meses[mes - 1]} ${anio}`; 
  };

  const filasAplanadas: any[] = [];
  grupos.forEach(grupo => {
    if (grupo.subtitulo.trim()) { filasAplanadas.push({ tipo: 'subtitulo', texto: grupo.subtitulo, id: `sub-${grupo.id}` }); }
    grupo.items.forEach(item => { filasAplanadas.push({ tipo: 'item', data: item, grupoId: grupo.id }); });
  });

  const paginas: any[][] = [];
  const LIMITE_PAGINA_1 = 15; const LIMITE_PAGINAS_SIGUIENTES = 22;
  if (filasAplanadas.length === 0) { paginas.push([]); } else {
    paginas.push(filasAplanadas.slice(0, LIMITE_PAGINA_1)); let currentIndex = LIMITE_PAGINA_1;
    while (currentIndex < filasAplanadas.length) { paginas.push(filasAplanadas.slice(currentIndex, currentIndex + LIMITE_PAGINAS_SIGUIENTES)); currentIndex += LIMITE_PAGINAS_SIGUIENTES; }
  }

  const inputModerno = "w-full bg-white border border-slate-300 rounded-none px-4 py-2.5 text-[13px] font-medium text-slate-800 outline-none focus:border-[#00B4D8] transition-all shadow-sm focus:ring-1 focus:ring-[#00B4D8]";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in slide-in-from-left-4 duration-300">
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* BLOQUE 1: CLIENTE, FECHA Y DESCRIPCIÓN */}
        <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">1. Seleccionar Cliente</label>
              <input id="input-cliente" type="text" className={`${inputModerno} pr-10 ${clienteSelect ? 'border-[#00B4D8] bg-blue-50/30' : ''}`} placeholder="Buscar Cliente..." value={busquedaCliente}
                onFocus={() => setMostrarDropdownCliente(true)} onBlur={() => setTimeout(() => setMostrarDropdownCliente(false), 200)}
                onChange={(e) => { setBusquedaCliente(e.target.value); setMostrarDropdownCliente(true); }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { e.preventDefault(); setMostrarDropdownCliente(false); }
                  else if (e.key === 'Enter') {
                    if (clientesFiltrados.length > 0 && mostrarDropdownCliente) { seleccionarCliente(clientesFiltrados[0]); }
                    else { jumpTo('input-fecha'); }
                  } 
                  else if (e.key === 'ArrowRight') { checkBoundaryAndJump(e, 'end', 'input-fecha'); }
                  // Al presionar abajo, cierra el desplegable y baja a descripción
                  else if (e.key === 'ArrowDown') { 
                    e.preventDefault(); 
                    setMostrarDropdownCliente(false); 
                    jumpTo('input-desc'); 
                  }
                }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                 {clienteSelect && <Check size={14} className="text-emerald-500" />}
                 <ChevronDown className={`text-slate-400 cursor-pointer transition-transform ${mostrarDropdownCliente ? 'rotate-180' : ''}`} size={16} onClick={() => setMostrarDropdownCliente(!mostrarDropdownCliente)} />
              </div>
              {mostrarDropdownCliente && (
                <div className="absolute z-[110] w-full bg-white border-2 border-slate-300 shadow-2xl mt-1 max-h-[200px] overflow-y-auto">
                  {clientesFiltrados.map(c => (
                    <button key={c.id} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-[12px] uppercase border-b" onClick={() => seleccionarCliente(c)}>{c.nombre_cliente}</button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Fecha</label>
              <input id="input-fecha" type="date" className={inputModerno} value={fechaCotizacion} onChange={(e) => setFechaCotizacion(e.target.value)} 
                onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') { e.preventDefault(); jumpTo('input-cliente', true); }
                    if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); jumpTo('input-desc'); }
                }}
              />
            </div>
          </div>
          <textarea id="input-desc" className={`${inputModerno} min-h-[70px] resize-none`} placeholder="Descripción del trabajo..." value={descripcionTrabajo} onChange={(e) => setDescripcionTrabajo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') checkBoundaryAndJump(e, 'start', 'input-cliente', true);
              if (e.key === 'ArrowDown') checkBoundaryAndJump(e, 'end', 'btn-add-grupo');
            }}
          />
        </div>

        {/* BLOQUE 2: DETALLE DE PRESUPUESTO */}
        <div className="bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-nowrap items-center justify-between gap-1 mb-4 bg-slate-50 p-1 border-b border-slate-100 overflow-hidden">
            <h3 className="font-black uppercase tracking-widest text-[9px] text-[#1e293b] truncate shrink">2. PRESUPUESTO</h3>
            
            {/* SWITCH MAESTRO DE MONEDA */}
            <div className="flex items-center bg-slate-100 p-0.5 border border-slate-300 ml-auto">
              <button 
  id="btn-moneda-soles"
  onKeyDown={(e) => {
    e.preventDefault(); // BLOQUEA entrada de cursor al texto
    if (e.key === 'ArrowRight') jumpTo('btn-moneda-dola');
    if (e.key === 'ArrowDown') { if (grupos.length > 0) jumpTo(`grupo-header-${grupos[0].id}`); }
    if (e.key === 'Enter') { 
      setMonedaGlobal('S/'); setMonedaActual('S/'); 
      if (grupos.length > 0) jumpTo(`input-prod-${grupos[0].id}`); 
    }
    if (e.key === 'ArrowUp') { e.preventDefault(); jumpTo('input-desc', true); }
  }}
  onClick={() => { setMonedaGlobal('S/'); setMonedaActual('S/'); }}
  className={`px-3 py-1 text-[9px] font-black transition-all outline-none focus:ring-2 focus:ring-[#1e293b] ${monedaGlobal === 'S/' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-slate-600'}`}
>SOLES (S/)</button>
              <button 
  id="btn-moneda-dola"
  onKeyDown={(e) => {
    e.preventDefault(); // BLOQUEA entrada de cursor al texto
    if (e.key === 'ArrowLeft') jumpTo('btn-moneda-soles');
    if (e.key === 'ArrowRight') jumpTo('btn-add-grupo');
    if (e.key === 'ArrowDown') { if (grupos.length > 0) jumpTo(`grupo-header-${grupos[0].id}`); }
    if (e.key === 'Enter') { 
      setMonedaGlobal('$'); setMonedaActual('$'); 
      if (grupos.length > 0) jumpTo(`input-prod-${grupos[0].id}`); 
    }
    if (e.key === 'ArrowUp') { e.preventDefault(); jumpTo('input-desc', true); }
  }}
  onClick={() => { setMonedaGlobal('$'); setMonedaActual('$'); }}
  className={`px-3 py-1 text-[9px] font-black transition-all outline-none focus:ring-2 focus:ring-[#1e293b] ${monedaGlobal === '$' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-slate-600'}`}
>DÓLARES ($)</button>
            </div>

            <button 
  id="btn-add-grupo" 
  onClick={agregarGrupo} 
  onKeyDown={(e) => {
    e.preventDefault(); // Bloquea entrada al texto
    
    // NAVEGACIÓN
    if (e.key === 'ArrowLeft') jumpTo('btn-moneda-dola');
    if (e.key === 'ArrowUp') jumpTo('input-desc', true); // Sube a la descripción
    if (e.key === 'ArrowDown') { if (grupos.length > 0) jumpTo(`grupo-header-${grupos[0].id}`); }
    
    // ACCIÓN
    if (e.key === 'Enter') agregarGrupo();
  }}
  className="bg-[#1e293b] text-[#00B4D8] px-3 py-1.5 text-[10px] font-black uppercase flex items-center gap-2 focus:ring-2 focus:ring-blue-500 outline-none shrink-0"
>
  <Plus size={14}/> Grupo
</button>
          </div>

          <div className="flex flex-col gap-3">
            {grupos.map((grupo, gIndex) => {
              const isExpanded = grupoExpandidoId === grupo.id;
              return (
                <div key={grupo.id} className="border border-slate-200 bg-white shadow-sm">
                  <div 
                    id={`grupo-header-${grupo.id}`}
                    tabIndex={0}
                    className={`flex justify-between items-center p-3 cursor-pointer outline-none focus:ring-2 focus:ring-inset focus:ring-[#00B4D8] ${isExpanded ? 'bg-[#1e293b] text-white' : 'bg-slate-50'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); setGrupoExpandidoId(isExpanded ? null : grupo.id); if (!isExpanded) jumpTo(`input-grupo-nombre-${grupo.id}`); }
                      if (e.key === 'ArrowRight') { e.preventDefault(); jumpTo(`btn-del-grupo-${grupo.id}`); }
                      if (e.key === 'ArrowDown') { e.preventDefault(); if (isExpanded) jumpTo(`input-grupo-nombre-${grupo.id}`); else { const next = grupos[gIndex+1]; if(next) jumpTo(`grupo-header-${next.id}`); else jumpTo('input-notas'); } }
                    }}
                  >
                    <span className="text-[11px] font-bold" onClick={() => setGrupoExpandidoId(isExpanded ? null : grupo.id)}>{grupo.subtitulo || `Grupo ${gIndex + 1}`}</span>
                    <button id={`btn-del-grupo-${grupo.id}`} onClick={(e) => { e.stopPropagation(); eliminarGrupo(grupo.id); }} onKeyDown={(e) => {
                      if (e.key === 'ArrowLeft') jumpTo(`grupo-header-${grupo.id}`);
                      if (e.key === 'Enter') eliminarGrupo(grupo.id);
                    }} className="text-red-400 hover:text-red-600 focus:ring-2 focus:ring-red-300 outline-none p-1 rounded"><Trash2 size={14}/></button>
                  </div>
                  
                  {isExpanded && (
                    <div className="p-3 space-y-3">
                      <input id={`input-grupo-nombre-${grupo.id}`} className={inputModerno} placeholder="Nombre del grupo..." value={grupo.subtitulo} onChange={e => actualizarSubtitulo(grupo.id, e.target.value)} 
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowUp') jumpTo(`grupo-header-${grupo.id}`);
                          if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); jumpTo(`input-prod-${grupo.id}`); }
                        }}
                      />
                      <div className="relative">
                        <input id={`input-prod-${grupo.id}`} placeholder="Buscar Material..." className={inputModerno} value={grupoActivoId === grupo.id ? prodBusqueda : ''} 
                        
                          onChange={e => { 
                            setGrupoActivoId(grupo.id); 
                            setProdBusqueda(e.target.value); 
                            setMostrarListadoProd(true); 
                            if (prodSelect) setProdSelect(null); // Oculta Cant y Precio si empiezas a escribir de nuevo
                          }} 
                          onFocus={() => { setGrupoActivoId(grupo.id); setMostrarListadoProd(true); }} 
                          onBlur={() => {
  // Cierre Inteligente: solo cierra si NO vas a un botón de la lista de productos
  setTimeout(() => {
    const activeId = document.activeElement?.id || '';
    if (!activeId.startsWith(`prod-res-${grupo.id}`)) {
      setMostrarListadoProd(false);
    }
  }, 200);
}}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') { 
                              e.preventDefault(); 
                              setMostrarListadoProd(false); 
                            }
                            else if (e.key === 'ArrowUp') { 
                              e.preventDefault(); 
                              setMostrarListadoProd(false); 
                              jumpTo(`input-grupo-nombre-${grupo.id}`, true); 
                            }
                            else if (e.key === 'ArrowDown') { 
                              e.preventDefault(); 
                              if (prodSelect) { 
                                jumpTo(`input-cant-${grupo.id}`); 
                              } else if (productosFiltrados.length > 0 && mostrarListadoProd) { 
                                jumpTo(`prod-res-${grupo.id}-0`); 
                              } else if (grupo.items.length > 0) { 
                                jumpTo(`item-row-${grupo.id}-0`); 
                              } else { 
                                jumpTo('input-notas'); 
                              } 
                            }
                            else if (e.key === 'ArrowRight') {
                              if (!prodSelect && productosFiltrados.length > 0 && mostrarListadoProd) {
                                e.preventDefault(); jumpTo(`prod-res-${grupo.id}-0`); 
                              }
                            }
                            else if (e.key === 'Enter') {
                              e.preventDefault();
                              // Caso A: Si hay algo en la lista desplegable y no hemos seleccionado nada aún
                              if (productosFiltrados.length > 0 && mostrarListadoProd && !prodSelect) {
                                const p = productosFiltrados[0]; 
                                setProdSelect(p); 
                                setProdBusqueda(p.producto); 
                                setPrecioEditable(p.precio); 
                                setCantidad(1); 
                                setMostrarListadoProd(false); 
                                jumpTo(`input-cant-${grupo.id}`);
                              } 
                              // Caso B: Si escribiste algo que NO está en la lista (Producto Manual)
                              else if (prodBusqueda.trim() !== '') {
                                const productoManual = { 
                                  id: Date.now(), 
                                  codigo: 'MANUAL', 
                                  producto: prodBusqueda.toUpperCase(), 
                                  unidad_medida: 'UND', 
                                  precio: 0 
                                };
                                setProdSelect(productoManual); 
                                setPrecioEditable(0); 
                                setCantidad(1); 
                                setMostrarListadoProd(false); 
                                jumpTo(`input-cant-${grupo.id}`);
                              }
                            }
                          }}
                        />
                        {/* AVISO DE PRODUCTO NUEVO */}
{mostrarListadoProd && prodBusqueda.trim() !== '' && productosFiltrados.length === 0 && !prodSelect && (
  <div className="absolute z-[110] w-full bg-amber-50 border border-amber-200 p-2 shadow-lg mt-1">
    <p className="text-[10px] text-amber-700 font-black flex items-center gap-2 uppercase tracking-tighter">
      ⚠️ Producto no encontrado. Presiona ENTER para agregarlo manualmente
    </p>
  </div>
)}
                        {mostrarListadoProd && grupoActivoId === grupo.id && prodBusqueda && !prodSelect && (
                          <div className="absolute z-[100] w-full bg-white border border-slate-300 shadow-xl max-h-40 overflow-y-auto">
                            {productosFiltrados.map((p, pIdx) => (
                              <button key={p.id} id={`prod-res-${grupo.id}-${pIdx}`} className="w-full text-left p-2 hover:bg-slate-100 text-[12px] font-medium border-b flex justify-between focus:bg-blue-50 outline-none"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') { 
                                    e.preventDefault(); 
                                    setProdSelect(p); setProdBusqueda(p.producto); setPrecioEditable(p.precio); setCantidad(1); setMostrarListadoProd(false); jumpTo(`input-cant-${grupo.id}`); 
                                  }
                                  else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); jumpTo(`prod-res-${grupo.id}-${pIdx + 1}`); }
                                  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); jumpTo(pIdx === 0 ? `input-prod-${grupo.id}` : `prod-res-${grupo.id}-${pIdx - 1}`); }
                                }}
                                onClick={() => { setProdSelect(p); setProdBusqueda(p.producto); setPrecioEditable(p.precio); setCantidad(1); setMostrarListadoProd(false); jumpTo(`input-cant-${grupo.id}`); }}
                              ><span>{p.producto}</span><span className="font-bold text-[#00B4D8]">S/ {p.precio}</span></button>
                            ))}
                          </div>
                        )}
                      </div>

                      {prodSelect && grupoActivoId === grupo.id && (
                        <div className="flex gap-2 p-2 bg-blue-50 border border-blue-100 animate-in zoom-in-95">
                          <div className="w-20">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Cant.</label>
                            <input id={`input-cant-${grupo.id}`} type="number" className={`${inputModerno} text-center`} value={cantidad} 
                              onChange={e => setCantidad(e.target.value)} onFocus={(e) => e.target.select()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); jumpTo(`select-moneda-${grupo.id}`); }
                                if (e.key === 'ArrowDown') { 
  e.preventDefault(); 
  if (grupo.items.length > 0) jumpTo(`item-row-${grupo.id}-0`); // <--- Salta a la lista
  else jumpTo('input-notas'); 
}
                                if (e.key === 'ArrowUp') { e.preventDefault(); jumpTo(`input-prod-${grupo.id}`, true); }
                              }} 
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Precio Unit.</label>
                            <div className="flex gap-1">
                              <select 
                                id={`select-moneda-${grupo.id}`}
                                className="bg-white border border-slate-300 text-[10px] font-bold px-1 outline-none focus:ring-1 focus:ring-[#00B4D8]" 
                                value={monedaActual} 
                                onChange={(e) => setMonedaActual(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); jumpTo(`input-precio-${grupo.id}`); }
                                  if (e.key === 'ArrowLeft') { e.preventDefault(); jumpTo(`input-cant-${grupo.id}`); }
                                }}
                              >
                                <option value="S/">S/</option>
                                <option value="$">$</option>
                              </select>
                              <input id={`input-precio-${grupo.id}`} type="number" className={`${inputModerno} text-right font-black text-[#00B4D8]`} value={precioEditable} 
                                onChange={e => setPrecioEditable(e.target.value)} onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => {
                                  if (e.key === 'ArrowLeft') { e.preventDefault(); jumpTo(`select-moneda-${grupo.id}`); }
                                  if (e.key === 'Enter' || e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); jumpTo(`btn-ok-${grupo.id}`); }
                                  if (e.key === 'ArrowUp') { e.preventDefault(); jumpTo(`input-cant-${grupo.id}`); }
                                }} 
                              />
                            </div>
                          </div>
                          <button id={`btn-ok-${grupo.id}`} onClick={() => agregarItem(grupo.id)} onKeyDown={(e) => {
                             if (e.key === 'ArrowLeft') { e.preventDefault(); jumpTo(`input-precio-${grupo.id}`); }
                             if (e.key === 'Enter') { e.preventDefault(); agregarItem(grupo.id); }
                             if (e.key === 'ArrowUp') { e.preventDefault(); jumpTo(`input-precio-${grupo.id}`); }
                             if (e.key === 'ArrowDown') { e.preventDefault(); jumpTo('input-notas'); }
                          }} className="mt-[18px] bg-[#00B4D8] text-white px-4 font-black uppercase text-[10px] outline-none focus:ring-2 focus:ring-[#1e293b]">OK</button>
                        </div>
                      )}
                      
                      <div className="space-y-1 mt-2">
  {grupo.items.map((item, iIdx) => (
    <div 
      key={item.id} 
      id={`item-row-${grupo.id}-${iIdx}`}
      tabIndex={0}
      className="flex justify-between p-2 bg-slate-50 text-[11px] border-b border-white outline-none focus:ring-2 focus:ring-inset focus:ring-[#00B4D8] cursor-pointer hover:bg-slate-100"
      onClick={() => iniciarEdicion(grupo.id, item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); iniciarEdicion(grupo.id, item); }
        else if (e.key === 'ArrowUp') { 
          e.preventDefault(); 
          if (iIdx === 0) jumpTo(`input-prod-${grupo.id}`, true);
          else jumpTo(`item-row-${grupo.id}-${iIdx - 1}`);
        }
        else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (iIdx < grupo.items.length - 1) jumpTo(`item-row-${grupo.id}-${iIdx + 1}`);
          else jumpTo('input-notas'); 
        }
        else if (e.key === 'ArrowRight') {
          e.preventDefault();
          jumpTo(`btn-del-item-${item.id}`); // Salta al tacho
        }
      }}
    >
      <span>{item.cantidad} x {item.producto}</span>
      <div className="flex items-center gap-3">
        <span className="font-black font-mono">{item.moneda} {item.total.toFixed(2)}</span>
        <button 
          id={`btn-del-item-${item.id}`}
          onClick={(e) => { e.stopPropagation(); eliminarItem(grupo.id, item.id); }} 
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); jumpTo(`item-row-${grupo.id}-${iIdx}`); }
            if (e.key === 'Enter') { e.stopPropagation(); eliminarItem(grupo.id, item.id); }
          }}
          className="text-red-300 hover:text-red-500 outline-none focus:ring-2 focus:ring-red-300 rounded p-1"
        >
          <Trash2 size={14}/>
        </button>
      </div>
    </div>
  ))}
</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* BLOQUE 3: OBSERVACIONES Y REGISTRO */}
        <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Observaciones / Notas Finales</label>
            <textarea 
              id="input-notas" 
              className={`${inputModerno} min-h-[60px]`} 
              value={nota} 
              onChange={e => setNota(e.target.value)}
              onKeyDown={(e) => {
                // Si está arriba de todo, va al grupo
                if (e.key === 'ArrowUp' && e.currentTarget.selectionStart === 0) {
                  e.preventDefault();
                  jumpTo('btn-add-grupo');
                } 
                // Si presiona abajo y está al final del texto (o está vacío)
                else if (e.key === 'ArrowDown') {
                  if (e.currentTarget.selectionEnd === e.currentTarget.value.length) {
                    e.preventDefault();
                    jumpTo('btn-registrar');
                  }
                } 
                // Si presiona Enter, guarda automáticamente
                else if (e.key === 'Enter') {
                  e.preventDefault();
                  document.getElementById('btn-registrar')?.click();
                }
              }}
            />
        </div>

        <div className="bg-[#1e293b] p-6 border-b-8 border-[#00B4D8] text-center shadow-xl">
           <div className="text-4xl font-black text-white tracking-tighter mb-4">S/ {granTotal.toFixed(2)}</div>
           <button id="btn-registrar" onClick={procesarCotizacion} disabled={guardando} 
             onKeyDown={(e) => { if (e.key === 'ArrowUp') jumpTo('input-notas', true); }}
             className="w-full py-4 bg-[#00B4D8] text-[#1e293b] font-black uppercase text-[12px] flex items-center justify-center gap-3 hover:bg-white transition-all outline-none focus:ring-4 focus:ring-[#00B4D8]">
             {guardando ? <Loader2 className="animate-spin"/> : <Save size={18} />} {cotizacionPrevia ? 'CONFIRMAR CAMBIOS' : 'REGISTRAR'}
           </button>
        </div>
      </div>

      {/* VISTA PREVIA HOJA A4 */}
      <div className="lg:col-span-7 bg-[#f1f5f9] flex flex-col items-center gap-8 p-10 overflow-y-auto border border-slate-200 h-[calc(100vh-160px)] min-h-[850px] shadow-inner">
          {paginas.map((pagina, pageIndex) => (
            <div key={pageIndex} className="hoja-imprimible bg-white text-black w-[595px] h-[842px] shrink-0 shadow-2xl p-8 relative flex flex-col font-sans border-t-[10px] border-[#1e293b]">
                <div className="text-center mb-4 border-b border-[#1e293b] pb-4">
                    <h1 className="text-xl font-black text-[#1e293b]">ECO SISTEMAS URH SAC</h1>
                    <p className="text-[9px] font-bold text-slate-600 uppercase">Mz A LT 9 A.V NUEVA GALES CIENEGUILLA</p>
                    <p className="text-[9px] font-bold text-slate-600">998270102 – 985832096</p>
                    <p className="text-[9px] font-bold text-[#1e293b]">E-mail: ecosistemas_urh_sac@hotmail.com</p>
                </div>
                {pageIndex === 0 && (
                    <>
                    <div className="text-right mb-4 font-bold text-[10px] border-b border-[#00B4D8] inline-block self-end pb-1">{obtenerFechaTexto() ?? ''}</div>
                    <div className="mb-4 text-left">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">CLIENTE:</p>
                        <p className="font-bold text-[13px] text-[#1e293b] leading-tight mb-1">{clienteSelect?.nombre_cliente || 'NOMBRE DEL CLIENTE'}</p>
                        <p className="text-[10px] text-slate-600 font-medium italic">A su gentil solicitud detallamos lo siguiente:</p>
                    </div>
                    {descripcionTrabajo && (
                      <div className="mb-4 p-3 bg-slate-50 border-l-2 border-slate-300 text-left">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">DESCRIPCIÓN DEL TRABAJO:</p>
                        <p className="text-[10px] text-slate-700 whitespace-pre-wrap leading-tight">{descripcionTrabajo}</p>
                      </div>
                    )}
                    </>
                )}
                <div className="flex-1 overflow-hidden">
                    <table className="w-full text-left text-[10px] border-collapse">
                        <thead>
                            <tr className="border-b-2 border-[#1e293b] bg-slate-50">
                                <th className="py-1.5 px-1 font-black w-10 text-center uppercase">Cant.</th>
                                <th className="py-1.5 font-black uppercase">Descripción</th>
                                <th className="py-1.5 px-1 text-right font-black w-24 uppercase">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagina.map((fila, i) => (
                                fila.tipo === 'subtitulo' ? 
                                <tr key={i}><td colSpan={3} className="py-1.5 px-1 font-bold bg-[#f8fafc] text-[9px] tracking-wider border-b border-slate-100">{fila.texto}</td></tr> :
                                <tr key={i} className="border-b border-slate-50">
                                    <td className="py-1.5 px-1 text-center font-bold text-slate-600">{fila.data.cantidad}</td>
                                    <td className="py-1.5 text-slate-800 leading-tight uppercase">{fila.data.producto}</td>
                                    <td className="py-1.5 px-1 text-right font-bold font-mono">{fila.data.moneda} {fila.data.total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {pageIndex === paginas.length - 1 && (
                    <div className="mt-2 border-t-2 border-[#1e293b] pt-2">
                        <div className="flex justify-end items-center gap-4 mb-4">
                            <span className="text-[9px] font-black text-[#00B4D8] uppercase">Total General</span>
                            <span className="text-xl font-black text-[#1e293b]">S/ {granTotal.toFixed(2)}</span>
                        </div>
                        {nota && (
                          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 text-left">
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">NOTAS / CONDICIONES:</p>
                            <p className="text-[9px] text-slate-600 leading-relaxed whitespace-pre-wrap">{nota}</p>
                          </div>
                        )}
                    </div>
                )}
                <div className="absolute bottom-4 right-8 text-[8px] text-slate-400 font-bold uppercase">Página {pageIndex + 1} de {paginas.length}</div>
            </div>
          ))}
      </div>
    </div>
  );
};