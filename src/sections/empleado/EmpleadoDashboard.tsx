// src/sections/empleado/EmpleadoDashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obrasService, inventarioService } from '../../services/supabase';
import { LogOut, HardHat, Building2, Package, MapPin, Loader2, AlertTriangle, FileText, Plus, Minus, Trash2, Search, X, Check } from 'lucide-react';

export const EmpleadoDashboard = () => {
  const navigate = useNavigate();
  const [obraAsignada, setObraAsignada] = useState<any>(null);
  const [inventario, setInventario] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);

  // Estados del Modal de Ingreso
  const [showModal, setShowModal] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
  const [cantidadIngreso, setCantidadIngreso] = useState<number | string>(1);

  const cargarDatos = async (userData: any) => {
    try {
      const [obras, inv] = await Promise.all([
        obrasService.listar(),
        inventarioService.listar()
      ]);

      setInventario(inv || []);

      const miObra = obras.find(o => 
        o.estado === 'En proceso' && 
        o.trabajadores_asignados?.some((t: any) => t.nombre.toLowerCase().includes(userData.nombre.toLowerCase()))
      );
      setObraAsignada(miObra || null);
    } catch (error) {
      console.error("Error cargando la base de datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = localStorage.getItem('userSession');
    if (!session) {
      navigate('/');
      return;
    }
    const userData = JSON.parse(session);
    setUsuario(userData);
    cargarDatos(userData);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    navigate('/');
  };

  // --- LÓGICA DE INGRESO DE MATERIAL ---
  const handleAgregarMaterial = async () => {
    const cantidadFinal = Number(cantidadIngreso);
    if (!productoSeleccionado || cantidadFinal <= 0) return;
    if (cantidadFinal > productoSeleccionado.stock_actual) {
      alert(`⚠️ Stock insuficiente en Almacén Central. Disponible: ${productoSeleccionado.stock_actual}`);
      return;
    }

    setProcesando(true);
    try {
      const nuevoStock = productoSeleccionado.stock_actual - cantidadFinal;
      await inventarioService.actualizar(productoSeleccionado.id, { stock_actual: nuevoStock });

      const nuevoItem = {
        id: Date.now() + Math.random(),
        codigo: productoSeleccionado.codigo,
        producto: productoSeleccionado.producto,
        unidad: productoSeleccionado.unidad_medida || 'UND',
        cantidad: cantidadFinal,
        fecha_retiro: new Date().toISOString(),
        trabajador_nombre: usuario.nombre 
      };

      const materialesActualizados = [...(obraAsignada.materiales_asignados || []), nuevoItem];

      const nuevoRegistro = {
        fecha: new Date().toISOString(),
        personal: usuario.nombre,
        materiales: [{ nombre: productoSeleccionado.producto, cantidad: cantidadFinal }]
      };
      const historialPrevio = obraAsignada.historial_movimientos || [];

      await obrasService.actualizar(obraAsignada.id, { 
        materiales_asignados: materialesActualizados,
        historial_movimientos: [...historialPrevio, nuevoRegistro]
      });

      setShowModal(false);
      setProductoSeleccionado(null);
      setCantidadIngreso(1);
      setBusqueda('');
      await cargarDatos(usuario);
    } catch (error) {
      console.error(error);
      alert("Error de red al procesar el ingreso.");
    } finally {
      setProcesando(false);
    }
  };

  // --- LÓGICA DE MODIFICACIÓN Y ELIMINACIÓN ---
  const handleAjustarCantidad = async (mat: any, delta: number) => {
    if (mat.trabajador_nombre !== usuario?.nombre) return;

    const prodDB = inventario.find(p => p.codigo === mat.codigo);
    if (!prodDB) return alert("Error: El producto ya no existe en la base de datos central.");

    if (delta > 0 && prodDB.stock_actual < delta) {
      return alert(`⚠️ Stock insuficiente en Almacén. Solo hay ${prodDB.stock_actual} unidades disponibles.`);
    }

    if (delta < 0 && mat.cantidad + delta <= 0) {
      handleEliminarMaterial(mat);
      return;
    }

    setProcesando(true);
    try {
      const nuevoStock = prodDB.stock_actual - delta;
      await inventarioService.actualizar(prodDB.id, { stock_actual: nuevoStock });

      const materialesActualizados = obraAsignada.materiales_asignados.map((m: any) => {
        if (m.id === mat.id) return { ...m, cantidad: m.cantidad + delta };
        return m;
      });

      await obrasService.actualizar(obraAsignada.id, { materiales_asignados: materialesActualizados });
      await cargarDatos(usuario);
    } catch (e) {
      console.error(e);
      alert("Error al ajustar la cantidad.");
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminarMaterial = async (mat: any) => {
    if (mat.trabajador_nombre !== usuario?.nombre) return;
    if (!window.confirm(`¿Devolver todo el "${mat.producto}" al Almacén Central?`)) return;

    setProcesando(true);
    try {
      const prodDB = inventario.find(p => p.codigo === mat.codigo);
      if (prodDB) {
        await inventarioService.actualizar(prodDB.id, { stock_actual: prodDB.stock_actual + mat.cantidad });
      }

      const materialesActualizados = obraAsignada.materiales_asignados.filter((m: any) => m.id !== mat.id);
      
      await obrasService.actualizar(obraAsignada.id, { materiales_asignados: materialesActualizados });
      await cargarDatos(usuario);
    } catch (e) {
      console.error(e);
      alert("Error al retirar el material.");
    } finally {
      setProcesando(false);
    }
  };

  // Muestra absolutamente todos los resultados que coincidan
  const inventarioFiltrado = inventario.filter(p => 
    p.producto.toLowerCase().includes(busqueda.toLowerCase()) || 
    p.codigo.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 size={40} className="text-[#00B4D8] animate-spin mb-4" />
        <p className="text-[12px] font-black text-[#1E293B] uppercase tracking-[0.3em]">Cargando Entorno Operativo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-[#00B4D8] selection:text-white pb-20">
      
      <header className="bg-[#1E293B] border-b-4 border-[#00B4D8] px-8 py-5 flex justify-between items-center shrink-0 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-[#00B4D8] p-3 shadow-none">
            <HardHat size={24} className="text-[#1E293B]" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter italic">Portal Operativo</h1>
            <p className="text-[10px] text-[#00B4D8] font-bold uppercase tracking-[0.3em] mt-1">Operador: {usuario?.nombre}</p>
          </div>
        </div>
        
        <button onClick={handleLogout} className="flex items-center gap-2 bg-transparent border border-white/20 hover:bg-red-500 hover:border-red-500 text-slate-300 hover:text-white px-5 py-3 transition-all text-[10px] font-black uppercase tracking-widest rounded-none">
          <LogOut size={16} className="hidden md:block"/> Salir
        </button>
      </header>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-6xl mx-auto w-full">
        {!obraAsignada ? (
          <div className="bg-white border border-slate-200 p-12 flex flex-col items-center text-center shadow-none mt-10">
            <AlertTriangle size={64} className="text-orange-500 mb-6" />
            <h2 className="text-2xl font-black text-[#1E293B] uppercase tracking-tighter mb-2">Sin Asignación Activa</h2>
            <p className="text-[12px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed max-w-md">
              Actualmente no te encuentras vinculado a ninguna obra en ejecución. Por favor, comunícate con la administración central.
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            <div className="flex items-center gap-3 mb-8 border-l-[12px] border-[#00B4D8] pl-4">
              <h2 className="text-3xl font-black text-[#1E293B] uppercase tracking-tighter italic">Tu Proyecto Asignado</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-slate-200 bg-white">
              <div className="p-8 border-r border-slate-200 bg-slate-50 flex flex-col justify-center">
                <Building2 size={32} className="text-[#00B4D8] mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Código de Proyecto</p>
                <p className="text-2xl font-black text-[#1E293B] font-mono">{obraAsignada.codigo_obra}</p>
              </div>
              <div className="p-8 md:col-span-2 flex flex-col justify-center">
                <p className="text-[10px] font-black text-[#00B4D8] uppercase tracking-widest mb-1">Nombre Comercial</p>
                <p className="text-lg font-black text-[#1E293B] uppercase mb-4 leading-tight">{obraAsignada.nombre_obra}</p>
                <div className="flex items-start gap-2 text-slate-500 bg-slate-50 p-4 border border-slate-200">
                  <MapPin size={16} className="shrink-0 mt-0.5 text-[#1E293B]" />
                  <p className="text-[12px] font-bold uppercase">{obraAsignada.clientes?.direccion || 'Ubicación no especificada en el sistema'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 mt-8">
              <div className="p-6 border-b border-slate-200 bg-[#fbfcfd] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Package size={20} className="text-[#00B4D8]" />
                  <div>
                    <h3 className="text-[14px] font-black text-[#1E293B] uppercase tracking-widest">Inventario en Campo</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Solo puedes editar los insumos que tú hayas ingresado.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(true)}
                  disabled={procesando}
                  className="w-full md:w-auto bg-[#1E293B] text-white px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-[#00B4D8] transition-all rounded-none flex items-center justify-center gap-2"
                >
                  <Plus size={16}/> Solicitar Insumo a Almacén
                </button>
              </div>
              
              <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b-2 border-slate-200">
                    <tr>
                      <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[#1E293B]">Material / Descripción</th>
                      <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-center text-[#1E293B] border-l border-slate-200 w-32">Cant. Actual</th>
                      <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-center text-[#1E293B] border-l border-slate-200 w-48">Gestión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(obraAsignada.materiales_asignados || []).length > 0 ? (
                      obraAsignada.materiales_asignados.map((mat: any, idx: number) => {
                        const esMio = mat.trabajador_nombre === usuario?.nombre;

                        return (
                          <tr key={idx} className={`hover:bg-slate-50 transition-colors ${esMio ? 'bg-white' : 'bg-slate-50/50'}`}>
                            <td className="py-5 px-6">
                              <p className="text-[12px] font-black text-[#1E293B] uppercase">{mat.producto || mat.nombre}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-mono text-[#00B4D8] font-black">{mat.codigo}</span>
                                {!esMio && (
                                  <span className="text-[8px] bg-slate-200 text-slate-600 px-1.5 py-0.5 font-bold uppercase tracking-widest">
                                    Por: {mat.trabajador_nombre}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-5 px-6 text-center border-l border-slate-100">
                              <span className="text-xl font-black text-[#1E293B] font-mono">{mat.cantidad}</span>
                            </td>
                            <td className="py-5 px-6 border-l border-slate-100 align-middle">
                              {esMio ? (
                                <div className="flex justify-center items-center gap-2">
                                  <button onClick={() => handleAjustarCantidad(mat, -1)} disabled={procesando} className="p-2 bg-white border border-slate-200 text-[#1E293B] hover:bg-slate-100 transition-colors rounded-none disabled:opacity-50">
                                    <Minus size={14}/>
                                  </button>
                                  <button onClick={() => handleAjustarCantidad(mat, 1)} disabled={procesando} className="p-2 bg-white border border-slate-200 text-[#1E293B] hover:bg-slate-100 transition-colors rounded-none disabled:opacity-50">
                                    <Plus size={14}/>
                                  </button>
                                  <button onClick={() => handleEliminarMaterial(mat)} disabled={procesando} className="p-2 ml-2 bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-colors rounded-none disabled:opacity-50">
                                    <Trash2 size={14}/>
                                  </button>
                                </div>
                              ) : (
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center italic">Solo Lectura</p>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-24 text-center">
                          <FileText size={40} className="mx-auto text-slate-200 mb-3" />
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1E293B]">Sin materiales solicitados</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Haz clic en "Solicitar Insumo" para empezar.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* MODAL: BUSCADOR LOGÍSTICO COMPLETO Y CORREGIDO */}
      {showModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#1E293B]/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-none shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden border-t-8 border-[#00B4D8] animate-in zoom-in-95 h-[85vh]">
            
            <div className="px-8 py-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-black text-[#1E293B] uppercase tracking-tighter italic">Buscador Logístico</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Consulta de Stock en Almacén Central</p>
              </div>
              <button onClick={() => { setShowModal(false); setProductoSeleccionado(null); }} className="text-slate-400 hover:text-red-500 transition-colors">
                <X size={24}/>
              </button>
            </div>

            <div className="p-6 bg-white border-b border-slate-200 shrink-0">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00B4D8]" size={20} />
                <input 
                  type="text" 
                  placeholder="ESCRIBE EL CÓDIGO O NOMBRE DEL MATERIAL..." 
                  className="w-full bg-slate-50 border border-slate-200 py-4 pl-12 pr-4 text-[12px] font-black uppercase tracking-widest outline-none focus:border-[#00B4D8] transition-all rounded-none placeholder:text-slate-400"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-3 custom-scrollbar">
              {inventarioFiltrado.length > 0 ? (
                inventarioFiltrado.map((prod) => {
                  const sinStock = prod.stock_actual <= 0;
                  const seleccionado = productoSeleccionado?.id === prod.id;

                  return (
                    <div 
                      key={prod.id} 
                      onClick={() => !sinStock && setProductoSeleccionado(prod)}
                      className={`p-4 border transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4
                        ${sinStock ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200' : 
                          seleccionado ? 'bg-[#1E293B] border-[#1E293B] text-white shadow-lg' : 'bg-white border-slate-200 hover:border-[#00B4D8] text-[#1E293B]'}`}
                    >
                      <div className="flex-1">
                        <p className={`text-[13px] font-black uppercase ${seleccionado ? 'text-white' : 'text-[#1E293B]'}`}>{prod.producto}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`text-[10px] font-mono font-black ${seleccionado ? 'text-[#00B4D8]' : 'text-slate-400'}`}>{prod.codigo}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-widest border px-1.5 ${seleccionado ? 'border-white/20 text-white/70' : 'border-slate-200 text-slate-400'}`}>{prod.categoria}</span>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                        <div>
                          <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${seleccionado ? 'text-[#00B4D8]' : 'text-slate-400'}`}>Stock Actual</p>
                          <p className={`text-xl font-mono font-black ${sinStock ? 'text-red-500' : seleccionado ? 'text-white' : 'text-[#00B4D8]'}`}>
                            {prod.stock_actual} <span className="text-[10px] font-sans">{prod.unidad_medida || 'UND'}</span>
                          </p>
                        </div>
                        {seleccionado && <Check size={24} className="text-[#00B4D8]" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 opacity-50">
                  <Package size={32} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#1E293B]">Material no encontrado</p>
                </div>
              )}
            </div>

            {/* BARRA DE ACCIÓN INFERIOR (CANTIDAD A RETIRAR) */}
            {productoSeleccionado && (
              <div className="p-6 bg-white border-t border-slate-200 flex flex-col md:flex-row gap-6 shrink-0 items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div>
                    <p className="text-[9px] font-black text-[#1E293B] uppercase tracking-widest mb-2">Cantidad a Retirar</p>
                    <div className="flex items-center border border-slate-200">
                      <button onClick={() => setCantidadIngreso(Math.max(1, Number(cantidadIngreso) - 1))} className="p-3 hover:bg-slate-100 text-[#1E293B] transition-colors"><Minus size={16}/></button>
                      
                      {/* INPUT MEJORADO */}
                      <input 
                        type="number" 
                        min="1" 
                        max={productoSeleccionado.stock_actual}
                        className="w-20 text-center font-mono text-xl font-black outline-none text-[#00B4D8] focus:bg-slate-50"
                        value={cantidadIngreso}
                        onFocus={(e) => e.target.select()} // Selecciona todo al hacer click
                        onChange={(e) => setCantidadIngreso(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                      
                      <button onClick={() => setCantidadIngreso(Number(cantidadIngreso) + 1)} className="p-3 hover:bg-slate-100 text-[#1E293B] transition-colors"><Plus size={16}/></button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleAgregarMaterial} 
                  disabled={procesando || Number(cantidadIngreso) <= 0 || Number(cantidadIngreso) > productoSeleccionado.stock_actual}
                  className="w-full md:w-auto bg-[#1E293B] hover:bg-[#00B4D8] text-white px-10 py-5 text-[11px] font-black uppercase tracking-widest transition-all rounded-none disabled:opacity-50 flex justify-center items-center gap-3 shadow-none"
                >
                  {procesando ? <Loader2 size={18} className="animate-spin"/> : <Check size={18}/>} Confirmar Retiro de Almacén
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 0px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #00B4D8; }
      `}</style>
    </div>
  );
};