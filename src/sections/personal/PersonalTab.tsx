// src/sections/personal/PersonalTab.tsx
import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, X, Loader2, CheckSquare, Save, Shield, UserCog, HardHat } from 'lucide-react';
import { usuariosService } from '../../services/supabase';
import type { UsuarioSistema } from '../../services/supabase';

const MODULOS_SISTEMA = [
  { id: 'dashboard', nombre: 'Panel General', desc: 'Acceso a métricas e indicadores.' },
  { id: 'clientes', nombre: 'Cartera de Clientes', desc: 'Gestión de clientes y proyectos.' },
  { id: 'obras', nombre: 'Control de Obras', desc: 'Creación de proyectos y asignación.' },
  { id: 'almacen', nombre: 'Almacén e Inventario', desc: 'Control de stock de materiales.' },
];

export const PersonalTab = () => {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  // Usuario activo en la sesión
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [showModal, setShowModal] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioSistema | null>(null);

  const [formUsuario, setFormUsuario] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'trabajador' as 'admin' | 'supervisor' | 'trabajador',
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

  useEffect(() => { 
    const session = localStorage.getItem('userSession');
    if (session) {
      setCurrentUser(JSON.parse(session));
    }
    cargarUsuarios(); 
  }, []);

  const handleGuardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsuario.full_name || !formUsuario.email || !formUsuario.password) {
      return alert("El nombre, correo y contraseña son obligatorios.");
    }

    setProcesando(true);
    try {
      // Admins y Supervisores tienen acceso a todos los módulos por defecto
      const permisosFinales = (formUsuario.role === 'admin' || formUsuario.role === 'supervisor')
        ? ['dashboard', 'clientes', 'obras', 'almacen', 'personal'] 
        : formUsuario.permisos;

      // ELIMINAMOS EL CAMPO username DE ESTE PAYLOAD
      const payload = {
        full_name: formUsuario.full_name,
        email: formUsuario.email,
        password: formUsuario.password,
        role: formUsuario.role,
        permisos: permisosFinales
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
      alert("Error al guardar la cuenta. Verifica que el correo no esté duplicado.");
    } finally {
      setProcesando(false);
    }
  };

  const eliminarUsuario = async (id: number, role: string) => {
    if (role === 'admin') return alert("Restricción: No puedes eliminar a un Director Total.");
    if (currentUser?.role === 'supervisor' && role === 'supervisor') return alert("Restricción: No tienes jerarquía para eliminar a otro supervisor.");
    
    if (confirm('¿Revocar acceso permanentemente a este usuario?')) {
      try {
        await usuariosService.eliminar(id);
        await cargarUsuarios();
      } catch (error) {
        alert("Error al eliminar.");
      }
    }
  };

  const togglePermiso = (moduloId: string) => {
    if (formUsuario.role === 'admin' || formUsuario.role === 'supervisor') return; 
    setFormUsuario(prev => {
      const tienePermiso = prev.permisos?.includes(moduloId);
      const nuevosPermisos = tienePermiso 
        ? prev.permisos?.filter(p => p !== moduloId) 
        : [...(prev.permisos || []), moduloId];
      return { ...prev, permisos: nuevosPermisos };
    });
  };

  const abrirModal = (user: UsuarioSistema | null) => {
    // Protección anti-hackeo visual: un supervisor no puede editar a un admin
    if (user && currentUser?.role === 'supervisor' && user.role === 'admin') {
      return alert("Acceso denegado: Jerarquía insuficiente.");
    }

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

  // --- FILTROS DE VISIBILIDAD ---
  // Si el usuario actual es supervisor, filtramos los administradores de la tabla
  const usuariosVisibles = currentUser?.role === 'supervisor' 
    ? usuarios.filter(u => u.role !== 'admin')
    : usuarios;

  const filtrados = usuariosVisibles.filter(u => 
    u.full_name?.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // --- OPCIONES DE ROLES AL CREAR ---
  const ROLES_DISPONIBLES = currentUser?.role === 'admin' 
    ? [ 
        {id:'admin', label:'Director', icon: <Shield size={24}/>}, 
        {id:'supervisor', label:'Supervisor', icon: <UserCog size={24}/>}, 
        {id:'trabajador', label:'Trabajador', icon: <HardHat size={24}/>} 
      ]
    : [ 
        {id:'trabajador', label:'Trabajador', icon: <HardHat size={24}/>} 
      ];

  const inputModerno = "w-full h-12 bg-slate-50 border border-slate-200 rounded-none px-4 text-[13px] font-bold text-[#1E293B] outline-none focus:border-[#00B4D8] focus:bg-white transition-all shadow-none";
  const labelModerno = "block text-[10px] font-black text-[#1E293B] uppercase tracking-[0.2em] mb-2";

  return (
    <div className="w-full animate-in fade-in duration-500 bg-white">
      
      {/* HEADER TÉCNICO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 border-y border-r border-slate-200 border-l-[12px] border-l-[#1E293B] rounded-none shadow-sm">
        <div>
           <h2 className="text-3xl font-black text-[#1E293B] tracking-tighter uppercase italic flex items-center gap-3">
              <Shield className="text-[#00B4D8]" size={28} /> Control de Accesos
           </h2>
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1">Gestión Estructural de Credenciales</p>
        </div>
        <button onClick={() => abrirModal(null)} className="mt-4 md:mt-0 bg-[#1E293B] text-white px-8 py-4 font-black text-[10px] uppercase tracking-widest hover:bg-[#00B4D8] transition-all rounded-none shadow-none">
          + Alta de Personal
        </button>
      </div>

      {/* TABLA SQUARE */}
      <div className="bg-white border border-slate-200 rounded-none shadow-none overflow-hidden mb-12">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap justify-between items-center gap-4">
           <div className="text-[10px] text-[#1E293B] font-black uppercase tracking-widest">Directorio Operativo Activo</div>
           <div className="relative w-full md:w-96">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                placeholder="BUSCAR MATRÍCULA O CORREO..." 
                className="w-full h-12 bg-white border border-slate-200 rounded-none pl-11 pr-4 text-[11px] font-bold uppercase outline-none focus:border-[#00B4D8] transition-all" 
                value={busqueda} onChange={e => setBusqueda(e.target.value)} 
              />
           </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-white border-b-2 border-slate-200 text-[#1E293B]">
                <th className="py-4 px-8 text-left font-black uppercase tracking-widest text-[9px]">Perfil / Identidad</th>
                <th className="py-4 font-black uppercase tracking-widest text-[9px]">Credencial de Red</th>
                <th className="py-4 font-black uppercase tracking-widest text-[9px]">Jerarquía</th>
                <th className="py-4 px-8 font-black uppercase tracking-widest text-[9px] border-l border-slate-200">Operaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && usuarios.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#00B4D8]" size={32}/></td></tr>
              ) : filtrados.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors bg-white">
                  <td className="py-4 px-8 text-left">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-none shrink-0 flex items-center justify-center text-slate-400">
                          {u.role === 'admin' ? <Shield size={18}/> : u.role === 'supervisor' ? <UserCog size={18}/> : <HardHat size={18}/>}
                       </div>
                       <div>
                          <span className="font-black text-[#1E293B] text-[13px] uppercase block leading-none">{u.full_name}</span>
                          <span className="text-[9px] text-[#00B4D8] font-mono mt-1 block font-black">ID: {String(u.id).padStart(4, '0')}</span>
                       </div>
                    </div>
                  </td>
                  <td className="py-4 font-black font-mono text-[12px] text-slate-500">{u.email}</td>
                  <td className="py-4">
                    <span className={`inline-flex px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border rounded-none shadow-none ${
                      u.role === 'admin' ? 'border-[#1E293B] text-white bg-[#1E293B]' : 
                      u.role === 'supervisor' ? 'border-[#00B4D8] text-[#00B4D8] bg-[#f0f9ff]' : 
                      'border-slate-200 text-slate-500 bg-slate-50'
                    }`}>
                      {u.role === 'admin' ? 'Director Total' : u.role === 'supervisor' ? 'Supervisor' : 'Trabajador'}
                    </span>
                  </td>
                  <td className="py-4 px-8 text-center border-l border-slate-200">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => abrirModal(u)} 
                        className="p-2 bg-slate-50 border border-slate-200 text-slate-400 hover:text-white hover:bg-[#00B4D8] hover:border-[#00B4D8] transition-all rounded-none"
                      >
                        <Edit2 size={14}/>
                      </button>
                      <button 
                        onClick={() => eliminarUsuario(u.id!, u.role)} 
                        className={`p-2 bg-slate-50 border border-slate-200 transition-all rounded-none ${
                          u.role === 'admin' || (currentUser?.role === 'supervisor' && u.role === 'supervisor') 
                          ? 'text-slate-200 cursor-not-allowed opacity-50' 
                          : 'text-slate-400 hover:text-white hover:bg-red-500 hover:border-red-500'
                        }`} 
                        disabled={u.role === 'admin' || (currentUser?.role === 'supervisor' && u.role === 'supervisor')}
                      >
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && !loading && (
                <tr><td colSpan={4} className="py-24 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin registros disponibles</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SQUARE DE ALTO CONTRASTE */}
      {showModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#1E293B]/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white border-t-8 border-[#00B4D8] rounded-none shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="px-8 py-6 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-black text-[#1E293B] uppercase tracking-tighter italic">Configuración de Ficha Operativa</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Alta y modificación de credenciales</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleGuardarUsuario} className="flex-1 flex flex-col md:flex-row overflow-y-auto">
              <div className="w-full md:w-1/2 p-8 border-r border-slate-200 bg-white space-y-6">
                 <div>
                   <label className={labelModerno}>Nombre y Apellido</label>
                   <input required className={inputModerno} value={formUsuario.full_name} onChange={e => setFormUsuario({...formUsuario, full_name: e.target.value})} placeholder="EJ: JUAN PEREZ"/>
                 </div>
                 <div>
                   <label className={labelModerno}>Correo Electrónico de Red</label>
                   <input required type="email" className={`${inputModerno} font-mono text-[#00B4D8]`} value={formUsuario.email} onChange={e => setFormUsuario({...formUsuario, email: e.target.value})} placeholder="usuario@empresa.com"/>
                 </div>
                 <div>
                   <label className={labelModerno}>Clave de Seguridad</label>
                   <input required type="password" className={`${inputModerno} font-mono`} value={formUsuario.password} onChange={e => setFormUsuario({...formUsuario, password: e.target.value})} placeholder="••••••••" />
                 </div>
              </div>

              <div className="w-full md:w-1/2 p-8 bg-slate-50">
                 <label className={labelModerno}>Rango y Jerarquía</label>
                 <div className={`grid ${ROLES_DISPONIBLES.length === 1 ? 'grid-cols-1' : 'grid-cols-3'} gap-3 mb-8`}>
                    {ROLES_DISPONIBLES.map(r => (
                       <div 
                         key={r.id} 
                         onClick={() => setFormUsuario({...formUsuario, role: r.id as any})} 
                         className={`p-4 border-2 cursor-pointer text-center transition-all rounded-none flex flex-col items-center justify-center gap-2 ${
                           formUsuario.role === r.id 
                           ? 'border-[#00B4D8] bg-[#f0f9ff] text-[#00B4D8]' 
                           : 'border-slate-200 bg-white text-slate-400 hover:border-[#1E293B] hover:text-[#1E293B]'
                         }`}
                       >
                          <div>{r.icon}</div>
                          <p className="text-[9px] font-black uppercase tracking-widest">{r.label}</p>
                       </div>
                    ))}
                 </div>
                 
                 <label className={labelModerno}>Matriz de Accesos</label>
                 <div className="space-y-2">
                    {MODULOS_SISTEMA.map(m => {
                      const tieneAccesoFijo = formUsuario.role === 'admin' || formUsuario.role === 'supervisor';
                      const isChecked = tieneAccesoFijo || formUsuario.permisos?.includes(m.id);

                      return (
                        <div 
                          key={m.id} 
                          onClick={() => !tieneAccesoFijo && togglePermiso(m.id)}
                          className={`p-4 bg-white border flex items-center gap-4 rounded-none transition-all ${
                            tieneAccesoFijo ? 'border-[#00B4D8]/30 opacity-70 cursor-not-allowed' : 'border-slate-200 cursor-pointer hover:border-[#00B4D8]'
                          }`}
                        >
                          <CheckSquare size={18} className={isChecked ? 'text-[#00B4D8]' : 'text-slate-200'} />
                          <div>
                            <p className="text-[11px] font-black text-[#1E293B] uppercase leading-none">{m.nombre}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{m.desc}</p>
                          </div>
                        </div>
                      )
                    })}
                 </div>
              </div>
            </form>

            <div className="px-8 py-5 border-t border-slate-200 bg-white flex justify-end gap-4 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
              <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#1E293B] bg-transparent border border-transparent rounded-none transition-colors">Abortar</button>
              <button disabled={procesando} onClick={() => document.getElementById('btn-submit-personal')?.click()} className="bg-[#1E293B] text-white px-10 py-4 font-black text-[10px] uppercase tracking-widest hover:bg-[#00B4D8] transition-all rounded-none flex items-center justify-center gap-2 disabled:opacity-50">
                 {procesando ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} 
                 {usuarioSeleccionado ? 'Actualizar Ficha' : 'Autorizar Ingreso'}
              </button>
            </div>
          </div>
        </div>
      )}
      <button type="submit" id="btn-submit-personal" className="hidden" onClick={handleGuardarUsuario}></button>
    </div>
  );
};