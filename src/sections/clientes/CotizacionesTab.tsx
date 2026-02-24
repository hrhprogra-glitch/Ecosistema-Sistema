import { useState, useEffect } from 'react';
import { clientesService, inventarioService, finanzasService, obrasService, usuariosService } from '../../services/supabase'; 
import type { Cliente, CotizacionHistorial, UsuarioSistema } from '../../services/supabase';
import { Plus, Trash2, Search, User, Save, Calendar, PenTool, LayoutTemplate, FileText, CheckCircle, XCircle, Clock, Building2, List, Loader2 } from 'lucide-react';
import { ObrasModal } from '../obras/ObrasModals';

interface ProductoInventario { id: number; codigo: string; producto: string; unidad_medida: string; precio: number; }
interface QuoteItem { id: number; codigo: string; producto: string; unidad: string; cantidad: number; precioUnit: number; total: number; }

export const CotizacionesTab = ({ zoom }: { zoom: number }) => {
  const [vistaActiva, setVistaActiva] = useState<'crear' | 'gestion'>('crear');
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]); 
  
  const [clienteSelect, setClienteSelect] = useState<Cliente | null>(null);
  const [fechaCotizacion, setFechaCotizacion] = useState(new Date().toISOString().split('T')[0]);
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [grupos, setGrupos] = useState<{id: number, subtitulo: string, items: QuoteItem[]}[]>([{ id: Date.now(), subtitulo: '', items: [] }]);
  const [grupoExpandidoId, setGrupoExpandidoId] = useState<number | null>(Date.now());
  const [grupoActivoId, setGrupoActivoId] = useState<number | null>(null);
  const [prodBusqueda, setProdBusqueda] = useState('');
  const [prodSelect, setProdSelect] = useState<ProductoInventario | null>(null);
  const [cantidad, setCantidad] = useState(1);

  const [historialCotizaciones, setHistorialCotizaciones] = useState<any[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  // Estados para Interceptar la Aprobación (Obras)
  const [obraParaAprobar, setObraParaAprobar] = useState<any>(null);
  const [cotizacionAprobando, setCotizacionAprobando] = useState<any>(null);

  useEffect(() => {
    const cargarDatosBasicos = async () => {
      try {
        const [dataClientes, dataProductos, dataUsuarios] = await Promise.all([
          clientesService.listar().catch(() => []), 
          inventarioService.listar().catch(() => []),
          usuariosService.listar().catch(() => [])
        ]);
        setClientes(dataClientes); setProductos(dataProductos as any[]); setUsuarios(dataUsuarios || []);
      } catch (e) { console.error(e); }
    };
    cargarDatosBasicos();
  }, []);

  useEffect(() => { if (vistaActiva === 'gestion') cargarHistorial(); }, [vistaActiva]);

  const cargarHistorial = async () => {
    setCargandoHistorial(true);
    try {
      const data = await finanzasService.listarCotizacionesTodas();
      setHistorialCotizaciones(data || []);
    } catch (e) { console.error(e); }
    setCargandoHistorial(false);
  };

  const formatearFechaHora = (isoString?: string) => {
    if (!isoString) return { fecha: '', hora: '' };
    const date = new Date(isoString);
    return {
      fecha: date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      hora: date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  const obtenerFechaTexto = () => { 
    if (!fechaCotizacion) return ""; 
    const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"]; 
    const [anio, mes, dia] = fechaCotizacion.split('-').map(Number); 
    return `LIMA ${dia} DE ${meses[mes - 1]} ${anio}`; 
  };

  // --- INTERCEPCIÓN DE APROBACIÓN PARA OBLIGAR DATOS DE OBRA ---
  const handleCambiarEstado = async (cotizacion: any, nuevoEstado: string) => {
    if (nuevoEstado === 'Rechazado') {
      if (!confirm(`¿Estás seguro de que deseas RECHAZAR esta cotización?`)) return;
      await finanzasService.actualizarEstadoCotizacion(cotizacion.id, 'Rechazado');
      await cargarHistorial();
      return;
    }

    if (nuevoEstado === 'Aprobado') {
      let materialesAExtraer: any[] = [];
      if (Array.isArray(cotizacion.detalles)) {
         cotizacion.detalles.forEach((g: any) => { 
           if (g.items) materialesAExtraer = [...materialesAExtraer, ...g.items]; 
           else materialesAExtraer.push(g); 
         });
      }

      const esqueletoObra = {
        cliente_id: cotizacion.cliente_id,
        estado: 'En proceso',
        costo_acumulado: cotizacion.monto_total,
        direccion_link: '', 
        fecha_inicio: new Date().toISOString().split('T')[0],
        trabajadores_asignados: [], 
        materiales_asignados: materialesAExtraer
      };

      setCotizacionAprobando(cotizacion);
      setObraParaAprobar(esqueletoObra);
    }
  };

  const handleSaveObraObligatoria = async (formObraData: any) => {
    try {
      const obrasActuales = await obrasService.listar();
      const nextId = obrasActuales.length + 1;
      const cliente = clientes.find(c => String(c.id) === formObraData.cliente_id);

      const nuevaObraFinal = {
        codigo_obra: `OBRA-${String(nextId).padStart(4, '0')}`,
        nombre_obra: `Proyecto - ${cliente?.nombre_cliente || 'Cliente'}`,
        cliente_id: Number(formObraData.cliente_id),
        estado: 'En proceso',
        costo_acumulado: obraParaAprobar.costo_acumulado,
        monto_pagado: 0,
        direccion_link: formObraData.direccion_link,
        fecha_inicio: formObraData.fecha_inicio,
        materiales_asignados: obraParaAprobar.materiales_asignados,
        trabajadores_asignados: formObraData.trabajadores_asignados
      };

      await obrasService.crear(nuevaObraFinal);
      await finanzasService.actualizarEstadoCotizacion(cotizacionAprobando.id, 'Aprobado');
      
      alert(`✅ Obra creada exitosamente (${nuevaObraFinal.codigo_obra}) y Cotización Aprobada.`);
      setObraParaAprobar(null);
      setCotizacionAprobando(null);
      await cargarHistorial();
    } catch (error) {
      alert("Error al finalizar la creación de la obra.");
      console.error(error);
    }
  };

  // --- LÓGICA DEL GENERADOR ---
  const productosFiltrados = prodBusqueda ? productos.filter(p => p.producto.toLowerCase().includes(prodBusqueda.toLowerCase()) || p.codigo.toLowerCase().includes(prodBusqueda.toLowerCase())) : [];
  const agregarGrupo = () => { const nuevoId = Date.now(); setGrupos([...grupos, { id: nuevoId, subtitulo: '', items: [] }]); setGrupoExpandidoId(nuevoId); };
  const eliminarGrupo = (id: number) => { setGrupos(grupos.filter(g => g.id !== id)); };
  const actualizarSubtitulo = (id: number, subtitulo: string) => { setGrupos(grupos.map(g => g.id === id ? { ...g, subtitulo } : g)); };
  const agregarItem = (grupoId: number) => {
    if (!prodSelect) return;
    const nuevo: QuoteItem = { id: Date.now(), codigo: prodSelect.codigo, producto: prodSelect.producto, unidad: prodSelect.unidad_medida, cantidad: cantidad, precioUnit: prodSelect.precio || 0, total: (prodSelect.precio || 0) * cantidad };
    setGrupos(grupos.map(g => g.id === grupoId ? { ...g, items: [...g.items, nuevo] } : g)); setProdSelect(null); setProdBusqueda(''); setCantidad(1);
  };
  const eliminarItem = (grupoId: number, itemId: number) => { setGrupos(grupos.map(g => g.id === grupoId ? { ...g, items: g.items.filter(i => i.id !== itemId) } : g)); };
  
  const granTotal = grupos.reduce((acc, g) => acc + g.items.reduce((sum, i) => sum + i.total, 0), 0);
  const itemsTotalesLength = grupos.reduce((acc, g) => acc + g.items.length, 0);

  const procesarCotizacion = async () => {
    if (!clienteSelect || itemsTotalesLength === 0) return;
    setGuardando(true);
    try {
      const nuevaCotizacion: CotizacionHistorial = { cliente_id: clienteSelect.id!, fecha_emision: fechaCotizacion, monto_total: granTotal, estado: 'Pendiente', nota: nota, detalles: grupos };
      await finanzasService.registrarCotizacion(nuevaCotizacion);
      
      setGrupos([{ id: Date.now(), subtitulo: '', items: [] }]); setNota(''); setClienteSelect(null);
      alert("✅ Presupuesto registrado exitosamente. Dirígete a la Bandeja de Gestión para aprobarlo.");
      setVistaActiva('gestion'); 
    } catch (error) { console.error(error); alert("Error al guardar."); } finally { setGuardando(false); }
  };

  // Lógica de Paginación para la Vista Previa
  const filasAplanadas: any[] = [];
  grupos.forEach(grupo => {
    if (grupo.subtitulo.trim()) { filasAplanadas.push({ tipo: 'subtitulo', texto: grupo.subtitulo, id: `sub-${grupo.id}` }); }
    grupo.items.forEach(item => { filasAplanadas.push({ tipo: 'item', data: item, grupoId: grupo.id }); });
  });

  const paginas: any[][] = [];
  const LIMITE_PAGINA_1 = 8; const LIMITE_PAGINAS_SIGUIENTES = 12;
  if (filasAplanadas.length === 0) { paginas.push([]); } else {
    paginas.push(filasAplanadas.slice(0, LIMITE_PAGINA_1)); let currentIndex = LIMITE_PAGINA_1;
    while (currentIndex < filasAplanadas.length) { paginas.push(filasAplanadas.slice(currentIndex, currentIndex + LIMITE_PAGINAS_SIGUIENTES)); currentIndex += LIMITE_PAGINAS_SIGUIENTES; }
  }

  const inputModerno = "w-full bg-slate-50 border border-slate-300 rounded-xl px-5 py-3.5 text-[15px] font-medium text-slate-800 outline-none focus:bg-white focus:border-[#00B4D8] focus:ring-4 focus:ring-[#00B4D8]/20 transition-all shadow-sm";

  return (
    <div className="flex flex-col animate-in fade-in duration-500" style={{ fontSize: `${(zoom / 100) * 12}px` }}>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-3">
            <LayoutTemplate className="text-[#00B4D8]" size={28} /> Generador de Presupuestos
          </h2>
          <p className="text-[13px] font-bold text-slate-500 mt-1 tracking-wide uppercase">
            Emite cotizaciones y gestiona las aprobaciones para enviarlas a Obras.
          </p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
           <button onClick={() => setVistaActiva('crear')} className={`px-5 py-3 text-[13px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 ${vistaActiva === 'crear' ? 'bg-white shadow-sm text-[#00B4D8]' : 'text-slate-500 hover:text-slate-800'}`}>
             <FileText size={18}/> Crear Nueva
           </button>
           <button onClick={() => setVistaActiva('gestion')} className={`px-5 py-3 text-[13px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 ${vistaActiva === 'gestion' ? 'bg-white shadow-sm text-[#00B4D8]' : 'text-slate-500 hover:text-slate-800'}`}>
             <List size={18}/> Bandeja de Gestión
           </button>
        </div>
      </div>

      {vistaActiva === 'crear' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in slide-in-from-left-4 duration-300">
          
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3 text-slate-400">
                  <User size={18} className="text-[#00B4D8]"/>
                  <h3 className="font-black uppercase tracking-widest text-[11px]">1. Cliente Asignado</h3>
                </div>
                <select className={`${inputModerno} cursor-pointer uppercase`} value={clienteSelect?.id || ''} onChange={e => { const c = clientes.find(x => x.id === Number(e.target.value)); setClienteSelect(c || null); }}>
                  <option value="">-- SELECCIONAR CLIENTE --</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_cliente}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3 text-slate-400">
                  <Calendar size={18} className="text-[#00B4D8]"/>
                  <h3 className="font-black uppercase tracking-widest text-[11px]">Fecha de Emisión</h3>
                </div>
                <input type="date" className={`${inputModerno} font-mono uppercase cursor-pointer`} value={fechaCotizacion} onChange={(e) => setFechaCotizacion(e.target.value)} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm relative z-50">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <FileText size={18} className="text-[#00B4D8]"/>
                  <h3 className="font-black uppercase tracking-widest text-[11px]">2. Detalle del Presupuesto</h3>
                </div>
                <button onClick={agregarGrupo} className="bg-[#00B4D8] hover:bg-[#0096b4] text-white px-4 py-2 text-[11px] rounded-lg font-black uppercase flex items-center gap-2 transition-colors shadow-md shadow-[#00B4D8]/20">
                   <Plus size={16}/> Agregar Grupo
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {grupos.map((grupo, gIndex) => {
                  const isExpanded = grupoExpandidoId === null ? gIndex === 0 : grupoExpandidoId === grupo.id;
                  const totalGrupo = grupo.items.reduce((sum, i) => sum + i.total, 0);

                  return (
                    <div key={grupo.id} className="border border-slate-200 bg-white shadow-sm rounded-xl overflow-visible">
                      <div className={`flex justify-between items-center p-4 cursor-pointer transition-colors ${isExpanded ? 'bg-slate-800 text-white rounded-t-xl' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl'}`} onClick={() => setGrupoExpandidoId(isExpanded ? null : grupo.id)}>
                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                          <span className={`px-2.5 py-1 text-[11px] font-black rounded shrink-0 ${isExpanded ? 'bg-[#00B4D8] text-white' : 'bg-slate-200 text-slate-600'}`}>GRUPO {gIndex + 1}</span>
                          <span className="text-[12px] font-black uppercase truncate" title={grupo.subtitulo}>{grupo.subtitulo || 'Sin subtítulo...'}</span>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className={`font-mono text-[13px] font-black ${isExpanded ? 'text-[#00B4D8]' : 'text-slate-500'}`}>S/ {totalGrupo.toFixed(2)}</span>
                          {grupos.length > 1 && (<button onClick={(e) => { e.stopPropagation(); eliminarGrupo(grupo.id); }} className={`shrink-0 ${isExpanded ? 'text-slate-400 hover:text-red-400' : 'text-slate-300 hover:text-red-500'} transition-colors`}><Trash2 size={18}/></button>)}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-5 bg-slate-50/50 border-t border-slate-200 animate-in slide-in-from-top-1 duration-200 rounded-b-xl overflow-visible">
                          <div className="mb-5">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Sub Título</p>
                            <input className={inputModerno} placeholder="Ej: Materiales para instalación..." value={grupo.subtitulo} onChange={e => actualizarSubtitulo(grupo.id, e.target.value)} />
                          </div>

                          <div className="relative z-50 overflow-visible">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Agregar Materiales</p>
                            <div className="relative">
                              <input placeholder="BUSCAR MATERIAL (ENTER)" className={`${inputModerno} pl-12 uppercase placeholder:text-slate-300`} value={grupoActivoId === grupo.id ? prodBusqueda : ''} onChange={e => { setGrupoActivoId(grupo.id); setProdBusqueda(e.target.value); setProdSelect(null); }} onFocus={() => { setGrupoActivoId(grupo.id); setProdBusqueda(''); setProdSelect(null); }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (productosFiltrados.length > 0 && grupoActivoId === grupo.id) { setProdSelect(productosFiltrados[0]); setProdBusqueda(productosFiltrados[0].producto); } } }} />
                              <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
                              {grupoActivoId === grupo.id && prodBusqueda && !prodSelect && productosFiltrados.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 max-h-60 overflow-y-auto z-[200] shadow-2xl rounded-xl">
                                  {productosFiltrados.map((p, index) => (
                                    <button key={p.id} onClick={() => { setProdSelect(p); setProdBusqueda(p.producto); }} className={`w-full text-left p-4 hover:bg-[#e0f7fa] border-b border-slate-100 flex justify-between transition-colors ${index === 0 ? 'bg-slate-50' : ''}`}>
                                      <div className="flex flex-col flex-1 min-w-0 pr-2">
                                        <span className="text-[12px] uppercase font-black text-slate-700 truncate">{p.producto}</span>
                                        <span className="text-[10px] text-slate-400 font-mono mt-1">{p.codigo}</span>
                                      </div>
                                      <span className="font-mono text-[#00B4D8] font-black shrink-0 text-[14px]">S/ {p.precio?.toFixed(2)}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {grupoActivoId === grupo.id && prodSelect && (
                              <div className="bg-slate-50 border border-[#00B4D8]/30 p-4 mt-4 rounded-xl shadow-inner animate-in zoom-in-95">
                                <div className="flex justify-between items-center mb-4">
                                   <span className="text-white font-black text-[10px] bg-slate-800 px-2 py-1 rounded uppercase truncate max-w-[120px]">{prodSelect.codigo}</span>
                                   <span className="text-[#00B4D8] font-mono font-black text-xl shrink-0 leading-none">S/ {prodSelect.precio?.toFixed(2)}</span>
                                </div>
                                <div className="flex gap-3 h-12">
                                  <input type="number" min="1" className="w-24 border border-slate-300 rounded-xl p-3 text-center font-black outline-none focus:border-[#00B4D8] focus:ring-4 ring-[#00B4D8]/20 transition-all shadow-sm bg-white" value={cantidad} onChange={e => setCantidad(Number(e.target.value))} />
                                  <button onClick={() => agregarItem(grupo.id)} className="flex-1 bg-[#00B4D8] hover:bg-[#0096b4] text-white font-black uppercase tracking-widest text-[12px] rounded-xl shadow-md transition-colors"><Plus size={18} className="inline mr-2" /> Agregar</button>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {grupo.items.length > 0 && (
                             <div className="mt-5 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                               {grupo.items.map(item => (
                                 <div key={item.id} className="flex justify-between items-center p-3 border-b border-slate-100 last:border-0 text-[12px]">
                                   <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                                     <span className="font-black text-slate-700 w-8 text-center shrink-0 bg-slate-100 py-1 rounded">{item.cantidad}</span>
                                     <span className="font-bold text-slate-600 uppercase truncate" title={item.producto}>{item.producto}</span>
                                   </div>
                                   <div className="flex items-center gap-4 shrink-0">
                                     <span className="font-mono font-black text-slate-800 text-[13px]">S/ {item.total.toFixed(2)}</span>
                                     <button onClick={() => eliminarItem(grupo.id, item.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1"><Trash2 size={16}/></button>
                                   </div>
                                 </div>
                               ))}
                             </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm">
               <div className="flex items-center gap-2 mb-4 text-slate-400">
                  <PenTool size={18} className="text-[#00B4D8]"/>
                  <h3 className="font-black uppercase tracking-widest text-[11px]">3. Observaciones Adicionales</h3>
               </div>
               <textarea 
                  className="w-full bg-slate-50 border border-slate-300 p-5 text-[14px] text-slate-800 font-medium outline-none focus:bg-white focus:border-[#00B4D8] focus:ring-4 focus:ring-[#00B4D8]/20 min-h-[120px] resize-y rounded-xl placeholder:text-slate-400 transition-all shadow-sm" 
                  placeholder="Escribe aquí garantías, tiempo de validez, condiciones de pago, u otras notas..." 
                  value={nota} 
                  onChange={e => setNota(e.target.value)} 
               />
            </div>

            <div className="bg-slate-50 p-8 border border-slate-200 rounded-2xl shadow-inner">
               <div className="flex flex-col items-center mb-6">
                  <span className="text-slate-500 text-[11px] uppercase font-black tracking-widest mb-1">Inversión Estimada</span>
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">S/ {granTotal.toFixed(2)}</span>
               </div>
               <button onClick={procesarCotizacion} className={`w-full py-5 rounded-xl font-black uppercase tracking-widest text-[13px] flex items-center justify-center gap-2 transition-all shadow-lg ${itemsTotalesLength > 0 && clienteSelect && !guardando ? 'bg-slate-800 text-white hover:bg-slate-900' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                  {guardando ? <Loader2 size={20} className="animate-spin"/> : <><Save size={20} /> Registrar Presupuesto</>}
               </button>
            </div>
          </div>

          {/* VISTA PREVIA HTML - HOJAS A4 */}
          <div className="lg:col-span-7 bg-[#F1F5F9] flex flex-col items-center gap-8 p-8 overflow-y-auto rounded-2xl border border-slate-200 shadow-inner h-[calc(100vh-160px)] min-h-[850px]">
             {paginas.map((pagina, pageIndex) => (
               <div key={pageIndex} className="bg-white text-black w-[595px] h-[842px] shrink-0 shadow-2xl p-10 relative flex flex-col font-sans overflow-hidden">
                 
                 <div className="text-center mb-4 border-b-2 border-slate-800 pb-4 mt-2">
                   <h1 className="text-2xl font-black tracking-tight text-slate-900">ECO SISTEMAS URH SAC</h1>
                   <p className="text-[12px] font-medium mt-1">Mz A LT 9 A.V NUEVA GALES CIENEGUILLA</p>
                   <p className="text-[12px] font-bold mt-0.5">998270102 - 985832096</p>
                   <p className="text-[12px] text-blue-800 font-bold mt-0.5">E-mail: ecosistemas_urh_sac@hotmail.com</p>
                 </div>

                 {pageIndex === 0 && (
                   <>
                     <div className="text-right mb-6"><p className="text-[11px] font-bold uppercase text-slate-800 tracking-wider">{obtenerFechaTexto()}</p></div>
                     <div className="mb-5 text-[12px]">
                       <p className="mb-1 text-[11px] font-bold text-slate-800 uppercase tracking-widest">Cliente:</p>
                       <p className="font-black uppercase text-[15px] text-slate-900">{clienteSelect?.nombre_cliente || 'NOMBRE DEL CLIENTE'}</p>
                       <p className="mt-6 italic text-slate-700 font-medium">A su gentil solicitud detallamos lo siguiente:</p>
                     </div>
                   </>
                 )}
                 {pageIndex > 0 && (<div className="flex justify-end items-center mb-4"><p className="text-[10px] font-bold text-slate-400 uppercase">Página {pageIndex + 1} de {paginas.length}</p></div>)}

                 <div className="flex-1 mt-4">
                   <table className="w-full text-left text-[11px] border-collapse mb-8">
                     <thead>
                       <tr className="border-b-2 border-t-2 border-slate-800 bg-slate-50">
                         <th className="py-2.5 pl-2 w-16 text-center font-black uppercase">CANT.</th>
                         <th className="py-2.5 font-black uppercase">DESCRIPCIÓN</th>
                         <th className="py-2.5 w-24 text-right font-black uppercase">P. UNIT</th>
                         <th className="py-2.5 pr-2 w-24 text-right font-black uppercase">TOTAL</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-200">
                       {pagina.map((fila) => {
                         if (fila.tipo === 'subtitulo') {
                           return (<tr key={fila.id} className="bg-slate-50/50"><td colSpan={4} className="py-2.5 pl-2 font-black text-slate-900 italic border-b border-slate-200 uppercase bg-slate-100/50">{fila.texto}</td></tr>);
                         } else {
                           const item = fila.data;
                           return (
                             <tr key={`item-${item.id}`}>
                               <td className="py-2.5 text-center font-mono font-bold text-slate-700">{item.cantidad}</td>
                               <td className="py-2.5 uppercase font-bold text-slate-800">{item.producto}</td>
                               <td className="py-2.5 text-right font-mono">S/ {item.precioUnit.toFixed(2)}</td>
                               <td className="py-2.5 text-right font-black font-mono text-slate-900">S/ {item.total.toFixed(2)}</td>
                             </tr>
                           );
                         }
                       })}
                     </tbody>
                   </table>
                 </div>

                 {pageIndex === paginas.length - 1 && (
                   <div className="mb-4 mt-auto">
                      <div className="flex justify-end pr-4"><div className="text-right border-t-2 border-slate-800 pt-3"><p className="font-black text-[13px] uppercase text-slate-600">Total General</p><p className="font-black text-2xl mt-1 tracking-tighter text-slate-900">S/ {granTotal.toFixed(2)}</p></div></div>
                      {nota && (<div className="mt-10 text-[11px] font-bold border-t border-slate-800 pt-4 text-slate-700"><span className="text-slate-500 uppercase tracking-widest">NOTA:</span> {nota}</div>)}
                   </div>
                 )}
                 {pageIndex < paginas.length - 1 && (<div className="mb-4 mt-auto text-right border-t border-slate-200 pt-2 text-[10px] text-slate-400 italic font-bold">Continúa en la siguiente página...</div>)}
               </div>
             ))}
          </div>
        </div>
      )}

      {vistaActiva === 'gestion' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-300">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
             <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
               <List className="text-[#00B4D8]"/> Historial y Aprobaciones
             </h3>
          </div>
          
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-[13px] text-left">
              <thead>
                <tr className="bg-slate-100">
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">ID</th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">Cliente</th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">Fecha y Hora</th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-right">Monto</th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-center">Estado</th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-center">Aprobación a Obra</th>
                </tr>
              </thead>
              <tbody>
                {cargandoHistorial ? (
                  <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-bold"><Loader2 className="animate-spin mx-auto text-[#00B4D8]" size={32}/></td></tr>
                ) : historialCotizaciones.length > 0 ? (
                  historialCotizaciones.map((cot) => {
                    const { fecha, hora } = formatearFechaHora(cot.created_at);
                    
                    return (
                      <tr key={cot.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-5 px-6 font-mono font-black text-[15px] text-[#00B4D8]">COT-{String(cot.id).padStart(4, '0')}</td>
                        <td className="py-5 px-6 font-bold text-slate-800 uppercase">{cot.clientes?.nombre_cliente || 'Desconocido'}</td>
                        <td className="py-5 px-6">
                           {cot.created_at ? (
                              <div className="flex flex-col">
                                 <span className="font-mono font-bold text-slate-700 text-[13px]">{fecha}</span>
                                 <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase mt-0.5">{hora}</span>
                              </div>
                           ) : ( <span className="font-mono text-slate-600">{cot.fecha_emision}</span> )}
                        </td>
                        <td className="py-5 px-6 font-black text-slate-900 text-[16px] text-right font-mono">S/ {cot.monto_total.toFixed(2)}</td>
                        <td className="py-5 px-6 text-center">
                           <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border
                             ${cot.estado === 'Pendiente' ? 'bg-orange-50 border-orange-200 text-orange-600' :
                               cot.estado === 'Aprobado' || cot.estado === 'Completado' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                               cot.estado === 'Rechazado' ? 'bg-red-50 border-red-200 text-red-600' :
                               'bg-slate-100 border-slate-200 text-slate-600' }`}
                           >
                             {cot.estado === 'Pendiente' && <Clock size={14}/>}
                             {(cot.estado === 'Aprobado' || cot.estado === 'Completado') && <CheckCircle size={14}/>}
                             {cot.estado === 'Rechazado' && <XCircle size={14}/>}
                             {cot.estado}
                           </span>
                        </td>
                        <td className="py-5 px-6 text-center border-l border-slate-100 bg-slate-50/50">
                          {cot.estado === 'Pendiente' ? (
                            <div className="flex flex-col items-center justify-center gap-2">
                               <button onClick={() => handleCambiarEstado(cot, 'Aprobado')} className="w-full bg-slate-800 text-white hover:bg-slate-900 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-md">
                                 <Building2 size={14}/> Aprobar
                               </button>
                               <button onClick={() => handleCambiarEstado(cot, 'Rechazado')} className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                                 <XCircle size={14}/> Rechazar
                               </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                              Ya Gestionada
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : ( <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-bold">No hay cotizaciones registradas.</td></tr> )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL OBLIGATORIO DE CREACIÓN DE OBRA AL APROBAR */}
      {obraParaAprobar && (
        <ObrasModal 
           obraPrellenada={obraParaAprobar}
           clientes={clientes}
           usuarios={usuarios}
           proximoIdObra="AUTOGENERADO"
           onClose={() => {
              setObraParaAprobar(null);
              setCotizacionAprobando(null);
           }}
           onSave={handleSaveObraObligatoria}
        />
      )}

    </div>
  );
};