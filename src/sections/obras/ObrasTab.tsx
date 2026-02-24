import { useState, useEffect } from 'react';
import { Search, Plus, Building2, Edit2, Trash2, Loader2, PackagePlus, DollarSign, Users, RefreshCcw } from 'lucide-react';
import { clientesService, inventarioService, obrasService, usuariosService } from '../../services/supabase'; 
import type { Obra, UsuarioSistema } from '../../services/supabase';
import { ObrasModal, IngresarMaterialModal, SupervisarEquipoModal, AbonarObraModal } from './ObrasModals';

interface ObraVista extends Obra {
  cliente_nombre?: string;
  monto_pagado?: number; 
}

export const ObrasTab = ({ accionDirecta }: { accionDirecta?: 'salida' | 'devolucion' | null }) => {
  const [obras, setObras] = useState<ObraVista[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [inventario, setInventario] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]); 
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  const [showModalObra, setShowModalObra] = useState(false);
  const [showIngresarModal, setShowIngresarModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false); 
  const [showEquipoModal, setShowEquipoModal] = useState(false);
  
  const [obraSeleccionada, setObraSeleccionada] = useState<ObraVista | null>(null);
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [dataClientes, dataInventario, dataObras, dataUsuarios] = await Promise.all([
        clientesService.listar(), inventarioService.listar(), obrasService.listar(), usuariosService.listar()
      ]);
      setClientes(dataClientes || []); setInventario(dataInventario || []); setUsuarios(dataUsuarios || []);
      const obrasMapeadas = (dataObras || []).map(o => ({ ...o, cliente_nombre: o.clientes?.nombre_cliente || 'Desconocido' }));
      setObras(obrasMapeadas);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { cargarDatos(); }, []);

  const eliminarObra = async (id: number) => {
    if(confirm('¿Seguro que deseas eliminar esta obra permanentemente?')) {
      try { await obrasService.eliminar(id); setObras(obras.filter(o => o.id !== id)); } catch(e) { alert("Error al eliminar"); }
    }
  };

  const handleSaveObra = async (formData: any) => {
    try {
      const cliente = clientes.find(c => String(c.id) === formData.cliente_id);
      const nombreGenerado = `Proyecto ${cliente?.nombre_cliente || 'Desconocido'}`;

      if (obraSeleccionada) {
        await obrasService.actualizar(obraSeleccionada.id!, {
          nombre_obra: nombreGenerado, cliente_id: Number(formData.cliente_id), estado: formData.estado,
          direccion_link: formData.direccion_link, fecha_inicio: formData.fecha_inicio,
          trabajadores_asignados: formData.trabajadores_asignados
        });
      } else {
        const count = obras.length + 1;
        await obrasService.crear({
          codigo_obra: `OBRA-${String(count).padStart(4, '0')}`, nombre_obra: nombreGenerado,
          cliente_id: Number(formData.cliente_id), estado: 'En proceso', 
          costo_acumulado: 0, monto_pagado: 0, direccion_link: formData.direccion_link, 
          fecha_inicio: formData.fecha_inicio, materiales_asignados: [],
          trabajadores_asignados: formData.trabajadores_asignados 
        });
      }
      setShowModalObra(false); await cargarDatos();
    } catch (e) { console.error(e); alert("Error al guardar."); }
  };

  const handleRegistrarPago = async (montoPago: string) => {
    const monto = Number(montoPago);
    if (isNaN(monto) || monto <= 0) return alert("Ingresa un monto válido.");
    setProcesandoAccion(true);
    try {
      const nuevoPagado = (obraSeleccionada!.monto_pagado || 0) + monto;
      await obrasService.actualizar(obraSeleccionada!.id!, { monto_pagado: nuevoPagado });
      setShowPagoModal(false);
      await cargarDatos();
      alert("✅ Abono registrado.");
    } catch (e) { alert("Error al registrar el pago."); } finally { setProcesandoAccion(false); }
  };

  const handleIngresoMaterial = async (form: any, prodSelect: any) => {
    setProcesandoAccion(true);
    try {
      const nuevoStock = prodSelect.stock_actual - form.cantidad;
      await inventarioService.actualizar(prodSelect.id, { stock_actual: nuevoStock });
      const trabajador = usuarios.find(u => u.id === Number(form.trabajador_id));
      const costoTotalMaterial = (prodSelect.precio || 0) * form.cantidad;
      
      const nuevoItem = {
         id: Date.now(), codigo: prodSelect.codigo, producto: prodSelect.producto,
         unidad: prodSelect.unidad_medida || 'UND', cantidad: form.cantidad,
         precioUnit: prodSelect.precio || 0, total: costoTotalMaterial,
         trabajador_nombre: trabajador?.full_name || 'Desconocido',
         fecha_retiro: new Date().toISOString()
      };

      const materiales = [...(obraSeleccionada?.materiales_asignados || []), nuevoItem];
      const nuevoCosto = (obraSeleccionada?.costo_acumulado || 0) + costoTotalMaterial;

      await obrasService.actualizar(obraSeleccionada!.id!, { materiales_asignados: materiales, costo_acumulado: nuevoCosto });
      setShowIngresarModal(false);
      await cargarDatos();
      alert("✅ Operación de material registrada correctamente.");
    } catch (e) { alert("Error al procesar."); } finally { setProcesandoAccion(false); }
  };

  const obrasFiltradas = obras.filter(o => o.nombre_obra.toLowerCase().includes(busqueda.toLowerCase()) || o.codigo_obra.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="w-full animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <Building2 className="text-[#00B4D8]" size={28} /> Control de Obras
           </h2>
           <p className={`text-[13px] mt-1 font-bold uppercase tracking-wide ${accionDirecta ? 'text-[#00B4D8] animate-pulse' : 'text-slate-500'}`}>
             {accionDirecta ? `Acción Pendiente: Seleccione una Obra para ${accionDirecta.toUpperCase()}` : "Proyectos y Gestión de Almacén"}
           </p>
        </div>
        <button onClick={() => { setObraSeleccionada(null); setShowModalObra(true); }} className="bg-[#00B4D8] hover:bg-[#0096b4] text-white rounded-xl px-6 py-3.5 shadow-md font-black text-[13px] uppercase tracking-wider flex items-center gap-2 transition-all">
          <Plus size={18} /> Registrar Nueva Obra
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="flex justify-between items-center p-5 border-b border-slate-200">
           <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input placeholder="Buscar obra..." className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl pl-11 pr-4 text-[13px] font-medium outline-none focus:border-[#00B4D8] transition-all" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
           </div>
        </div>
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-[13px] text-center">
            <thead>
              <tr className="bg-slate-100 text-slate-500">
                <th className="py-4 px-4 text-left font-black uppercase tracking-widest text-[11px]">ID / Cliente</th>
                <th className="py-4 font-black uppercase tracking-widest text-[11px]">Inversión</th>
                <th className="py-4 font-black uppercase tracking-widest text-[11px]">Acciones de Flujo</th>
                <th className="py-4 font-black uppercase tracking-widest text-[11px]">Gestión</th>
              </tr>
            </thead>
            <tbody>
              {loading ? ( <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#00B4D8]" size={32}/></td></tr> ) : 
               obrasFiltradas.map((o) => (
                  <tr key={o.id} className={`hover:bg-slate-50 transition-colors border-b border-slate-100 ${accionDirecta ? 'bg-[#00B4D8]/5' : ''}`}>
                    <td className="py-5 px-4 text-left">
                       <div className="text-[15px] text-[#00B4D8] font-mono font-black">{o.codigo_obra}</div>
                       <div className="text-[12px] text-slate-600 font-bold uppercase mt-1">{o.cliente_nombre}</div>
                    </td>
                    <td className="py-5 px-4 text-center font-black text-slate-800 text-[16px]">S/ {o.costo_acumulado?.toFixed(2) || '0.00'}</td>
                    <td className="py-5 px-4 text-center">
                       <div className="flex justify-center gap-2">
                         <button 
                           onClick={() => { setObraSeleccionada(o); setShowIngresarModal(true); }} 
                           className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${accionDirecta === 'salida' ? 'bg-[#00B4D8] text-white animate-pulse shadow-lg' : 'bg-[#E0F7FA] text-[#00B4D8] hover:bg-[#00B4D8] hover:text-white'}`}
                         >
                            <PackagePlus size={14}/> Salida
                         </button>
                         <button 
                           onClick={() => { setObraSeleccionada(o); setShowModalObra(true); }} 
                           className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${accionDirecta === 'devolucion' ? 'bg-emerald-500 text-white animate-pulse shadow-lg' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}
                         >
                            <RefreshCcw size={14}/> Devolución
                         </button>
                       </div>
                    </td>
                    <td className="py-5 px-4 text-center">
                       <div className="flex justify-center gap-2">
                         <button onClick={() => { setObraSeleccionada(o); setShowModalObra(true); }} className="p-2 text-slate-400 hover:text-[#00B4D8] transition-colors"><Edit2 size={16}/></button>
                         <button onClick={() => eliminarObra(o.id!)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                       </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModalObra && <ObrasModal obraSeleccionada={obraSeleccionada} clientes={clientes} usuarios={usuarios} proximoIdObra={obraSeleccionada ? obraSeleccionada.codigo_obra : `OBRA-${String(obras.length + 1).padStart(4, '0')}`} onClose={() => setShowModalObra(false)} onSave={handleSaveObra} />}
      {showIngresarModal && <IngresarMaterialModal obraSeleccionada={obraSeleccionada} usuarios={usuarios} inventario={inventario} onClose={() => setShowIngresarModal(false)} onConfirm={handleIngresoMaterial} procesando={procesandoAccion} />}
      {showEquipoModal && <SupervisarEquipoModal obraSeleccionada={obraSeleccionada} usuarios={usuarios} onClose={() => setShowEquipoModal(false)} />}
      {showPagoModal && <AbonarObraModal obraSeleccionada={obraSeleccionada} onClose={() => setShowPagoModal(false)} onConfirm={handleRegistrarPago} procesando={procesandoAccion} />}
    </div>
  );
};