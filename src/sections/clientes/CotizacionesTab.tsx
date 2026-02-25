import { useState, useEffect } from 'react';
import { clientesService, inventarioService, finanzasService, usuariosService } from '../../services/supabase'; 
import type { Cliente, UsuarioSistema } from '../../services/supabase';
import { Search, Calendar, LayoutTemplate, Building2, Loader2, ChevronDown, CheckCircle2, Trash2 } from 'lucide-react';
import { CotizacionGenerador } from './CotizacionGenerador'; 

export const CotizacionesTab = ({ zoom, filtroInicial = '', onFiltroChange }: { zoom: number, filtroInicial?: string, onFiltroChange?: (val: string) => void }) => {
  const [vistaActiva, setVistaActiva] = useState<'gestion' | 'crear'>('gestion');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  // Se mantiene usuarios en el estado si planeas usarlo luego, pero se quita el error de 'no leído'
  const [, setUsuarios] = useState<UsuarioSistema[]>([]); 
  const [historialCotizaciones, setHistorialCotizaciones] = useState<any[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  
  const [cotizacionParaEditar, setCotizacionParaEditar] = useState<any>(null);

  // Filtros
  const [filtroCliente, setFiltroCliente] = useState(filtroInicial);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroSegmento, setFiltroSegmento] = useState('TODOS');

  useEffect(() => {
    const cargarBasicos = async () => {
      try {
        const [c, p, u] = await Promise.all([
          clientesService.listar(), 
          inventarioService.listar(), 
          usuariosService.listar()
        ]);
        setClientes(c); 
        setProductos(p); 
        setUsuarios(u);
      } catch (e) { console.error(e); }
    };
    cargarBasicos();
  }, []);

  useEffect(() => { if (vistaActiva === 'gestion') cargarHistorial(); }, [vistaActiva]);
  useEffect(() => {
    setFiltroCliente(filtroInicial);
  }, [filtroInicial]);
  const cargarHistorial = async () => {
    setCargandoHistorial(true);
    try {
      const data = await finanzasService.listarCotizacionesTodas();
      setHistorialCotizaciones(data || []);
    } catch (e) { console.error(e); }
    setCargandoHistorial(false);
  };

  const actualizarCotizacionRapida = async (id: number, cambios: any) => {
    try {
      await finanzasService.actualizarEstadoCotizacion(id, cambios.estado || undefined);
      await cargarHistorial();
    } catch (e) {
      alert("Error al actualizar");
    }
  };

  const cotizacionesFiltradas = historialCotizaciones.filter(cot => {
    const coincideC = cot.clientes?.nombre_cliente?.toLowerCase().includes(filtroCliente.toLowerCase());
    const coincideF = filtroFecha ? cot.created_at?.startsWith(filtroFecha) : true;
    const tipoDoc = cot.monto_total > 700 ? "FACTURA" : "BOLETA";
    let coincideS = true;
    if (filtroSegmento !== 'TODOS') {
        if (filtroSegmento === 'FACTURA' || filtroSegmento === 'BOLETA') coincideS = tipoDoc === filtroSegmento;
        else coincideS = cot.estado?.toUpperCase() === filtroSegmento;
    }
    return coincideC && coincideF && coincideS;
  });
  const handleEliminar = async (id: number) => {
  if (window.confirm("¿Estás seguro de eliminar esta cotización? Esta acción no se puede deshacer.")) {
    try {
      await finanzasService.eliminarCotizacion(id);
      alert("Cotización eliminada correctamente.");
      // Aquí debes llamar a la función que recarga la lista (ej: fetchCotizaciones)
      cargarHistorial(); 
    } catch (error) {
      console.error(error);
      alert("Error al intentar eliminar.");
    }
  }
  };
  return (
    <div className="flex flex-col animate-in fade-in duration-500 pb-10" style={{ fontSize: `${(zoom / 100) * 12}px` }}>
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 border-l-8 border-[#1e293b] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-[#1e293b] p-2"><LayoutTemplate className="text-[#00B4D8]" size={24} /></div>
          <div>
            <h2 className="text-2xl font-black text-[#1e293b] uppercase tracking-tighter">Bandeja de Gestión</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Edición y Control de Registros</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 border border-slate-200">
           <button onClick={() => { setVistaActiva('gestion'); setCotizacionParaEditar(null); }} className={`px-5 py-2 text-[11px] font-black uppercase transition-all ${vistaActiva === 'gestion' ? 'bg-[#1e293b] text-white shadow-md' : 'text-slate-500'}`}>Bandeja</button>
           <button onClick={() => { setVistaActiva('crear'); setCotizacionParaEditar(null); }} className={`px-5 py-2 text-[11px] font-black uppercase transition-all ${vistaActiva === 'crear' ? 'bg-[#1e293b] text-white shadow-md' : 'text-slate-500'}`}>Crear Nueva</button>
        </div>
      </div>

      {vistaActiva === 'gestion' && (
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-slate-50 border-b grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
  <input 
    type="text" 
    placeholder="Buscar cliente..."
    className="w-full pl-10 pr-4 py-2.5 bg-white border text-[12px] font-bold outline-none focus:border-[#00B4D8] transition-all"
    value={filtroCliente} 
    onChange={(e) => {
      setFiltroCliente(e.target.value);
      if (onFiltroChange) onFiltroChange(e.target.value); // <--- AVISA AL PADRE
    }} 
  />
</div>
            <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="date" className="w-full pl-10 pr-4 py-2.5 bg-white border text-[12px] font-bold outline-none focus:border-[#00B4D8]" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} /></div>
            <div className="relative">
                <select className="w-full bg-white border px-4 py-2.5 text-[12px] font-black uppercase outline-none focus:border-[#00B4D8] appearance-none" value={filtroSegmento} onChange={(e) => setFiltroSegmento(e.target.value)}>
                    <option value="TODOS">TODOS LOS REGISTROS</option>
                    <option value="FACTURA">SOLO FACTURAS</option>
                    <option value="BOLETA">SOLO BOLETAS</option>
                    <option value="APROBADO">SOLO APROBADOS</option>
                    <option value="PENDIENTE">SOLO PENDIENTES</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
            <button onClick={() => { 
    setFiltroCliente(''); 
    setFiltroFecha(''); 
    setFiltroSegmento('TODOS'); 
    if (onFiltroChange) onFiltroChange(''); // <--- AVISA AL PADRE
  }} className="text-[10px] font-black uppercase text-slate-400 hover:text-[#1e293b]">Limpiar</button>
          </div>

          <div className="overflow-x-auto min-h-[500px]">
            <table className="w-full text-[13px] text-left">
              <thead>
                <tr className="bg-[#1e293b] text-white uppercase text-[9px] font-black">
                  <th className="p-4 px-8">ID / Registro</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Tipo Comprobante (Editable)</th>
                  <th className="p-4 text-right">Monto</th>
                  <th className="p-4 text-center">Estado (Editable)</th>
                  <th className="py-4 px-8 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cargandoHistorial ? (
                  <tr><td colSpan={6} className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-[#00B4D8]" size={40}/></td></tr>
                ) : cotizacionesFiltradas.map((cot) => {
                  const d = new Date(cot.created_at);
                  return (
                    <tr key={cot.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-5 px-8">
                         <div className="font-mono font-black text-[#00B4D8]">COT-{String(cot.id).padStart(4, '0')}</div>
                         <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{d.getFullYear()} / {String(d.getMonth()+1).padStart(2,'0')} / {String(d.getDate()).padStart(2,'0')}</div>
                      </td>
                      <td className="p-5 font-black text-[#1e293b]"> {/* Se eliminó 'uppercase' */}
  {cot.clientes?.nombre_cliente || 'Sin titular'}
</td>
                      <td className="p-5">
                         <select 
                            className="bg-slate-100 border border-slate-200 text-[10px] font-black px-2 py-1 uppercase outline-none focus:border-[#00B4D8] cursor-pointer"
                            defaultValue={cot.monto_total > 700 ? "FACTURA" : "BOLETA"}
                         >
                            <option value="BOLETA">BOLETA</option>
                            <option value="FACTURA">FACTURA</option>
                         </select>
                      </td>
                      <td className="p-5 font-black text-right font-mono">S/ {cot.monto_total.toFixed(2)}</td>
                      <td className="p-5 text-center">
                         <select 
                            value={cot.estado} 
                            onChange={(e) => actualizarCotizacionRapida(cot.id, { estado: e.target.value })}
                            className={`px-3 py-1 text-[9px] font-black uppercase border-2 outline-none cursor-pointer transition-all ${
                                cot.estado === 'Aprobado' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 
                                cot.estado === 'Rechazado' ? 'border-red-500 text-red-600 bg-red-50' : 'border-orange-400 text-orange-500'
                            }`}
                         >
                           <option value="Pendiente">PENDIENTE</option>
                           <option value="Aprobado">APROBADO</option>
                           <option value="Rechazado">RECHAZADO</option>
                         </select>
                      </td>
                      <td className="p-5 text-center">
  <div className="flex gap-2 justify-center">
    {cot.estado === 'Aprobado' ? (
      <span className="text-emerald-600 flex items-center gap-1 font-black text-[10px] uppercase italic">
        <CheckCircle2 size={16}/> Oficial
      </span>
    ) : (
      <>
        {/* BOTÓN EDITAR EXISTENTE */}
        <button 
          onClick={() => { setCotizacionParaEditar(cot); setVistaActiva('crear'); }} 
          className="bg-[#1e293b] text-white px-3 py-1.5 text-[9px] font-black uppercase hover:bg-[#00B4D8] transition-all flex items-center gap-2"
        >
          <Building2 size={14}/> Editar
        </button>

        {/* BOTÓN BORRAR NUEVO */}
        <button
          onClick={() => handleEliminar(cot.id)}
          className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 text-[9px] font-black uppercase hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
          title="Eliminar Cotización"
        >
          <Trash2 size={14} /> Borrar
        </button>
      </>
    )}
  </div>
</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {vistaActiva === 'crear' && (
        <CotizacionGenerador 
            clientes={clientes} 
            productos={productos} 
            cotizacionPrevia={cotizacionParaEditar} 
            onSuccess={() => { setCotizacionParaEditar(null); setVistaActiva('gestion'); cargarHistorial(); }} 
        />
      )}
    </div>
  );
};