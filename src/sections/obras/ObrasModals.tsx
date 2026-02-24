import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Plus, Building2, X, UserPlus, Loader2, FileText, MapPin, ExternalLink, Save, Crosshair, Users, HardHat, PackagePlus, Calendar,LayoutTemplate, User, AlertTriangle, Activity, PackageOpen, ClipboardList } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; 

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
});

const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => { map.flyTo(center, 16, { duration: 1 }); }, [center, map]);
  return null;
};

const inputEstilo = "w-full bg-slate-50 border border-slate-300 rounded-xl px-5 py-3.5 text-[15px] font-medium text-slate-800 outline-none focus:bg-white focus:border-[#00B4D8] focus:ring-4 focus:ring-[#00B4D8]/20 transition-all shadow-sm";
const labelEstilo = "block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1";

// ==========================================
// 1. MODAL: CREAR / EDITAR OBRA (COMPARTIDO)
// ==========================================
export const ObrasModal = ({ obraSeleccionada, obraPrellenada, clientes, usuarios, onClose, onSave, onOpenClienteRapido, proximoIdObra }: any) => {
  const hoy = new Date().toISOString().split('T')[0];
  
  const [formObra, setFormObra] = useState({ 
    cliente_id: obraSeleccionada?.cliente_id ? String(obraSeleccionada.cliente_id) : (obraPrellenada?.cliente_id || ''), 
    estado: obraSeleccionada?.estado || obraPrellenada?.estado || 'Planificación',
    direccion_link: obraSeleccionada?.direccion_link || obraPrellenada?.direccion_link || '',
    fecha_inicio: obraSeleccionada?.fecha_inicio || obraPrellenada?.fecha_inicio || hoy,
    trabajadores_asignados: obraSeleccionada?.trabajadores_asignados || obraPrellenada?.trabajadores_asignados || ([] as number[])
  });

  const extractCoords = (link: string): [number, number] => {
    if (!link) return [-12.0464, -77.0428]; 
    const match = link.match(/(?:@|q=|ll=)(-?\d+\.\d+),(-?\d+\.\d+)/);
    return match ? [parseFloat(match[1]), parseFloat(match[2])] : [-12.0464, -77.0428];
  };

  const [mapCenter, setMapCenter] = useState<[number, number]>(extractCoords(formObra.direccion_link));
  const [searchAddress, setSearchAddress] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [procesando, setProcesando] = useState(false);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) setShowSearchDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBuscarDireccion = async () => {
    if (!searchAddress.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=5`);
      const data = await res.json();
      setSearchResults(data);
      setShowSearchDropdown(true);
    } catch (e) { console.error("Error buscando"); } finally { setIsSearching(false); }
  };

  const seleccionarDireccion = (lat: string, lon: string, displayName: string) => {
    const latNum = parseFloat(lat); const lonNum = parseFloat(lon);
    setMapCenter([latNum, lonNum]);
    setFormObra(prev => ({ ...prev, direccion_link: `https://www.google.com/maps?q=${latNum},${lonNum}` }));
    setSearchAddress(displayName);
    setShowSearchDropdown(false);
  };

  const markerEventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const { lat, lng } = marker.getLatLng();
        setMapCenter([lat, lng]);
        setFormObra(prev => ({ ...prev, direccion_link: `https://www.google.com/maps?q=${lat},${lng}` }));
      }
    },
  }), []);

  const toggleTrabajador = (id: number) => {
    setFormObra(prev => ({
       ...prev,
       trabajadores_asignados: prev.trabajadores_asignados.includes(id)
          ? prev.trabajadores_asignados.filter(wId => wId !== id)
          : [...prev.trabajadores_asignados, id]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!formObra.cliente_id) return alert('El cliente es obligatorio.');
    if(!formObra.direccion_link.includes('http')) return alert('⚠️ DEBES ingresar un enlace válido del mapa (puedes buscar la dirección en el mapa para generarlo).');
    if(formObra.trabajadores_asignados.length === 0) return alert('⚠️ DEBES asignar al menos 1 trabajador a la obra.');
    
    setProcesando(true);
    await onSave(formObra);
    setProcesando(false);
  };

  const trabajadoresDelSistema = usuarios.filter((u: any) => u.role === 'trabajador');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 lg:p-8 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] max-h-[850px] flex flex-col overflow-hidden border border-slate-300 animate-in zoom-in-95">
        
        <div className="px-10 py-6 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shadow-sm text-[#00B4D8]">
                <Building2 size={24} />
             </div>
             <div>
               <h3 className="text-[20px] font-black text-slate-800 tracking-tight leading-tight">
                  {obraPrellenada ? 'Completar Datos del Proyecto (Obligatorio)' : (obraSeleccionada ? 'Modificar Proyecto' : 'Asignar Nueva Obra')}
               </h3>
               <div className="flex items-center gap-3 mt-1.5">
                 <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Código:</span>
                 <span className="text-[11px] font-black text-[#00B4D8] bg-[#e0f7fa] px-2 py-0.5 rounded border border-[#00B4D8]/30 shadow-sm">{proximoIdObra}</span>
               </div>
             </div>
          </div>
          {/* Se reestableció el botón cerrar "X" para todos los casos */}
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"><X size={20}/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          
          <div className="w-full md:w-[45%] p-8 md:p-10 border-r border-slate-200 bg-white overflow-y-auto flex flex-col gap-8 custom-scrollbar">
             <div className="space-y-6">
                <div>
                  <label className={labelEstilo}>Cliente Contratante <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select required className={inputEstilo} value={formObra.cliente_id} onChange={e => setFormObra({...formObra, cliente_id: e.target.value})} disabled={!!obraPrellenada}>
                        <option value="" disabled>-- Seleccionar de la Cartera --</option>
                        {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nombre_cliente}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelEstilo}>Fecha de Inicio</label>
                  <input type="date" required className={inputEstilo} value={formObra.fecha_inicio} onChange={e => setFormObra({...formObra, fecha_inicio: e.target.value})} />
                </div>
             </div>

             <div className="pt-2">
                <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <HardHat size={16} className="text-orange-500"/> Equipo Autorizado <span className="text-red-500">*</span>
                </h4>
                <p className="text-[11px] text-slate-500 mb-4 font-medium leading-relaxed">Obligatorio: Selecciona qué trabajadores tendrán permiso para registrar materiales en esta obra.</p>
                
                <div className="flex flex-wrap gap-2.5">
                   {trabajadoresDelSistema.map((worker: any) => {
                      const isSelected = formObra.trabajadores_asignados.includes(worker.id!);
                      return (
                         <div 
                           key={worker.id} onClick={() => toggleTrabajador(worker.id!)}
                           className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all select-none ${isSelected ? 'border-[#00B4D8] bg-[#e0f7fa]/30 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                         >
                            <img src="/worker.svg" alt="Worker" className="w-6 h-6 opacity-90"/>
                            <span className={`text-[12px] font-black ${isSelected ? 'text-[#0096b4]' : 'text-slate-600'}`}>{worker.full_name}</span>
                         </div>
                      );
                   })}
                </div>
             </div>
          </div>

          <div className="w-full md:w-[55%] p-8 md:p-10 bg-slate-50 flex flex-col overflow-y-auto custom-scrollbar">
             <div ref={searchContainerRef} className="relative mb-6">
                <label className={labelEstilo}>Buscador de Direcciones</label>
                <div className="flex gap-2 relative">
                   <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                         {isSearching ? <Loader2 size={18} className="text-[#00B4D8] animate-spin" /> : <Search size={18} className="text-slate-400" />}
                      </div>
                      <input 
                        type="text" 
                        className={`${inputEstilo} pl-12 text-[14px]`}
                        placeholder="Busca la dirección de la obra aquí..."
                        value={searchAddress}
                        onChange={e => setSearchAddress(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleBuscarDireccion())}
                      />
                      {showSearchDropdown && searchResults.length > 0 && (
                         <div className="absolute top-full left-0 w-full bg-white border border-slate-200 shadow-2xl rounded-xl mt-2 z-[200] max-h-60 overflow-y-auto">
                            {searchResults.map((res: any, idx: number) => (
                               <div key={idx} onMouseDown={() => seleccionarDireccion(res.lat, res.lon, res.display_name)} className="p-4 text-[13px] hover:bg-[#e0f7fa] hover:text-[#0096b4] font-medium border-b border-slate-100 cursor-pointer flex items-start gap-3 transition-colors">
                                  <MapPin size={16} className="shrink-0 mt-0.5 text-slate-400"/>
                                  <span>{res.display_name}</span>
                               </div>
                            ))}
                         </div>
                      )}
                   </div>
                   <button type="button" onClick={handleBuscarDireccion} className="px-6 bg-slate-800 text-white rounded-xl text-[13px] font-bold hover:bg-slate-900 transition-colors shadow-sm">
                      Buscar
                   </button>
                </div>
             </div>

             <div className="flex-1 flex flex-col min-h-[300px]">
                <label className={labelEstilo}>Enlace Oficial del Mapa <span className="text-red-500">*</span></label>
                <div className="relative mb-4">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><ExternalLink size={18} className="text-[#00B4D8]" /></div>
                   <input required type="url" className={`${inputEstilo} pl-12 bg-[#e0f7fa]/50 border-[#00B4D8]/30 text-[#0096b4] font-mono text-[13px]`} placeholder="Enlace oficial de coordenadas (Se genera buscando en el mapa)..." value={formObra.direccion_link} onChange={e => setFormObra({...formObra, direccion_link: e.target.value})} />
                </div>

                <div className="flex-1 w-full border-2 border-slate-200 rounded-2xl overflow-hidden relative z-0 shadow-inner min-h-[250px]">
                   <MapContainer center={mapCenter} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={true}>
                     <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                     <MapController center={mapCenter} />
                     <Marker position={mapCenter} icon={redIcon} draggable={true} eventHandlers={markerEventHandlers} ref={markerRef} />
                   </MapContainer>
                   <div className="absolute bottom-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-md text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 pointer-events-none border border-slate-200">
                     <Crosshair size={14} className="text-[#00B4D8]"/> Arrastra el marcador para afinar
                   </div>
                </div>
             </div>
          </div>

          <button type="submit" id="btn-submit-obra" className="hidden"></button>
        </form>

        <div className="px-10 py-5 border-t border-slate-200 bg-white flex justify-between items-center shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="px-4 py-2 bg-[#e0f7fa]/50 border border-[#00B4D8]/20 rounded-md text-[12px] font-bold text-[#0096b4] flex items-center gap-2">
             <Users size={16}/> {formObra.trabajadores_asignados.length} trabajador(es) seleccionados.
          </div>
          <div className="flex gap-4">
            {/* Se reestableció el botón Cancelar para todos los casos */}
            <button type="button" onClick={onClose} className="h-12 px-8 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-[13px] font-black uppercase tracking-wider transition-colors">
               Cancelar
            </button>
            <button disabled={procesando} onClick={() => document.getElementById('btn-submit-obra')?.click()} className="h-12 px-10 bg-[#00B4D8] hover:bg-[#0096b4] text-white rounded-xl text-[13px] font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-[#00B4D8]/20 transition-all disabled:opacity-70">
               {procesando ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} 
               {obraPrellenada ? 'Aprobar y Crear Obra' : 'Guardar Cambios'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ==========================================
// 2. MODAL: INGRESAR MATERIAL
// ==========================================
export const IngresarMaterialModal = ({ obraSeleccionada, usuarios, inventario, onClose, onConfirm, procesando }: any) => {
  const [ingresoForm, setIngresoForm] = useState({ trabajador_id: '', cantidad: 1 });
  const [busqueda, setBusqueda] = useState('');
  const [prodSelect, setProdSelect] = useState<any>(null);

  const personalAutorizado = usuarios.filter((u: any) => obraSeleccionada.trabajadores_asignados?.includes(u.id));
  const productosFiltrados = busqueda ? inventario.filter((p: any) => p.producto.toLowerCase().includes(busqueda.toLowerCase()) || p.codigo.toLowerCase().includes(busqueda.toLowerCase())) : [];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white shadow-2xl w-full max-w-2xl flex flex-col border border-slate-200 animate-in zoom-in-95 rounded-2xl overflow-visible">
         <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-2xl">
            <h3 className="text-[18px] font-black text-[#00B4D8] uppercase flex items-center gap-2 tracking-tight">
               <PackagePlus size={24}/> Registrar Salida de Almacén a Obra
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-red-500 bg-white p-2 rounded-xl border border-slate-200 shadow-sm transition-colors"><X size={20}/></button>
         </div>
         
         <div className="p-8 bg-slate-50/50 flex flex-col gap-6 overflow-visible rounded-b-2xl">
            {personalAutorizado.length === 0 ? (
               <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl flex items-start gap-4">
                  <AlertTriangle className="text-orange-500 shrink-0 mt-1" size={24}/>
                  <div>
                    <h4 className="font-black text-orange-700 text-[15px]">No hay personal autorizado</h4>
                    <p className="text-[13px] text-orange-600 mt-1 font-medium">Esta obra no tiene trabajadores asignados. Por favor, cierra esta ventana y usa el botón <b>"Equipo"</b> en la tabla para autorizar al personal.</p>
                  </div>
               </div>
            ) : (
              <>
                <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-3 text-slate-400">
                    <User size={18} className="text-[#00B4D8]"/>
                    <h3 className="font-black uppercase tracking-widest text-[11px]">1. Selecciona el Operario</h3>
                  </div>
                  <select className={inputEstilo} value={ingresoForm.trabajador_id} onChange={e => setIngresoForm({...ingresoForm, trabajador_id: e.target.value})}>
                     <option value="" disabled>-- Selecciona quién retira el material --</option>
                     {personalAutorizado.map((u: any) => ( <option key={u.id} value={u.id}>{u.full_name} ({u.role === 'admin' ? 'Supervisor' : 'Operario'})</option> ))}
                   </select>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm relative z-50">
                   <div className="flex items-center gap-2 mb-4 text-slate-400">
                      <FileText size={18} className="text-[#00B4D8]"/>
                      <h3 className="font-black uppercase tracking-widest text-[11px]">2. Buscar Material</h3>
                   </div>
                   <div className="relative">
                     <input placeholder="BUSCAR MATERIAL (ENTER)" className={`${inputEstilo} pl-12 uppercase placeholder:text-slate-400`} value={busqueda} onChange={e => { setBusqueda(e.target.value); setProdSelect(null); }} />
                     <Search size={18} className="absolute left-4 top-4 text-slate-400" />
                     {busqueda && !prodSelect && productosFiltrados.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-xl max-h-60 overflow-y-auto z-[200]">
                           {productosFiltrados.map((p: any) => (
                             <button key={p.id} onClick={() => { setProdSelect(p); setBusqueda(p.producto); }} className="w-full text-left p-4 hover:bg-[#e0f7fa] border-b border-slate-100 flex justify-between items-center transition-colors">
                               <div className="flex flex-col flex-1 min-w-0 pr-4">
                                 <span className="text-[13px] uppercase font-black text-slate-700 truncate">{p.producto}</span>
                                 <span className="text-[11px] text-slate-500 font-bold mt-1">Stock: <span className="text-[#00B4D8]">{p.stock_actual} {p.unidad_medida}</span></span>
                               </div>
                               <span className="font-mono text-slate-800 font-black shrink-0 text-[14px]">S/ {p.precio?.toFixed(2)}</span>
                             </button>
                           ))}
                        </div>
                     )}
                   </div>

                   {prodSelect && (
                      <div className="bg-slate-50 border border-[#00B4D8]/30 p-5 mt-5 rounded-xl shadow-inner">
                         <div className="flex gap-4 items-center">
                           <div className="w-1/3">
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cantidad</label>
                              <input type="number" min="1" max={prodSelect.stock_actual} className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-center font-black text-lg text-slate-800 outline-none focus:ring-4 ring-[#00B4D8]/20 focus:border-[#00B4D8] transition-all shadow-sm" value={ingresoForm.cantidad} onChange={e => setIngresoForm({...ingresoForm, cantidad: Number(e.target.value)})} />
                           </div>
                           <div className="flex-1 mt-6">
                              <button disabled={procesando} onClick={() => onConfirm(ingresoForm, prodSelect)} className="w-full h-14 bg-[#00B4D8] hover:bg-[#0096b4] text-white font-black uppercase tracking-widest text-[12px] rounded-xl shadow-md shadow-[#00B4D8]/20 transition-all flex items-center justify-center gap-2">
                                {procesando ? <Loader2 size={18} className="animate-spin"/> : <><Plus size={18} /> Confirmar Retiro</>}
                              </button>
                           </div>
                         </div>
                      </div>
                   )}
                </div>
              </>
            )}
         </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. MODAL: SUPERVISAR EQUIPO Y MOVIMIENTOS
// ==========================================
export const SupervisarEquipoModal = ({ obraSeleccionada, usuarios, onClose }: any) => {
  // Estado para el filtro: 'TODOS' por defecto, o el nombre del trabajador
  const [filtroActivo, setFiltroActivo] = useState<string>('TODOS');

  // Obtener solo los trabajadores que fueron asignados a esta obra
  const trabajadoresAsignados = usuarios.filter((u: any) => obraSeleccionada.trabajadores_asignados?.includes(u.id));
  
  // Obtener historial y aplicar el filtro
  const historial = obraSeleccionada.materiales_asignados || [];
  const historialFiltrado = filtroActivo === 'TODOS' 
    ? historial 
    : historial.filter((m: any) => m.trabajador_nombre === filtroActivo);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 lg:p-8 animate-in fade-in">
       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden border border-slate-300 animate-in zoom-in-95">
          
          {/* HEADER */}
          <div className="px-8 py-5 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-sm text-white"><Users size={24} /></div>
                <div>
                  <h3 className="text-[18px] font-black text-slate-800 tracking-tight leading-tight">Supervisión de Retiros por Operario</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[12px] font-bold text-slate-500">Obra:</span>
                    <span className="text-[12px] font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{obraSeleccionada.nombre_obra}</span>
                  </div>
                </div>
             </div>
             <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 border border-slate-200 rounded-xl transition-all"><X size={20}/></button>
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 bg-slate-50">
             
             {/* PANEL IZQUIERDO: Filtro de Trabajadores */}
             <div className="w-full md:w-[35%] p-8 border-r border-slate-200 bg-white overflow-y-auto custom-scrollbar flex flex-col">
                <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                   <Search size={18} className="text-[#00B4D8]"/> Filtro por Operario
                </h4>
                <p className="text-[12px] text-slate-500 font-medium mb-5">Selecciona un trabajador para ver específicamente los materiales que ha retirado del almacén.</p>
                
                <div className="space-y-3 flex-1 overflow-y-auto">
                   {/* Botón TODOS */}
                   <div 
                     onClick={() => setFiltroActivo('TODOS')} 
                     className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${filtroActivo === 'TODOS' ? 'border-[#00B4D8] bg-[#e0f7fa]/30 shadow-sm' : 'border-transparent bg-slate-50 hover:border-slate-200'}`}
                   >
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0"><Users size={16} className="text-slate-600"/></div>
                      <span className={`font-black text-[14px] ${filtroActivo === 'TODOS' ? 'text-[#0096b4]' : 'text-slate-600'}`}>General (Todos)</span>
                   </div>

                   {/* Lista de Trabajadores */}
                   {trabajadoresAsignados.map((w: any) => {
                      const sel = filtroActivo === w.full_name;
                      return (
                         <div 
                           key={w.id} 
                           onClick={() => setFiltroActivo(w.full_name)} 
                           className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${sel ? 'border-[#00B4D8] bg-[#e0f7fa]/30 shadow-sm' : 'border-transparent bg-slate-50 hover:border-slate-200'}`}
                         >
                            <img src="/worker.svg" alt="W" className="w-8 h-8 shrink-0"/>
                            <div className="flex flex-col">
                               <span className={`font-black text-[14px] ${sel ? 'text-[#0096b4]' : 'text-slate-700'}`}>{w.full_name}</span>
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{w.role === 'admin' ? 'Supervisor' : 'Operario'}</span>
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>

             {/* PANEL DERECHO: Historial Filtrado */}
             <div className="w-full md:w-[65%] p-8 overflow-y-auto custom-scrollbar bg-[#F8FAFC]">
                <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                   <Activity size={18} className="text-emerald-500"/> Registro de Movimientos {filtroActivo !== 'TODOS' && <span className="text-[#00B4D8]">({filtroActivo})</span>}
                </h4>

                <div className="space-y-4">
                   {historialFiltrado.length > 0 ? [...historialFiltrado].reverse().map((m: any, i: number) => (
                      <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md hover:border-slate-300">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
                               <PackageOpen size={24}/>
                            </div>
                            <div>
                               <p className="font-black text-slate-800 text-[15px] uppercase tracking-tight">{m.producto || m.descripcion}</p>
                               <div className="flex items-center gap-2 mt-1">
                                 <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-widest">{m.codigo || 'S/N'}</span>
                                 <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-widest flex items-center gap-1">
                                   <Calendar size={10}/> {m.fecha_retiro ? new Date(m.fecha_retiro).toLocaleDateString('es-PE') : 'S/F'}
                                 </span>
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-6 md:text-right">
                            {/* Mostrar quién lo retiró siempre de forma destacada */}
                            <div className="flex flex-col items-start md:items-end">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Retirado por:</span>
                               <span className="text-[11px] font-black text-[#00B4D8] bg-[#e0f7fa] px-2.5 py-1 rounded-md border border-[#00B4D8]/20 uppercase tracking-widest flex items-center gap-1.5">
                                 <User size={12}/> {m.trabajador_nombre || 'Desconocido'}
                               </span>
                            </div>
                            <div className="text-right border-l border-slate-100 pl-6">
                               <p className="font-black text-[22px] text-slate-800 leading-none">{m.cantidad} <span className="text-[11px] font-bold text-slate-500 uppercase">{m.unidad || 'UND.'}</span></p>
                               <p className="text-[12px] font-black text-emerald-600 mt-1">S/ {(m.total || (m.precioUnit * m.cantidad) || 0).toFixed(2)}</p>
                            </div>
                         </div>
                      </div>
                   )) : (
                      <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
                         <ClipboardList size={48} className="mx-auto text-slate-300 mb-4"/>
                         <p className="text-[16px] font-black text-slate-700">No hay registros</p>
                         <p className="text-[13px] text-slate-500 mt-1 font-medium">
                           {filtroActivo === 'TODOS' ? 'Nadie ha retirado material para esta obra.' : `El operario ${filtroActivo} no ha retirado ningún material.`}
                         </p>
                      </div>
                   )}
                </div>
             </div>

          </div>
       </div>
    </div>
  );
};

// ==========================================
// 4. MODAL: ABONAR (FINANZAS)
// ==========================================
export const AbonarObraModal = ({ obraSeleccionada, onClose, onConfirm, procesando }: any) => {
  const pagado = obraSeleccionada.monto_pagado || 0;
  const deuda = (obraSeleccionada.costo_acumulado || 0) - pagado;
  const [montoPago, setMontoPago] = useState(deuda > 0 ? deuda.toString() : '');
  const [metodoPago, setMetodoPago] = useState('Transferencia BCP');

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-t-emerald-500 border border-slate-200 animate-in zoom-in-95 overflow-hidden">
         <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-[16px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><LayoutTemplate size={20} /> Registrar Abono</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
         </div>
         <div className="p-8 space-y-6">
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-center shadow-inner">
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Costo Acumulado</p>
              <p className="text-xl font-black text-slate-800 font-mono tracking-tighter">S/ {obraSeleccionada.costo_acumulado?.toFixed(2) || '0.00'}</p>
              <div className="h-px bg-slate-200 w-full my-3"></div>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Deuda Restante</p>
              <p className="text-3xl font-black text-orange-500 font-mono tracking-tighter">S/ {deuda.toFixed(2)}</p>
            </div>
            <div>
               <label className={labelEstilo}>Monto a Ingresar (S/)</label>
               <input type="number" autoFocus className={`${inputEstilo} font-mono text-xl font-black text-center`} value={montoPago} onChange={e => setMontoPago(e.target.value)} />
            </div>
            <div>
               <label className={labelEstilo}>Método de Pago</label>
               <select className={inputEstilo} value={metodoPago} onChange={e => setMetodoPago(e.target.value)}>
                 <option value="Transferencia BCP">TRANSFERENCIA BCP</option>
                 <option value="Yape">YAPE</option>
                 <option value="Plin">PLIN</option>
                 <option value="Efectivo">EFECTIVO</option>
               </select>
            </div>
            <button disabled={procesando} onClick={() => onConfirm(montoPago)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 mt-4 rounded-xl flex justify-center font-black uppercase tracking-widest text-[12px] transition-all shadow-md shadow-emerald-500/30 disabled:opacity-50">
              {procesando ? 'PROCESANDO...' : 'CONFIRMAR RECEPCIÓN'}
            </button>
         </div>
      </div>
    </div>
  );
};