// src/sections/obras/ObrasTab.tsx
import { useState, useEffect } from 'react';
import { Search, Building2, Loader2, CheckCircle2 } from 'lucide-react';
import { inventarioService, obrasService, usuariosService, clientesService, finanzasService } from '../../services/supabase'; 
import type { Obra, UsuarioSistema } from '../../services/supabase';
import { 
  IngresarMaterialModal, 
  VerMaterialesProyectoModal, 
  AbonarObraModal 
} from './ObrasModals';

interface ObraVista extends Obra {
  cliente_nombre?: string;
  monto_pagado?: number; 
  direccion_cliente?: string;
  ubicacion_link?: string;
  descripcion_trabajo?: string;
  nota?: string;
  tieneCotizacionAprobada?: boolean;
}

export const ObrasTab = () => {
  const [obras, setObras] = useState<ObraVista[]>([]);
  const [inventario, setInventario] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]); 
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  const [showIngresarModal, setShowIngresarModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false); 
  const [showVerMateriales, setShowVerMateriales] = useState(false);
  const [obraSeleccionada, setObraSeleccionada] = useState<ObraVista | null>(null);
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [dataInventario, dataObras, dataUsuarios, dataClientes, dataCotizaciones] = await Promise.all([
        inventarioService.listar(), 
        obrasService.listar(), 
        usuariosService.listar(),
        clientesService.listar(),
        finanzasService.listarCotizacionesTodas()
      ]);
      
      setInventario(dataInventario || []); 
      setUsuarios(dataUsuarios || []);
      
      // UBICACIÓN: src/sections/obras/ObrasTab.tsx -> función cargarDatos
// Cambia el .filter al final del mapeo (Línea 65 aprox.)

const obrasMapeadas = (dataObras || [])
  .map(o => {
    const clienteOriginal = dataClientes?.find(c => c.id === o.cliente_id);
    // Buscamos la cotización aprobada
    // 1. Buscamos la cotización aprobada específicamente para este proyecto
const cotizacionOriginal = dataCotizaciones?.find(cot => 
  cot.cliente_id === o.cliente_id && 
  cot.estado === 'Aprobado' &&
  // Si tienes el campo descripcion_trabajo o monto_total, úsalos para validar que es la correcta
  (o.nombre_obra.includes(cot.clientes?.nombre_cliente || ''))
);

return { 
  ...o, 
  cliente_nombre: clienteOriginal?.nombre_cliente || o.clientes?.nombre_cliente || 'Desconocido',
  direccion_cliente: clienteOriginal?.direccion || 'Sin dirección registrada',
  ubicacion_link: clienteOriginal?.ubicacion_link || '',
  descripcion_trabajo: cotizacionOriginal?.descripcion_trabajo || 'Sin descripción detallada.',
  nota: cotizacionOriginal?.nota || 'Sin notas adicionales.',
  fecha_inicio: cotizacionOriginal?.fecha_emision || o.fecha_inicio,
  // Esta marca es la que limpiará tu lista
  tieneCotizacionAprobada: !!cotizacionOriginal
};
  })
  // CAMBIA ESTA LÍNEA: Solo mostrar si tiene una cotización aprobada ACTIVA
  .filter(o => o.estado !== 'Finalizada' && o.tieneCotizacionAprobada === true); 

setObras(obrasMapeadas);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    cargarDatos(); 
  }, []);

  const handleFinalizarObra = async (id: number) => {
    if (!window.confirm("¿Confirmar cierre de obra? Esto enviará el proyecto a revisión final.")) return;
    setProcesandoAccion(true);
    try {
      await obrasService.finalizarObra(id);
      await cargarDatos();
      alert("✅ Obra oficializada. Pendiente de revisión en la bandeja de gestión.");
    } catch (e) {
      alert("Error al finalizar la obra.");
    } finally {
      setProcesandoAccion(false);
    }
  };

  // ❌ LA FUNCIÓN DE BORRAR FUE ELIMINADA. SOLO LECTURA.

  const handleIngresoMaterial = async (form: any, prodSelect: any) => {
    setProcesandoAccion(true);
    try {
      const nuevoStock = prodSelect.stock_actual - form.cantidad;
      await inventarioService.actualizar(prodSelect.id, { stock_actual: nuevoStock });
      const trabajador = usuarios.find(u => u.id === Number(form.trabajador_id));
      
      const nuevoItem = {
          id: Date.now(), 
          codigo: prodSelect.codigo, 
          producto: prodSelect.producto,
          unidad: prodSelect.unidad_medida || 'UND', 
          cantidad: form.cantidad,
          precioUnit: prodSelect.precio || 0, 
          total: (prodSelect.precio || 0) * form.cantidad,
          trabajador_nombre: trabajador?.full_name || 'Desconocido',
          fecha_retiro: new Date().toISOString()
      };

      const materiales = [...(obraSeleccionada?.materiales_asignados || []), nuevoItem];
      await obrasService.actualizar(obraSeleccionada!.id!, { materiales_asignados: materiales });
      
      setShowIngresarModal(false);
      await cargarDatos();
      alert("✅ Movimiento registrado en el núcleo de la obra.");
    } catch (e) { 
      alert("Error al procesar."); 
    } finally { 
      setProcesandoAccion(false); 
    }
  };

  const obrasFiltradas = obras.filter(o => 
    o.nombre_obra.toLowerCase().includes(busqueda.toLowerCase()) || 
    o.codigo_obra.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-6 border-l-8 border-[#1E293B] shadow-sm">
        <div className="flex items-center gap-4">
           <div className="bg-[#1E293B] p-3">
             <Building2 className="text-[#00B4D8]" size={24} />
           </div>
           <div>
             <h2 className="text-2xl font-black text-[#1E293B] uppercase tracking-tighter italic">Núcleo de Proyectos</h2>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
               Solo Lectura y Oficialización de Cierre
             </p>
           </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 overflow-hidden mb-6 shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/30">
           <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                placeholder="BUSCAR PROYECTO ACTIVO..." 
                className="w-full h-10 bg-white border border-slate-200 pl-10 pr-4 text-[12px] font-bold uppercase rounded-none outline-none focus:border-[#00B4D8] transition-all" 
                value={busqueda} 
                onChange={e => setBusqueda(e.target.value)} 
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-500 border-b border-slate-200">
                <th className="py-4 px-6 text-left font-black uppercase tracking-widest text-[9px]">Código / Cliente</th>
                <th className="py-4 font-black uppercase tracking-widest text-[9px]">Estado de Insumos</th>
                <th className="py-4 font-black uppercase tracking-widest text-[9px]">Comandos Rápidos</th>
                <th className="py-4 px-6 font-black uppercase tracking-widest text-[9px]">Oficializar</th>
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
                  <td className="py-5 font-black text-slate-300 text-[14px] font-mono italic">
                     --- 
                  </td>
                  <td className="py-5">
                     <div className="flex justify-center gap-2">
                       <button 
                         disabled={o.estado === 'Finalizada'}
                         onClick={() => { setObraSeleccionada(o); setShowIngresarModal(true); }} 
                         className="px-3 py-1.5 border border-[#1E293B] text-[#1E293B] text-[9px] font-black uppercase hover:bg-[#00B4D8] hover:border-[#00B4D8] hover:text-white transition-all disabled:opacity-30"
                       >
                         Salida / Traslado
                       </button>
                       <button 
                         onClick={() => { setObraSeleccionada(o); setShowVerMateriales(true); }} 
                         className="px-3 py-1.5 border border-slate-200 text-slate-400 text-[9px] font-black uppercase hover:border-[#1E293B] hover:text-[#1E293B] transition-all"
                       >
                         Ver Materiales
                       </button>
                     </div>
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex justify-center gap-4">
                      {o.estado !== 'Finalizada' ? (
                        <button 
                          onClick={() => handleFinalizarObra(o.id!)} 
                          className="bg-emerald-500 text-white px-4 py-1.5 text-[9px] font-black uppercase hover:bg-emerald-600 transition-all shadow-sm"
                        >
                          Terminar Obra
                        </button>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-blue-500 font-black text-[9px] uppercase italic flex items-center gap-1">
                            <CheckCircle2 size={12}/> Validando...
                          </span>
                        </div>
                      )}
                      {/* ❌ BOTÓN TRASH ELIMINADO PARA SIEMPRE */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showIngresarModal && (
        <IngresarMaterialModal 
          obraSeleccionada={obraSeleccionada} 
          usuarios={usuarios} 
          inventario={inventario} 
          onClose={() => setShowIngresarModal(false)} 
          onConfirm={handleIngresoMaterial} 
          procesando={procesandoAccion} 
        />
      )}

      {showVerMateriales && (
        <VerMaterialesProyectoModal 
          obraSeleccionada={obraSeleccionada} 
          onClose={() => setShowVerMateriales(false)} 
        />
      )}

      {showPagoModal && (
        <AbonarObraModal 
          obraSeleccionada={obraSeleccionada} 
          onClose={() => setShowPagoModal(false)} 
          onConfirm={() => {}} 
          procesando={procesandoAccion} 
        />
      )}
    </div>
  );
};