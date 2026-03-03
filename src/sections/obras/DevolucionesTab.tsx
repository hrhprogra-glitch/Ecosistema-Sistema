// src/sections/obras/DevolucionesTab.tsx
import { useState, useEffect } from 'react';
import { finanzasService, obrasService } from '../../services/supabase';
import { Search, Loader2, Book, User, Package, ClipboardList, StickyNote, Users, Calendar, Clock, History, X } from 'lucide-react';

export const DevolucionesTab = ({ zoom }: { zoom: number }) => {
  const [bitacora, setBitacora] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ESTAS SON LAS DOS LÍNEAS QUE DEBEN ESTAR:
  const [busqueda, setBusqueda] = useState('');
  const [modalHistorial, setModalHistorial] = useState<any | null>(null);
  
  // ESTADOS PARA FILTROS AVANZADOS
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [filtroPersonal, setFiltroPersonal] = useState('');
  const [filtroMaterial, setFiltroMaterial] = useState('');
  
  // ESTADOS PARA CONTROLAR LOS DESPLEGABLES
  const [mostrarResultadosPers, setMostrarResultadosPers] = useState(false);
  const [mostrarResultadosMat, setMostrarResultadosMat] = useState(false);

  // Generamos listas únicas de nombres para las sugerencias
  const listaPersonalUnico = Array.from(new Set(
    bitacora.flatMap(item => [
      ...(item.personal?.map((p: any) => p.nombre) || []),
      ...(item.historial_movimientos?.map((h: any) => h.personal) || [])
    ])
  )).filter(Boolean).sort();

  const listaMaterialUnico = Array.from(new Set(
    bitacora.flatMap(item => [
      ...(item.materiales_reales?.map((m: any) => String(m.nombre || m.producto || '').trim()) || []),
      ...(item.historial_movimientos?.flatMap((h: any) => h.materiales?.map((m: any) => String(m.nombre || m.producto || '').trim())) || [])
    ])
  )).filter(m => m !== '').sort();

  const limpiarFiltros = () => {
    setBusqueda('');
    setFechaInicio('');
    setFechaFin('');
    setFiltroPersonal('');
    setFiltroMaterial('');
  };
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [cots, obras] = await Promise.all([
        finanzasService.listarCotizacionesTodas(),
        obrasService.listar()
      ]);

      // Filtramos para mostrar solo las que ya entraron a ejecución
      const cotizacionesEnObra = (cots || []).filter(cot => 
        cot.estado === 'Aprobado' || cot.estado === 'Obra Terminada' || cot.estado === 'Finalizado'
      );

      const registrosCompletos = cotizacionesEnObra.map(cot => {
        // Buscamos la obra asociada sin importar si está en proceso o terminada
        const obraAsociada = obras.find(o => o.cliente_id === cot.cliente_id);
        
        // EXTRAEMOS MATERIALES: Priorizamos lo que hay en la OBRA (modificado por almacén) 
        // sobre lo que hay en la COTIZACIÓN (plan original).
        const materialesFinales = (obraAsociada && obraAsociada.materiales_asignados && obraAsociada.materiales_asignados.length > 0)
          ? obraAsociada.materiales_asignados // La realidad del almacén
          : (cot.detalles?.flatMap((g: any) => g.items || []) || []); // El plan original si no hay obra

        return {
          ...cot,
          personal: obraAsociada?.trabajadores_asignados || [], 
          codigo_obra: obraAsociada?.codigo_obra || 'N/A',
          materiales_reales: materialesFinales,
          historial_movimientos: (() => {
            const historialReal = Array.isArray(obraAsociada?.historial_movimientos) ? obraAsociada.historial_movimientos : [];
            
            // Si ya existe la planificación en el historial de la DB, la respetamos
            if (historialReal.some((h: any) => h.personal === 'PLANIFICACIÓN INICIAL')) {
              return historialReal;
            }

            // Extraemos y consolidamos materiales originales de la cotización
            const materialesInicioRaw = cot.detalles?.flatMap((g: any) => g.items || []) || [];
            const materialesInicioMap: Record<string, any> = {};
            
            materialesInicioRaw.forEach((m: any) => {
              const nombre = (m.producto || m.nombre || 'Insumo sin nombre').trim();
              const cantidad = Number(m.cantidad) || 0;
              if (cantidad > 0) {
                if (materialesInicioMap[nombre]) {
                  materialesInicioMap[nombre].cantidad += cantidad;
                } else {
                  materialesInicioMap[nombre] = { nombre, cantidad };
                }
              }
            });

            const materialesInicio = Object.values(materialesInicioMap);
            
            // Si no hay materiales en la cotización, solo devolvemos el historial real
            if (materialesInicio.length === 0) return historialReal;

            const registroInicial = {
              fecha: cot.created_at || new Date().toISOString(),
              personal: 'PLANIFICACIÓN INICIAL',
              materiales: materialesInicio
            };

            return [registroInicial, ...historialReal];
          })()
        };
      });

      // Orden cronológico: Año > Mes > Día (Descendente)
      const ordenados = registrosCompletos.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setBitacora(ordenados);
    } catch (error) {
      console.error("Error al cargar la bitácora técnica:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const filtrados = bitacora.filter(item => {
    const matchesBusqueda = item.clientes?.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
                            item.descripcion_trabajo?.toLowerCase().includes(busqueda.toLowerCase()) ||
                            item.codigo_obra.toLowerCase().includes(busqueda.toLowerCase());
    
    const fechaItem = new Date(item.created_at);
    const matchesFechaInicio = fechaInicio ? fechaItem >= new Date(fechaInicio) : true;
    const matchesFechaFin = fechaFin ? fechaItem <= new Date(fechaFin + 'T23:59:59') : true;

    const matchesPersonal = filtroPersonal 
      ? item.personal?.some((p: any) => p.nombre.toLowerCase().includes(filtroPersonal.toLowerCase())) ||
        item.historial_movimientos?.some((h: any) => h.personal.toLowerCase().includes(filtroPersonal.toLowerCase()))
      : true;

    const matchesMaterial = filtroMaterial
      ? item.materiales_reales?.some((m: any) => String(m.nombre || m.producto || '').toLowerCase().includes(filtroMaterial.toLowerCase().trim())) ||
        item.historial_movimientos?.some((h: any) => h.materiales?.some((m: any) => String(m.nombre || m.producto || '').toLowerCase().includes(filtroMaterial.toLowerCase().trim())))
      : true;

    return matchesBusqueda && matchesFechaInicio && matchesFechaFin && matchesPersonal && matchesMaterial;
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-20" style={{ fontSize: `${(zoom / 100) * 12}px` }}>
      
      {/* CABECERA INTEGRADA CON FILTROS CLAROS */}
      <div className="bg-white border-l-[12px] border-[#1e293b] shadow-xl animate-in slide-in-from-top duration-700 relative z-[50]">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-[#1e293b] p-4 shadow-xl">
              <Book className="text-[#00B4D8]" size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-[#1e293b] uppercase tracking-tighter italic">Cuaderno de Apuntes</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">Historial Oficial de Salidas, Personal y Modificaciones</p>
            </div>
          </div>

          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="BUSCAR CLIENTE, OBRA O LABOR..." 
              className="w-full bg-slate-50 border-2 border-slate-100 pl-12 pr-4 py-4 text-[11px] font-black uppercase outline-none focus:border-[#00B4D8] transition-all shadow-inner placeholder:text-slate-300"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {/* PANEL DE FILTROS INTEGRADO (ESTILO CLARO) */}
        <div className="bg-slate-50/50 p-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end border-t border-slate-100 relative z-[60]">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Desde Fecha</p>
            <input type="date" className="w-full bg-white border border-slate-200 p-3 text-[11px] font-bold outline-none focus:border-[#00B4D8] uppercase shadow-sm" 
              value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Hasta Fecha</p>
            <input type="date" className="w-full bg-white border border-slate-200 p-3 text-[11px] font-bold outline-none focus:border-[#00B4D8] uppercase shadow-sm" 
              value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>

          {/* BUSCADOR DESPLEGABLE PERSONAL */}
          <div className="space-y-1 relative">
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest ml-1">Filtro Operario</p>
            <input 
              type="text" 
              placeholder="NOMBRE PERSONAL..." 
              className="w-full bg-white border border-slate-200 p-3 text-[11px] font-bold outline-none focus:border-[#00B4D8] uppercase shadow-sm" 
              value={filtroPersonal} 
              onChange={(e) => { setFiltroPersonal(e.target.value); setMostrarResultadosPers(true); }}
              onFocus={() => setMostrarResultadosPers(true)}
              onBlur={() => setTimeout(() => setMostrarResultadosPers(false), 200)}
            />
            {mostrarResultadosPers && filtroPersonal && (
              <div className="absolute top-full left-0 z-[100] w-full bg-white border border-slate-200 shadow-2xl mt-1 max-h-48 overflow-y-auto">
                {listaPersonalUnico.filter((p: any) => String(p).toLowerCase().includes(filtroPersonal.toLowerCase().trim())).map((p: any, i: number) => (
                  <div key={i} className="p-3 text-[10px] font-black uppercase hover:bg-emerald-50 cursor-pointer border-b border-slate-50 text-slate-600"
                    onMouseDown={(e) => { e.preventDefault(); setFiltroPersonal(p); setMostrarResultadosPers(false); }}>{p}</div>
                ))}
              </div>
            )}
          </div>

          {/* BUSCADOR DESPLEGABLE MATERIAL */}
          <div className="space-y-1 relative">
            <p className="text-[9px] font-black text-[#00B4D8] uppercase tracking-widest ml-1">Insumo Específico</p>
            <input 
              type="text" 
              placeholder="BUSCAR MATERIAL..." 
              className="w-full bg-white border border-slate-200 p-3 text-[11px] font-bold outline-none focus:border-[#00B4D8] uppercase shadow-sm" 
              value={filtroMaterial} 
              onChange={(e) => { setFiltroMaterial(e.target.value); setMostrarResultadosMat(true); }}
              onFocus={() => setMostrarResultadosMat(true)}
              onBlur={() => setTimeout(() => setMostrarResultadosMat(false), 200)}
            />
            {mostrarResultadosMat && filtroMaterial && (
              <div className="absolute top-full left-0 z-[100] w-full bg-white border border-slate-200 shadow-2xl mt-1 max-h-48 overflow-y-auto">
                {listaMaterialUnico.filter((m: any) => String(m).toLowerCase().includes(filtroMaterial.toLowerCase().trim())).map((m: any, i: number) => (
                  <div key={i} className="p-3 text-[10px] font-black uppercase hover:bg-blue-50 cursor-pointer border-b border-slate-50 text-slate-600" 
                    onMouseDown={(e) => { e.preventDefault(); setFiltroMaterial(m); setMostrarResultadosMat(false); }}>{m}</div>
                ))}
              </div>
            )}
          </div>

          <button onClick={limpiarFiltros} className="bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 font-black uppercase text-[10px] p-3.5 tracking-tighter flex items-center justify-center gap-2 transition-all border border-slate-200 shadow-sm active:scale-95">
            <X size={16}/> Limpiar Vista
          </button>
        </div>
      </div>
      {loading ? (
        <div className="py-40 flex flex-col items-center">
          <Loader2 className="animate-spin text-[#00B4D8] mb-4" size={48} />
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Consultando Archivos...</p>
        </div>
      ) : filtrados.length > 0 ? (
        <div className="space-y-10">
          {filtrados.map((item) => {
            const fecha = new Date(item.created_at);
            return (
              <div key={item.id} className="bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row overflow-hidden border-t-4 border-t-[#1e293b]">
                
                {/* BLOQUE IZQUIERDO: FECHA Y CLIENTE */}
                <div className="w-full md:w-72 bg-slate-50 p-8 border-r border-slate-100 flex flex-col items-center text-center">
                  <span className="text-slate-300 font-black text-5xl mb-1 font-mono">{fecha.getFullYear()}</span>
                  <div className="text-[#1e293b] font-black text-2xl uppercase tracking-tighter border-b-2 border-[#1e293b] w-full pb-2 mb-4">
                    {fecha.toLocaleDateString('es-PE', { month: 'long', day: '2-digit' })}
                  </div>
                  <div className="flex flex-col gap-2 mb-6 w-full px-8">
                    <div className="bg-[#1e293b] text-[#00B4D8] px-3 py-1 text-[9px] font-black uppercase tracking-widest w-full">
                      ID: {item.codigo_obra}
                    </div>
                    <div className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border w-full ${
                      item.estado === 'Finalizado' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-orange-50 text-orange-600 border-orange-200 animate-pulse'
                    }`}>
                      {item.estado === 'Finalizado' ? 'Cierre Oficial' : 'En Ejecución / Editable'}
                    </div>
                  </div>
                  <div className="mt-4">
                    <User className="text-[#00B4D8] mx-auto mb-2" size={20} />
                    <p className="text-[13px] font-black text-[#1e293b] uppercase leading-tight">{item.clientes?.nombre_cliente}</p>
                  </div>
                </div>

                {/* BLOQUE DERECHO: DETALLE TÉCNICO Y PERSONAL */}
                <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    {/* TRABAJO REALIZADO */}
                    <div>
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-[#00B4D8] uppercase tracking-widest mb-3">
                        <ClipboardList size={16}/> Labor Realizada
                      </h4>
                      <p className="text-[13px] text-slate-700 font-bold leading-relaxed uppercase bg-blue-50/50 p-4 border-l-4 border-[#00B4D8]">
                        {item.descripcion_trabajo || 'TRABAJO FINALIZADO'}
                      </p>
                    </div>

                    {/* PERSONAL ENCARGADO */}
                    <div>
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">
                        <Users size={16}/> Personal Encargado
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {item.personal && item.personal.length > 0 ? (
                          item.personal.map((p: any, idx: number) => (
                            <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 text-[11px] font-black uppercase flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                              {p.nombre}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[11px] font-bold italic border border-dashed p-2 w-full">S/N Personal</span>
                        )}
                      </div>
                    </div>

                    {/* NOTAS */}
                    <div>
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        <StickyNote size={16}/> Observaciones
                      </h4>
                      <div className="text-[11px] text-slate-600 font-medium whitespace-pre-wrap bg-slate-50 p-4 border border-slate-200 italic">
                        {item.nota || 'SIN OBSERVACIONES'}
                      </div>
                    </div>
                  </div>

                  {/* MATERIALES REALES (LO QUE AGREGÓ EL ALMACÉN) */}
                  <div className="bg-slate-50/50 p-6 border border-slate-100 rounded-sm relative flex flex-col">
                    <h4 className="flex items-center gap-2 text-[10px] font-black text-[#1e293b] uppercase tracking-widest mb-5">
                      <Package size={18} className="text-[#00B4D8]"/> Lista Actual de Materiales
                    </h4>
                    
                    <div className="space-y-3 flex-1">
                      {/* MOSTRAR SOLO LA VERSIÓN FINAL O ÚLTIMA MODIFICACIÓN */}
                      {(() => {
  // Simplemente mostramos los materiales actuales que ya calculamos arriba
  // Esto evita que las cantidades se sumen infinitamente
  const materialesAMostrar = item.materiales_reales || [];

  // Consolidamos por si acaso hay duplicados en la lista de materiales_reales
  const consolidados: Record<string, any> = {};
  materialesAMostrar.forEach((m: any) => {
    const nombre = m.nombre || m.producto;
    const cantidad = Number(m.cantidad);
    if (consolidados[nombre]) consolidados[nombre].cantidad += cantidad;
    else consolidados[nombre] = { ...m, nombre, cantidad };
  });

  const listaFinal = Object.values(consolidados).filter((m: any) => m.cantidad > 0);

  return listaFinal.map((mat: any, mIdx: number) => (
    <div key={mIdx} className="flex items-center gap-4 text-[12px] border-b border-white pb-2 group/item">
      <div className="bg-[#1e293b] text-white font-mono font-black px-2 py-1 min-w-[35px] text-center text-[11px]">
        {mat.cantidad}
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-slate-700 uppercase leading-none">{mat.nombre}</span>
      </div>
    </div>
  ));
})()}
                    </div>

                    {/* BOTÓN PARA ABRIR VENTANA FLOTANTE (CORREGIDO) */}
<div className="mt-6 pt-4 border-t border-slate-200 shrink-0">
  <button 
    onClick={() => {
      if (item.historial_movimientos && item.historial_movimientos.length > 0) {
        setModalHistorial(item);
      } else {
        alert("Esta es una obra antigua. El registro de historial comenzó a guardarse a partir de hoy.");
      }
    }}
    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white px-4 py-3 shadow-sm w-full justify-center transition-colors ${
      item.historial_movimientos && item.historial_movimientos.length > 0 
        ? 'bg-[#1e293b] hover:bg-slate-700 cursor-pointer' 
        : 'bg-slate-300 cursor-not-allowed'
    }`}
  >
    <History size={14} className={item.historial_movimientos && item.historial_movimientos.length > 0 ? "text-[#00B4D8]" : "text-white"}/> 
    {item.historial_movimientos && item.historial_movimientos.length > 0 
      ? 'Ver Historial de Modificaciones' 
      : 'Sin Historial Anterior'}
  </button>
</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-40 text-center bg-white border-4 border-dashed border-slate-200">
          <Book size={64} className="mx-auto mb-4 text-slate-200 opacity-20" />
          <p className="text-slate-400 font-black uppercase text-[12px] tracking-[0.5em]">No hay apuntes técnicos registrados</p>
        </div>
      )}

      {/* VENTANA FLOTANTE DE MODIFICACIONES */}
      {modalHistorial && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl shadow-2xl border-t-[8px] border-[#00B4D8] flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* CABECERA DEL MODAL */}
            <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-black text-[#1e293b] uppercase tracking-tighter flex items-center gap-2">
                  <History className="text-[#00B4D8]" size={24}/> Historial de Cambios
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                  Cliente: {modalHistorial.clientes?.nombre_cliente} | Obra: {modalHistorial.codigo_obra}
                </p>
              </div>
              <button onClick={() => setModalHistorial(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                <X size={28}/>
              </button>
            </div>
            
            {/* CONTENIDO DEL MODAL (LISTA DE MODIFICACIONES) */}
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1 space-y-6">
              {/* Usamos .reverse() para que la última modificación salga arriba, pero las etiquetas dirán la verdad */}
{[...modalHistorial.historial_movimientos].reverse().map((mov: any, idx: number) => {
  const fechaMov = new Date(mov.fecha);
                const totalMovimientos = modalHistorial.historial_movimientos.length;
                const indiceReal = totalMovimientos - 1 - idx; 
                const esInicio = mov.personal === 'PLANIFICACIÓN INICIAL';

                // Consolidación ultra-segura para evitar el "en blanco"
                const consolidados: Record<string, any> = {};
                const listaRaw = mov.materiales || [];
                
                listaRaw.forEach((m: any) => {
                  const nombre = (m.nombre || m.producto || 'Insumo sin nombre').trim();
                  const cantidad = Number(m.cantidad) || 0;
                  if (cantidad > 0) {
                    if (consolidados[nombre]) consolidados[nombre].cantidad += cantidad;
                    else consolidados[nombre] = { nombre, cantidad };
                  }
                });

                const materialesFinales = Object.values(consolidados);

                return (
                  <div key={idx} className={`p-6 border-l-[8px] shadow-xl relative bg-white mb-8 transition-all ${
                    esInicio ? 'border-emerald-500 shadow-emerald-100' : 'border-[#00B4D8] shadow-blue-100'
                  }`}>
                    {/* ETIQUETA FLOTANTE SUPERIOR */}
                    <div className="absolute -top-3 right-4">
                      <span className={`px-4 py-1 text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-md ${
                        esInicio ? 'bg-emerald-500' : 'bg-[#1e293b]'
                      }`}>
                        {esInicio ? 'Punto de Partida' : `Actualización #${indiceReal}`}
                      </span>
                    </div>

                    <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[#1e293b]">
                          <Calendar size={18} className={esInicio ? "text-emerald-500" : "text-[#00B4D8]"}/>
                          <span className="font-black text-[15px] uppercase italic">
                            {fechaMov.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 ml-1">
                          <Clock size={14}/>
                          <span className="text-[11px] font-bold">
                            Registrado a las {fechaMov.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Responsable</p>
                        <span className="bg-slate-100 text-[#1e293b] px-4 py-2 text-[10px] font-black uppercase border border-slate-200 block shadow-sm">
                          {mov.personal || 'SISTEMA'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
                        <Package size={16} className="text-[#00B4D8]"/> Insumos en Obra:
                      </h4>
                      
                      <div className="grid grid-cols-1 gap-2.5">
                        {materialesFinales.length > 0 ? (
                          materialesFinales.map((m: any, i: number) => (
                            <div key={i} className="flex items-center justify-between bg-slate-50/50 p-4 border border-slate-100 group hover:bg-white hover:border-[#00B4D8] transition-all shadow-sm">
                              <span className="text-[12px] font-black text-slate-700 uppercase group-hover:text-[#1e293b]">
                                {m.nombre}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cantidad</span>
                                <span className="bg-[#1e293b] text-white font-mono font-black px-4 py-1.5 text-[14px] shadow-md group-hover:bg-[#00B4D8] transition-colors min-w-[50px] text-center">
                                  {m.cantidad}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-10 text-center border-2 border-dashed border-slate-200 bg-slate-50">
                            <Package size={32} className="mx-auto mb-2 text-slate-200" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                              Sin materiales registrados en este punto
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
})}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};