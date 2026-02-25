// src/sections/obras/ObrasTab.tsx
import { useState, useEffect } from 'react';
import { Search, Plus, Building2, Edit2, Trash2, Loader2, PackagePlus } from 'lucide-react';
import { clientesService, inventarioService, obrasService, usuariosService } from '../../services/supabase'; 
import type { Obra, UsuarioSistema } from '../../services/supabase';
import { ObrasModal, IngresarMaterialModal, SupervisarEquipoModal, AbonarObraModal } from './ObrasModals';

interface ObraVista extends Obra {
  cliente_nombre?: string;
  monto_pagado?: number; 
}

// FIX: Explicitly exporting ObrasTab as a named export
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
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-6 border border-slate-200 rounded-none shadow-sm">
        <div className="flex items-center gap-4">
           <div className="bg-[#1E293B] p-3 rounded-none">
             <Building2 className="text-[#00B4D8]" size={24} />
           </div>
           <div>
             <h2 className="text-2xl font-black text-[#1E293B] uppercase tracking-tighter italic">Proyectos</h2>
             <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${accionDirecta ? 'text-[#00B4D8] animate-pulse' : 'text-slate-400'}`}>
               {accionDirecta ? `Seleccionando para ${accionDirecta}` : "Gestión de Obra y Almacén"}
             </p>
           </div>
        </div>
        <button onClick={() => { setObraSeleccionada(null); setShowModalObra(true); }} className="bg-[#00B4D8] text-white px-6 py-3 font-black text-[11px] uppercase tracking-widest hover:bg-[#1E293B] transition-all rounded-none mt-4 md:mt-0">
          + Nuevo Proyecto
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-none overflow-hidden mb-6 shadow-sm">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/30">
           <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input placeholder="FILTRAR PROYECTO..." className="w-full h-10 bg-white border border-slate-200 pl-10 pr-4 text-[12px] font-bold uppercase rounded-none outline-none focus:border-[#00B4D8] transition-all" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-500 border-b border-slate-200">
                <th className="py-4 px-6 text-left font-black uppercase tracking-widest text-[9px]">Código / Cliente</th>
                <th className="py-4 font-black uppercase tracking-widest text-[9px]">Costo Acumulado</th>
                <th className="py-4 font-black uppercase tracking-widest text-[9px]">Flujo Material</th>
                <th className="py-4 px-6 font-black uppercase tracking-widest text-[9px]">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? ( 
                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#00B4D8]" size={32}/></td></tr> 
              ) : 
              obrasFiltradas.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-5 px-6 text-left">
                     <div className="text-[14px] text-[#00B4D8] font-mono font-black italic">{o.codigo_obra}</div>
                     <div className="text-[11px] text-[#1E293B] font-bold uppercase mt-0.5">{o.cliente_nombre}</div>
                  </td>
                  <td className="py-5 font-black text-[#1E293B] text-[16px] font-mono">S/ {o.costo_acumulado?.toFixed(2)}</td>
                  <td className="py-5">
                     <div className="flex justify-center gap-2">
                       <button onClick={() => { setObraSeleccionada(o); setShowIngresarModal(true); }} className="px-3 py-1.5 border border-[#1E293B] text-[#1E293B] text-[9px] font-black uppercase hover:bg-[#00B4D8] hover:border-[#00B4D8] hover:text-white transition-all rounded-none">Salida</button>
                       <button onClick={() => { setObraSeleccionada(o); setShowEquipoModal(true); }} className="px-3 py-1.5 border border-slate-200 text-slate-400 text-[9px] font-black uppercase hover:border-[#1E293B] hover:text-[#1E293B] transition-all rounded-none">Retorno</button>
                     </div>
                  </td>
                  <td className="py-5 px-6">
                     <div className="flex justify-center gap-4">
                       <button onClick={() => { setObraSeleccionada(o); setShowModalObra(true); }} className="text-slate-400 hover:text-[#00B4D8] transition-colors"><Edit2 size={16}/></button>
                       <button onClick={() => eliminarObra(o.id!)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModalObra && <ObrasModal obraSeleccionada={obraSeleccionada} clientes={clientes} proximoIdObra={obraSeleccionada ? obraSeleccionada.codigo_obra : `OBRA-${String(obras.length + 1).padStart(4, '0')}`} onClose={() => setShowModalObra(false)} onSave={handleSaveObra} />}
      {showIngresarModal && <IngresarMaterialModal obraSeleccionada={obraSeleccionada} usuarios={usuarios} inventario={inventario} onClose={() => setShowIngresarModal(false)} onConfirm={handleIngresoMaterial} procesando={procesandoAccion} />}
      {showEquipoModal && <SupervisarEquipoModal obraSeleccionada={obraSeleccionada} usuarios={usuarios} onClose={() => setShowEquipoModal(false)} />}
      {showPagoModal && <AbonarObraModal obraSeleccionada={obraSeleccionada} onClose={() => setShowPagoModal(false)} onConfirm={handleRegistrarPago} procesando={procesandoAccion} />}
    </div>
  );
};