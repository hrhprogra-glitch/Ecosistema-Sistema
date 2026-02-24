import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Loader2, Mail, Key, CheckSquare, Square, Save, Shield } from 'lucide-react';
import { usuariosService, UsuarioSistema } from '../../services/supabase';

// Lista de módulos disponibles en el sistema para asignar permisos
const MODULOS_SISTEMA = [
  { id: 'dashboard', nombre: 'Panel General', desc: 'Acceso total a las métricas e indicadores financieros.' },
  { id: 'clientes', nombre: 'Cartera de Clientes', desc: 'Gestión de clientes, creación de cotizaciones y pagos.' },
  { id: 'obras', nombre: 'Control de Obras', desc: 'Creación de proyectos, geolocalización y asignación.' },
  { id: 'almacen', nombre: 'Almacén e Inventario', desc: 'Control de stock, ingresos y salidas de materiales.' },
];

export const PersonalTab = () => {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioSistema | null>(null);

  // Estado del formulario
  const [formUsuario, setFormUsuario] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'trabajador' as 'admin' | 'trabajador',
    permisos: ['obras', 'almacen']
  });

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const data = await usuariosService.listar();
      setUsuarios(data || []);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const handleGuardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsuario.full_name || !formUsuario.email || !formUsuario.password) {
      return alert("El nombre, correo y contraseña son obligatorios.");
    }

    setProcesando(true);
    try {
      const permisosFinales = formUsuario.role === 'admin' 
        ? ['dashboard', 'clientes', 'obras', 'almacen', 'personal'] 
        : formUsuario.permisos;

      const payload = {
        full_name: formUsuario.full_name,
        email: formUsuario.email,
        password: formUsuario.password,
        role: formUsuario.role,
        permisos: permisosFinales,
        username: formUsuario.email
      };

      if (usuarioSeleccionado) {
        await usuariosService.actualizar(usuarioSeleccionado.id!, payload);
      } else {
        await usuariosService.crear(payload);
      }
      
      setShowModal(false);
      await cargarUsuarios();
    } catch (error: any) {
      console.error(error);
      alert("Error al guardar. Verifica que el correo no esté registrado ya en el sistema.");
    } finally {
      setProcesando(false);
    }
  };

  const eliminarUsuario = async (id: number, role: string) => {
    if (role === 'admin') {
       return alert("Restricción de seguridad: No puedes eliminar a un Administrador Total.");
    }
    if (confirm('¿Estás seguro de revocar el acceso permanentemente a este empleado?')) {
      try {
        await usuariosService.eliminar(id);
        await cargarUsuarios();
      } catch (error) {
        alert("Ocurrió un error al intentar eliminar el usuario.");
      }
    }
  };

  const togglePermiso = (moduloId: string) => {
    if (formUsuario.role === 'admin') return; 
    
    setFormUsuario(prev => {
      const tienePermiso = prev.permisos?.includes(moduloId);
      const nuevosPermisos = tienePermiso 
        ? prev.permisos?.filter(p => p !== moduloId) 
        : [...(prev.permisos || []), moduloId];
      return { ...prev, permisos: nuevosPermisos };
    });
  };

  const abrirModal = (user: UsuarioSistema | null) => {
    setUsuarioSeleccionado(user);
    if (user) {
      setFormUsuario({
        full_name: user.full_name || '',
        email: user.email || '',
        password: user.password || '',
        role: user.role || 'trabajador',
        permisos: user.permisos || []
      });
    } else {
      setFormUsuario({ full_name: '', email: '', password: '', role: 'trabajador', permisos: ['obras', 'almacen'] });
    }
    setShowModal(true);
  };

  const filtrados = usuarios.filter(u => 
    u.full_name?.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Clases CSS corporativas
  const inputModerno = "w-full h-12 bg-slate-50 border border-slate-300 rounded-lg px-4 text-[14px] font-medium text-slate-800 outline-none focus:bg-white focus:border-[#00B4D8] focus:ring-4 focus:ring-[#00B4D8]/15 transition-all shadow-sm";
  const labelModerno = "block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2";

  return (
    <div className="w-full animate-in fade-in duration-300">
      
      {/* HEADER DE LA VISTA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <div className="flex items-center gap-3">
             <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestión de Accesos</h2>
             {loading && <Loader2 size={16} className="text-[#00B4D8] animate-spin" />}
           </div>
           <p className="text-[13px] text-slate-500 mt-1 font-medium">Administra el personal, credenciales y permisos modulares del sistema ERP.</p>
        </div>
        <button onClick={() => abrirModal(null)} className="clean-btn-primary rounded-md px-6 py-3 shadow-md font-bold text-[13px] uppercase tracking-wider">
          <Plus size={16} className="mr-1" /> Nuevo Empleado
        </button>
      </div>

      {/* TABLA CORPORATIVA DE USUARIOS */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="flex flex-wrap justify-between items-center p-4 border-b border-slate-200 bg-slate-50/50">
           <div className="text-[12px] text-slate-500 font-bold uppercase tracking-wider">
             Mostrando {filtrados.length} cuentas registradas
           </div>
           <div className="relative w-full md:w-80 mt-3 md:mt-0">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                placeholder="Buscar por nombre o correo..." 
                className="w-full h-10 bg-white border border-slate-300 rounded-md pl-9 pr-3 text-[13px] font-medium focus:ring-2 focus:ring-[#00B4D8] outline-none placeholder:text-slate-400 transition-all shadow-sm" 
                value={busqueda} onChange={e => setBusqueda(e.target.value)} 
              />
           </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-[13px] text-left">
            <thead>
              <tr>
                <th className="clean-table-header pl-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Perfil del Empleado</th>
                <th className="clean-table-header py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Credencial de Acceso</th>
                <th className="clean-table-header text-center py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Rol Asignado</th>
                <th className="clean-table-header text-center pr-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && usuarios.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="animate-pulse flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-slate-200 rounded-full mb-3"></div>
                      <div className="h-4 bg-slate-200 rounded w-48 mb-2"></div>
                    </div>
                  </td>
                </tr>
              ) : filtrados.length > 0 ? (
                filtrados.map((u) => (
                  <tr key={u.id} className="clean-table-row group hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
                    
                    {/* COLUMNA 1: PERFIL CON SVG */}
                    <td className="py-4 px-8">
                      <div className="flex items-center gap-4">
                         <div className="w-11 h-11 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border border-slate-200/60 shadow-sm p-2">
                            {/* AQUÍ SE USAN LOS SVGs DE LA CARPETA PUBLIC */}
                            <img 
                              src={u.role === 'admin' ? '/admin.svg' : '/worker.svg'} 
                              alt={u.role} 
                              className="w-full h-full object-contain drop-shadow-sm" 
                            />
                         </div>
                         <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-[14px] leading-tight">{u.full_name}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                               ID: #{String(u.id).padStart(4, '0')}
                            </span>
                         </div>
                      </div>
                    </td>
                    
                    {/* COLUMNA 2: CORREO */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                         <span className="text-[#0096b4] font-bold font-mono text-[13px]">{u.email}</span>
                         <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Login Email</span>
                      </div>
                    </td>
                    
                    {/* COLUMNA 3: ROL */}
                    <td className="py-4 px-4 text-center">
                      {u.role === 'admin' ? (
                         <span className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[10px] font-black uppercase tracking-widest shadow-sm">
                           Admin Total
                         </span>
                      ) : (
                         <span className="inline-flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-black uppercase tracking-widest shadow-sm">
                           Trabajador
                         </span>
                      )}
                    </td>
                    
                    {/* COLUMNA 4: ACCIONES (DISEÑO INVENTARIO) */}
                    <td className="py-4 px-8 text-center">
                      <div className="flex items-center justify-center gap-5 opacity-70 group-hover:opacity-100 transition-opacity">
                        
                        <button 
                          onClick={() => abrirModal(u)} 
                          className="flex flex-col items-center justify-center gap-1 group/edit p-1"
                        >
                          <Edit2 size={18} className="text-slate-400 group-hover/edit:text-[#00B4D8] transition-colors"/>
                          <span className="text-[10px] font-bold text-slate-500 group-hover/edit:text-[#00B4D8] transition-colors uppercase tracking-wider">Editar</span>
                        </button>
                        
                        <button 
                          onClick={() => eliminarUsuario(u.id!, u.role)} 
                          className={`flex flex-col items-center justify-center gap-1 group/delete p-1 ${u.role === 'admin' ? 'cursor-not-allowed opacity-50' : ''}`}
                          disabled={u.role === 'admin'}
                        >
                          <Trash2 size={18} className={`transition-colors ${u.role === 'admin' ? 'text-slate-300' : 'text-slate-400 group-hover/delete:text-red-500'}`}/>
                          <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${u.role === 'admin' ? 'text-slate-300' : 'text-slate-500 group-hover/delete:text-red-500'}`}>Borrar</span>
                        </button>

                      </div>
                    </td>
                    
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-24 text-center text-slate-500">
                    <img src="/admin.svg" alt="Empty" className="w-16 h-16 mx-auto mb-4 opacity-50 grayscale" />
                    <p className="text-[15px] font-bold text-slate-700 mb-1">Directorio vacío</p>
                    <p className="text-[13px] font-medium text-slate-400">Registra un nuevo empleado para conceder accesos.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================
          MODAL CREAR / EDITAR USUARIO 
      ========================================= */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 lg:p-8 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] max-h-[800px] flex flex-col overflow-hidden border border-slate-300 animate-in zoom-in-95">
            
            {/* HEADER MODAL */}
            <div className="px-10 py-6 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shadow-sm text-[#00B4D8]">
                    <Shield size={24} />
                 </div>
                 <div>
                   <h3 className="text-[20px] font-black text-slate-800 tracking-tight leading-tight">
                      {usuarioSeleccionado ? 'Configuración de Credenciales' : 'Alta de Nuevo Empleado'}
                   </h3>
                   <p className="text-[13px] text-slate-500 mt-1 font-medium">Asigna el nivel de acceso y los módulos permitidos en el sistema.</p>
                 </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"><X size={20}/></button>
            </div>
            
            {/* CUERPO DEL MODAL (PANTALLA DIVIDIDA) */}
            <form onSubmit={handleGuardarUsuario} className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
              
              {/* PANEL IZQUIERDO: DATOS PERSONALES */}
              <div className="w-full md:w-[45%] p-8 md:p-10 border-r border-slate-200 bg-white overflow-y-auto flex flex-col gap-8 custom-scrollbar">
                 
                 <div>
                   <label className={labelModerno}>Nombre Completo <span className="text-red-500">*</span></label>
                   <input 
                      required 
                      type="text" 
                      className={`${inputModerno} text-[15px]`} 
                      placeholder="Ej: Carlos Mendoza" 
                      value={formUsuario.full_name} 
                      onChange={e => setFormUsuario({...formUsuario, full_name: e.target.value})} 
                   />
                 </div>

                 <div className="pt-2">
                    <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-5 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Key size={16} className="text-[#00B4D8]"/> Parámetros de Seguridad
                    </h4>
                    
                    <div className="space-y-6">
                       <div>
                         <label className={labelModerno}>Correo Institucional / Login <span className="text-red-500">*</span></label>
                         <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                            <input required type="email" className={`${inputModerno} pl-12 font-mono text-[#0096b4] text-[15px]`} placeholder="empleado@empresa.com" value={formUsuario.email} onChange={e => setFormUsuario({...formUsuario, email: e.target.value})} />
                         </div>
                       </div>

                       <div>
                         <label className={labelModerno}>Contraseña de Acceso <span className="text-red-500">*</span></label>
                         <div className="relative">
                            <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                            <input required type="text" className={`${inputModerno} pl-12 font-mono text-[15px]`} placeholder="Asignar contraseña" value={formUsuario.password} onChange={e => setFormUsuario({...formUsuario, password: e.target.value})} />
                         </div>
                       </div>
                    </div>
                 </div>

              </div>

              {/* PANEL DERECHO: ROLES Y PERMISOS */}
              <div className="w-full md:w-[55%] p-8 md:p-10 bg-slate-50/80 flex flex-col overflow-y-auto custom-scrollbar">
                 
                 <label className={labelModerno}>Jerarquía Operativa</label>
                 <div className="grid grid-cols-2 gap-4 mb-8">
                    
                    {/* Tarjeta Admin */}
                    <div 
                      onClick={() => setFormUsuario({...formUsuario, role: 'admin'})}
                      className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center justify-center relative ${formUsuario.role === 'admin' ? 'border-indigo-500 bg-indigo-50/50 shadow-md' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
                    >
                       {formUsuario.role === 'admin' && <div className="absolute top-2 right-2"><CheckSquare size={18} className="text-indigo-600"/></div>}
                       <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm mb-3">
                          <img src="/admin.svg" alt="Admin" className="w-8 h-8 opacity-90" />
                       </div>
                       <h4 className={`font-black text-[14px] uppercase tracking-wide ${formUsuario.role === 'admin' ? 'text-indigo-800' : 'text-slate-700'}`}>Director Total</h4>
                       <p className="text-[11px] text-slate-500 mt-1 font-medium">Privilegios globales.</p>
                    </div>

                    {/* Tarjeta Trabajador */}
                    <div 
                      onClick={() => setFormUsuario({...formUsuario, role: 'trabajador'})}
                      className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center justify-center relative ${formUsuario.role === 'trabajador' ? 'border-emerald-500 bg-emerald-50/50 shadow-md' : 'border-slate-200 bg-white hover:border-emerald-300'}`}
                    >
                       {formUsuario.role === 'trabajador' && <div className="absolute top-2 right-2"><CheckSquare size={18} className="text-emerald-600"/></div>}
                       <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm mb-3">
                          <img src="/worker.svg" alt="Worker" className="w-8 h-8 opacity-90" />
                       </div>
                       <h4 className={`font-black text-[14px] uppercase tracking-wide ${formUsuario.role === 'trabajador' ? 'text-emerald-800' : 'text-slate-700'}`}>Trabajador</h4>
                       <p className="text-[11px] text-slate-500 mt-1 font-medium">Accesos restringidos.</p>
                    </div>

                 </div>

                 <h4 className={labelModerno}>Asignación de Módulos</h4>
                 <div className="flex-1 space-y-3">
                    {MODULOS_SISTEMA.map(mod => {
                       const activo = formUsuario.role === 'admin' || formUsuario.permisos?.includes(mod.id);
                       return (
                          <div 
                            key={mod.id} 
                            onClick={() => togglePermiso(mod.id)}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${formUsuario.role === 'admin' ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed' : 'bg-white border-slate-200 cursor-pointer hover:border-[#00B4D8]'}`}
                          >
                             <div className="shrink-0">
                               {activo ? <CheckSquare size={24} className="text-[#00B4D8]"/> : <Square size={24} className="text-slate-300"/>}
                             </div>
                             <div>
                                <p className={`text-[14px] font-bold ${activo ? 'text-slate-800' : 'text-slate-600'}`}>{mod.nombre}</p>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{mod.desc}</p>
                             </div>
                          </div>
                       );
                    })}
                 </div>

              </div>

              {/* Botón oculto para submit nativo */}
              <button type="submit" id="btn-submit-user" className="hidden"></button>
            </form>

            {/* FOOTER */}
            <div className="px-10 py-5 border-t border-slate-200 bg-white flex justify-end gap-4 shrink-0 z-10">
              <button type="button" onClick={() => setShowModal(false)} className="h-12 px-8 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-[13px] font-black uppercase tracking-wider transition-colors shadow-sm">
                 Cancelar
              </button>
              <button disabled={procesando} onClick={() => document.getElementById('btn-submit-user')?.click()} className="h-12 px-10 bg-[#00B4D8] hover:bg-[#0096b4] text-white rounded-lg text-[13px] font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-[#00B4D8]/20 transition-all disabled:opacity-70">
                 {procesando ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} 
                 {usuarioSeleccionado ? 'Guardar Cambios' : 'Aprobar Ingreso'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};