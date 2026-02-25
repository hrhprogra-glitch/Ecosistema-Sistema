import { useState, useEffect } from 'react';
import { clientesService, inventarioService, finanzasService, obrasService, usuariosService } from '../../services/supabase'; 
import type { Cliente, CotizacionHistorial, UsuarioSistema } from '../../services/supabase';
import { Plus, Trash2, Search, User, Save, Calendar, PenTool, LayoutTemplate, FileText, XCircle, Building2, List, Loader2 } from 'lucide-react';
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
  const LIMITE_PAGINA_1 = 4; const LIMITE_PAGINAS_SIGUIENTES = 12;
  if (filasAplanadas.length === 0) { paginas.push([]); } else {
    paginas.push(filasAplanadas.slice(0, LIMITE_PAGINA_1)); let currentIndex = LIMITE_PAGINA_1;
    while (currentIndex < filasAplanadas.length) { paginas.push(filasAplanadas.slice(currentIndex, currentIndex + LIMITE_PAGINAS_SIGUIENTES)); currentIndex += LIMITE_PAGINAS_SIGUIENTES; }
  }

  const inputModerno = "w-full bg-white border border-slate-300 rounded-none px-4 py-3 text-[13px] font-black uppercase tracking-tight text-slate-800 outline-none focus:border-[#00B4D8] transition-all shadow-sm";
  return (
    <div className="flex flex-col animate-in fade-in duration-500 pb-10" style={{ fontSize: `${(zoom / 100) * 12}px` }}>
      
      {/* HEADER DE SECCIÓN - SQUARE & HIGH CONTRAST */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 border-l-8 border-[#00B4D8] shadow-sm animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <div className="bg-[#1e293b] p-2">
            <LayoutTemplate className="text-[#00B4D8]" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#1e293b] uppercase tracking-tighter">Generador de Presupuestos</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 text-left">Emisión y Gestión de Cotizaciones</p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1 border border-slate-200">
           <button onClick={() => setVistaActiva('crear')} className={`px-5 py-2 text-[11px] font-black uppercase tracking-widest transition-all ${vistaActiva === 'crear' ? 'bg-[#00B4D8] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
             Crear Nueva
           </button>
           <button onClick={() => setVistaActiva('gestion')} className={`px-5 py-2 text-[11px] font-black uppercase tracking-widest transition-all ${vistaActiva === 'gestion' ? 'bg-[#00B4D8] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
             Bandeja de Gestión
           </button>
        </div>
      </div>

      {vistaActiva === 'crear' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in slide-in-from-left-4 duration-300">
          
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* 1. CLIENTE Y FECHA - SQUARE */}
            <div className="bg-white border border-slate-200 p-8 shadow-sm space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3 border-l-4 border-[#00B4D8] pl-3">
                  <User size={18} className="text-[#00B4D8]"/>
                  <h3 className="font-black uppercase tracking-widest text-[11px] text-[#1e293b]">1. Cliente Asignado</h3>
                </div>
                <select className={`${inputModerno} cursor-pointer uppercase`} value={clienteSelect?.id || ''} onChange={e => { const c = clientes.find(x => x.id === Number(e.target.value)); setClienteSelect(c || null); }}>
                  <option value="">-- SELECCIONAR CLIENTE --</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_cliente}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3 border-l-4 border-[#00B4D8] pl-3">
                  <Calendar size={18} className="text-[#00B4D8]"/>
                  <h3 className="font-black uppercase tracking-widest text-[11px] text-[#1e293b]">Fecha de Emisión</h3>
                </div>
                <input type="date" className={`${inputModerno} font-mono uppercase cursor-pointer`} value={fechaCotizacion} onChange={(e) => setFechaCotizacion(e.target.value)} />
              </div>
            </div>

            {/* 2. DETALLE DE GRUPOS - SQUARE */}
            <div className="bg-white border border-slate-200 p-8 shadow-sm relative z-50">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <FileText size={18} className="text-[#00B4D8]"/>
                  <h3 className="font-black uppercase tracking-widest text-[11px] text-[#1e293b]">2. Detalle del Presupuesto</h3>
                </div>
                <button onClick={agregarGrupo} className="bg-[#1e293b] text-[#00B4D8] px-4 py-2 text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#00B4D8] hover:text-white transition-all shadow-md">
                   <Plus size={16}/> Nuevo Grupo
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {grupos.map((grupo, gIndex) => {
                  const isExpanded = grupoExpandidoId === null ? gIndex === 0 : grupoExpandidoId === grupo.id;
                  const totalGrupo = grupo.items.reduce((sum, i) => sum + i.total, 0);

                  return (
                    <div key={grupo.id} className="border border-slate-200 bg-white shadow-sm overflow-visible">
                      <div className={`flex justify-between items-center p-4 cursor-pointer transition-colors ${isExpanded ? 'bg-[#1e293b] text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`} onClick={() => setGrupoExpandidoId(isExpanded ? null : grupo.id)}>
                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                          <span className={`px-2.5 py-1 text-[11px] font-black shrink-0 ${isExpanded ? 'bg-[#00B4D8] text-white' : 'bg-slate-200 text-slate-600'}`}>GRUPO {gIndex + 1}</span>
                          <span className="text-[12px] font-black uppercase truncate" title={grupo.subtitulo}>{grupo.subtitulo || 'Sin subtítulo...'}</span>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className={`font-mono text-[13px] font-black ${isExpanded ? 'text-[#00B4D8]' : 'text-slate-500'}`}>S/ {totalGrupo.toFixed(2)}</span>
                          {grupos.length > 1 && (<button onClick={(e) => { e.stopPropagation(); eliminarGrupo(grupo.id); }} className={`shrink-0 ${isExpanded ? 'text-slate-400 hover:text-red-400' : 'text-slate-300 hover:text-red-500'} transition-colors`}><Trash2 size={18}/></button>)}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-5 bg-white border-t border-slate-200 animate-in slide-in-from-top-1 duration-200 overflow-visible">
                          <div className="mb-5">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Sub Título</p>
                            <input className={inputModerno} placeholder="Ej: Materiales para instalación..." value={grupo.subtitulo} onChange={e => actualizarSubtitulo(grupo.id, e.target.value)} />
                          </div>

                          <div className="relative z-50 overflow-visible">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Agregar Materiales</p>
                            <div className="relative">
                              <input placeholder="BUSCAR MATERIAL (ENTER)" className={`${inputModerno} pl-12 uppercase placeholder:text-slate-300`} value={grupoActivoId === grupo.id ? prodBusqueda : ''} onChange={e => { setGrupoActivoId(grupo.id); setProdBusqueda(e.target.value); setProdSelect(null); }} onFocus={() => { setGrupoActivoId(grupo.id); setProdBusqueda(''); setProdSelect(null); }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (productosFiltrados.length > 0 && grupoActivoId === grupo.id) { setProdSelect(productosFiltrados[0]); setProdBusqueda(productosFiltrados[0].producto); } } }} />
                              <Search size={18} className="absolute left-4 top-3.5 text-[#00B4D8]" />
                              {grupoActivoId === grupo.id && prodBusqueda && !prodSelect && productosFiltrados.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-[#1e293b] max-h-60 overflow-y-auto z-[200] shadow-2xl">
                                  {productosFiltrados.map((p, index) => (
                                    <button key={p.id} onClick={() => { setProdSelect(p); setProdBusqueda(p.producto); }} className={`w-full text-left p-4 hover:bg-[#e0f7fa] border-b border-slate-100 flex justify-between transition-colors ${index === 0 ? 'bg-slate-50' : ''}`}>
                                      <div className="flex flex-col flex-1 min-w-0 pr-2">
                                        <span className="text-[12px] uppercase font-black text-[#1e293b] truncate">{p.producto}</span>
                                        <span className="text-[10px] text-slate-400 font-mono mt-1 font-bold">{p.codigo}</span>
                                      </div>
                                      <span className="font-mono text-[#00B4D8] font-black shrink-0 text-[14px]">S/ {p.precio?.toFixed(2)}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {grupoActivoId === grupo.id && prodSelect && (
                              <div className="bg-[#f8fafc] border border-[#00B4D8] p-4 mt-4 animate-in zoom-in-95 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                   <span className="text-white font-black text-[10px] bg-[#1e293b] px-2 py-1 uppercase">{prodSelect.codigo}</span>
                                   <span className="text-[#00B4D8] font-mono font-black text-xl">S/ {prodSelect.precio?.toFixed(2)}</span>
                                </div>
                                <div className="flex gap-3 h-12">
                                  <input type="number" min="1" className="w-24 border border-slate-300 p-3 text-center font-black outline-none focus:border-[#00B4D8] bg-white shadow-sm" value={cantidad} onChange={e => setCantidad(Number(e.target.value))} />
                                  <button onClick={() => agregarItem(grupo.id)} className="flex-1 bg-[#00B4D8] text-white font-black uppercase tracking-widest text-[12px] hover:bg-[#1e293b] transition-colors"><Plus size={18} className="inline mr-2" /> Agregar</button>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {grupo.items.length > 0 && (
                             <div className="mt-5 bg-white border border-slate-200 overflow-hidden shadow-sm">
                               {grupo.items.map(item => (
                                 <div key={item.id} className="flex justify-between items-center p-3 border-b border-slate-100 last:border-0 text-[12px] hover:bg-slate-50">
                                   <div className="flex items-center gap-4 flex-1 min-w-0 pr-2">
                                     <span className="font-black text-white bg-[#1e293b] w-8 text-center py-1 text-[10px] shrink-0">{item.cantidad}</span>
                                     <span className="font-bold text-[#1e293b] uppercase truncate">{item.producto}</span>
                                   </div>
                                   <div className="flex items-center gap-6 shrink-0">
                                     <span className="font-mono font-black text-[#1e293b] text-[13px]">S/ {item.total.toFixed(2)}</span>
                                     <button onClick={() => eliminarItem(grupo.id, item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><Trash2 size={16}/></button>
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

            {/* 3. OBSERVACIONES Y REGISTRO - SQUARE */}
            <div className="bg-white border border-slate-200 p-8 shadow-sm">
               <div className="flex items-center gap-3 border-l-4 border-[#00B4D8] pl-3 mb-4">
                  <PenTool size={18} className="text-[#00B4D8]"/>
                  <h3 className="font-black uppercase tracking-widest text-[11px] text-[#1e293b]">3. Observaciones Adicionales</h3>
               </div>
               <textarea 
                  className="w-full bg-slate-50 border border-slate-300 p-5 text-[14px] text-slate-800 font-bold outline-none focus:bg-white focus:border-[#00B4D8] min-h-[120px] resize-y placeholder:text-slate-300 transition-all shadow-sm uppercase" 
                  placeholder="Escribe condiciones, garantías, etc..." 
                  value={nota} 
                  onChange={e => setNota(e.target.value)} 
               />
            </div>

            <div className="bg-[#1e293b] p-8 border-b-8 border-[#00B4D8] shadow-xl text-center">
               <div className="flex flex-col items-center mb-6">
                  <span className="text-[#00B4D8] text-[11px] uppercase font-black tracking-widest mb-1">Inversión Estimada</span>
                  <span className="text-5xl font-black text-white tracking-tighter">S/ {granTotal.toFixed(2)}</span>
               </div>
               <button onClick={procesarCotizacion} disabled={!(itemsTotalesLength > 0 && clienteSelect && !guardando)} className={`w-full py-5 font-black uppercase tracking-widest text-[13px] flex items-center justify-center gap-3 transition-all shadow-lg ${itemsTotalesLength > 0 && clienteSelect && !guardando ? 'bg-[#00B4D8] text-[#1e293b] hover:bg-white' : 'bg-white/10 text-white/20 cursor-not-allowed'}`}>
                  {guardando ? <Loader2 size={22} className="animate-spin"/> : <><Save size={22} /> Registrar Presupuesto Maestro</>}
               </button>
            </div>
          </div>

          {/* VISTA PREVIA HTML - HOJAS A4 (NO TOCAR FUNCIONES) */}
          <div className="lg:col-span-7 bg-[#f1f5f9] flex flex-col items-center gap-8 p-10 overflow-y-auto border border-slate-200 h-[calc(100vh-160px)] min-h-[850px] shadow-inner">
             {paginas.map((pagina, pageIndex) => (
               <div key={pageIndex} className="bg-white text-black w-[595px] h-[842px] shrink-0 shadow-2xl p-10 relative flex flex-col font-sans overflow-hidden border-t-8 border-[#1e293b]">
                 
                 <div className="text-center mb-6 border-b-2 border-[#1e293b] pb-6 mt-2">
                   <h1 className="text-2xl font-black tracking-tight text-[#1e293b]">ECO SISTEMAS URH SAC</h1>
                   <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-slate-500 italic">Servicios Generales de Ingeniería</p>
                   <p className="text-[11px] font-bold mt-2 italic">Mz A LT 9 A.V NUEVA GALES CIENEGUILLA</p>
                   <p className="text-[11px] font-bold mt-0.5 italic">998270102 - 985832096</p>
                   <p className="text-[11px] text-blue-800 font-black mt-0.5">E-mail: ecosistemas_urh_sac@hotmail.com</p>
                 </div>

                 {pageIndex === 0 && (
                   <>
                     <div className="text-right mb-6"><p className="text-[11px] font-black uppercase text-[#1e293b] tracking-wider border-b border-[#00B4D8] inline-block pb-0.5">{obtenerFechaTexto()}</p></div>
                     <div className="mb-6 text-[12px] bg-slate-50 p-6 border-l-4 border-[#1e293b]">
                       <p className="mb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente:</p>
                       <p className="font-black uppercase text-[16px] text-[#1e293b]">{clienteSelect?.nombre_cliente || 'NOMBRE DEL CLIENTE'}</p>
                       <p className="mt-6 italic text-slate-700 font-bold uppercase text-[11px] tracking-tight">A su gentil solicitud detallamos lo siguiente:</p>
                     </div>
                   </>
                 )}
                 {pageIndex > 0 && (<div className="flex justify-end items-center mb-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Página {pageIndex + 1} de {paginas.length}</p></div>)}

                 <div className="flex-1 mt-4">
                   <table className="w-full text-left text-[11px] border-collapse mb-8">
                     <thead>
                       <tr className="border-b-4 border-t-2 border-[#1e293b] bg-slate-50">
                         <th className="py-3 pl-2 w-16 text-center font-black uppercase">CANT.</th>
                         <th className="py-3 font-black uppercase">DESCRIPCIÓN</th>
                         <th className="py-3 w-24 text-right font-black uppercase">P. UNIT</th>
                         <th className="py-3 pr-2 w-24 text-right font-black uppercase">TOTAL</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {pagina.map((fila) => {
                         if (fila.tipo === 'subtitulo') {
                           return (<tr key={fila.id}><td colSpan={4} className="py-3 pl-2 font-black text-[#1e293b] italic border-b-2 border-slate-100 uppercase bg-[#f8fafc] text-[10px] tracking-widest">{fila.texto}</td></tr>);
                         } else {
                           const item = fila.data;
                           return (
                             <tr key={`item-${item.id}`} className="hover:bg-slate-50 transition-colors">
                               <td className="py-3 text-center font-mono font-black text-[#1e293b] text-[12px]">{item.cantidad}</td>
                               <td className="py-3 uppercase font-bold text-slate-700">{item.producto}</td>
                               <td className="py-3 text-right font-mono font-bold text-slate-500">S/ {item.precioUnit.toFixed(2)}</td>
                               <td className="py-3 text-right font-black font-mono text-[#1e293b] text-[12px]">S/ {item.total.toFixed(2)}</td>
                             </tr>
                           );
                         }
                       })}
                     </tbody>
                   </table>
                 </div>

                 {pageIndex === paginas.length - 1 && (
                   <div className="mb-4 mt-auto">
                      <div className="flex justify-end pr-2"><div className="text-right border-t-4 border-[#1e293b] pt-4 min-w-[200px]"><p className="font-black text-[11px] uppercase text-[#00B4D8] tracking-widest">Total General</p><p className="font-black text-3xl mt-1 tracking-tighter text-[#1e293b]">S/ {granTotal.toFixed(2)}</p></div></div>
                      {nota && (<div className="mt-12 text-[10px] font-bold border-t border-dashed border-slate-300 pt-6 text-slate-600 uppercase leading-relaxed"><span className="text-[#1e293b] font-black tracking-widest mr-2 underline decoration-[#00B4D8] decoration-2">NOTA:</span> {nota}</div>)}
                   </div>
                 )}
                 {pageIndex < paginas.length - 1 && (<div className="mb-4 mt-auto text-right border-t border-slate-200 pt-2 text-[9px] text-slate-400 italic font-black tracking-widest uppercase">Continúa en la siguiente página...</div>)}
               </div>
             ))}
          </div>
        </div>
      )}

      {vistaActiva === 'gestion' && (
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-300">
          <div className="p-8 border-b-4 border-[#1e293b] bg-white flex justify-between items-center">
             <div>
               <h3 className="text-xl font-black text-[#1e293b] uppercase tracking-tighter flex items-center gap-3">
                 <List className="text-[#00B4D8]" size={24}/> Historial de Cotizaciones
               </h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 ml-9">Gestión y Aprobación de Archivos</p>
             </div>
          </div>
          
          <div className="overflow-x-auto min-h-[500px]">
            <table className="w-full text-[13px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200">ID</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200">Cliente</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200">Emisión</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 text-right">Inversión</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 text-center">Estado</th>
                  <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 text-center bg-slate-100">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cargandoHistorial ? (
                  <tr><td colSpan={6} className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-[#00B4D8]" size={40}/><p className="mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Cargando base de datos...</p></td></tr>
                ) : historialCotizaciones.length > 0 ? (
                  historialCotizaciones.map((cot) => {
                    const { fecha, hora } = formatearFechaHora(cot.created_at);
                    return (
                      <tr key={cot.id} className="hover:bg-[#f8fafc] transition-colors group">
                        <td className="py-6 px-8 font-mono font-black text-[14px] text-[#00B4D8] border-l-4 border-transparent group-hover:border-[#00B4D8]">COT-{String(cot.id).padStart(4, '0')}</td>
                        <td className="py-6 px-6 font-black text-[#1e293b] uppercase tracking-tight">{cot.clientes?.nombre_cliente || 'DESCONOCIDO'}</td>
                        <td className="py-6 px-6">
                           <div className="flex flex-col">
                              <span className="font-mono font-black text-slate-700 text-[12px]">{fecha}</span>
                              <span className="text-[9px] text-slate-400 font-black tracking-widest uppercase mt-0.5">{hora}</span>
                           </div>
                        </td>
                        <td className="py-6 px-6 font-black text-[#1e293b] text-[15px] text-right font-mono">S/ {cot.monto_total.toFixed(2)}</td>
                        <td className="py-6 px-6 text-center">
                           <span className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest border-2
                             ${cot.estado === 'Pendiente' ? 'bg-orange-50 border-orange-200 text-orange-600' :
                               cot.estado === 'Aprobado' || cot.estado === 'Completado' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                               cot.estado === 'Rechazado' ? 'bg-red-50 border-red-200 text-red-600' :
                               'bg-slate-100 border-slate-200 text-slate-600' }`}
                           >
                             {cot.estado}
                           </span>
                        </td>
                        <td className="py-6 px-8 text-center bg-slate-50 group-hover:bg-white transition-colors">
                          {cot.estado === 'Pendiente' ? (
                            <div className="flex gap-3 justify-center">
                               <button onClick={() => handleCambiarEstado(cot, 'Aprobado')} className="bg-[#1e293b] text-[#00B4D8] hover:bg-[#00B4D8] hover:text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-2">
                                 <Building2 size={14}/> Aprobar
                               </button>
                               <button onClick={() => handleCambiarEstado(cot, 'Rechazado')} className="bg-white border-2 border-red-100 text-red-300 hover:text-red-600 hover:border-red-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                                 <XCircle size={14}/> Rechazar
                               </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic">
                              Cerrado
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : ( <tr><td colSpan={6} className="py-24 text-center text-slate-300 font-black uppercase tracking-[0.4em]">Sin registros</td></tr> )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL OBLIGATORIO - SQUARE */}
      {obraParaAprobar && (
        <ObrasModal 
           obraPrellenada={obraParaAprobar}
           clientes={clientes}
           usuarios={usuarios}
           proximoIdObra="AUTOGENERADO"
           onClose={() => { setObraParaAprobar(null); setCotizacionAprobando(null); }}
           onSave={handleSaveObraObligatoria}
        />
      )}

    </div>
  );
};