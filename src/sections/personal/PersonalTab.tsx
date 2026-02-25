import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, X, Loader2, CheckSquare, Save, Shield } from 'lucide-react';
import { usuariosService } from '../../services/supabase';
import type { UsuarioSistema } from '../../services/supabase';

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
      alert("Error al guardar.");
    } finally {
      setProcesando(false);
    }
  };

  const eliminarUsuario = async (id: number, role: string) => {
    if (role === 'admin') return alert("Restricción: No puedes eliminar un administrador.");
    if (confirm('¿Revocar acceso permanentemente?')) {
      try {
        await usuariosService.eliminar(id);
        await cargarUsuarios();
      } catch (error) {
        alert("Error al eliminar.");
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

  const inputModerno = "w-full h-12 bg-white border border-slate-200 rounded-none px-4 text-[14px] font-bold text-slate-800 outline-none focus:border-[#00B4D8] transition-all shadow-sm";
  const labelModerno = "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2";

  return (
    <div className="w-full animate-in fade-in duration-500">
      
      {/* HEADER TÉCNICO */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 border border-slate-200 border-l-[12px] border-l-[#00B4D8] rounded-none shadow-sm">
        <div>
           <h2 className="text-3xl font-black text-[#1E293B] tracking-tighter uppercase italic flex items-center gap-3">
              <Shield className="text-[#00B4D8]" size={28} /> Control de Accesos
           </h2>
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Gestión de credenciales y permisos del personal</p>
        </div>
        <button onClick={() => abrirModal(null)} className="bg-[#1E293B] text-white px-8 py-4 font-black text-[12px] uppercase tracking-widest hover:bg-[#00B4D8] transition-all rounded-none shadow-[4px_4px_0px_#e2e8f0]">
          + Nuevo Empleado
        </button>
      </div>

      {/* TABLA SQUARE */}
      <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden mb-12">
        <div className="p-5 border-b border-slate-100 bg-[#f8fafc]/50 flex justify-between items-center">
           <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Directorio de Cuentas</div>
           <div className="relative w-80">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00B4D8]" />
              <input 
                placeholder="BUSCAR EMPLEADO..." 
                className="w-full h-10 bg-white border border-slate-200 rounded-none pl-11 pr-4 text-[12px] font-bold uppercase outline-none focus:border-[#00B4D8] transition-all" 
                value={busqueda} onChange={e => setBusqueda(e.target.value)} 
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-[#1E293B] text-white">
                <th className="py-5 px-8 text-left font-black uppercase tracking-widest text-[9px]">Perfil / Nombre</th>
                <th className="py-5 font-black uppercase tracking-widest text-[9px]">Credencial Email</th>
                <th className="py-5 font-black uppercase tracking-widest text-[9px]">Jerarquía</th>
                <th className="py-5 px-8 font-black uppercase tracking-widest text-[9px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && usuarios.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#00B4D8]" size={32}/></td></tr>
              ) : filtrados.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-5 px-8 text-left border-r border-slate-50">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white border border-slate-200 rounded-none p-1 shrink-0 flex items-center justify-center">
                          <img src={u.role === 'admin' ? '/admin.svg' : '/worker.svg'} alt="role" className="w-full h-full grayscale opacity-70" />
                       </div>
                       <div>
                          <span className="font-black text-[#1E293B] text-[13px] uppercase block leading-none">{u.full_name}</span>
                          <span className="text-[9px] text-slate-400 font-mono mt-1 block">ID: #{String(u.id).padStart(4, '0')}</span>
                       </div>
                    </div>
                  </td>
                  <td className="py-5 font-bold font-mono text-[12px] text-[#00B4D8]">{u.email}</td>
                  <td className="py-5">
                    <span className={`inline-flex px-3 py-1 text-[9px] font-black uppercase tracking-widest border ${u.role === 'admin' ? 'border-indigo-200 text-indigo-500 bg-indigo-50/50' : 'border-emerald-200 text-emerald-500 bg-emerald-50/50'}`}>
                      {u.role === 'admin' ? 'Director Total' : 'Trabajador'}
                    </span>
                  </td>
                  <td className="py-5 px-8 text-center">
                    <div className="flex justify-center gap-5">
                      <button onClick={() => abrirModal(u)} className="text-slate-300 hover:text-[#1E293B] transition-all"><Edit2 size={16}/></button>
                      <button onClick={() => eliminarUsuario(u.id!, u.role)} className={`transition-all ${u.role === 'admin' ? 'text-slate-100 cursor-not-allowed' : 'text-slate-200 hover:text-red-500'}`} disabled={u.role === 'admin'}><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SQUARE SUAVE */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1E293B]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-none shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="px-10 py-6 border-b border-slate-100 bg-[#f8fafc] flex justify-between items-center">
              <h3 className="text-xl font-black text-[#1E293B] uppercase tracking-tighter italic">Configuración de Accesos</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-300 hover:text-red-500"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleGuardarUsuario} className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="w-full md:w-[45%] p-10 border-r border-slate-100 bg-white overflow-y-auto space-y-8">
                 <div><label className={labelModerno}>Nombre Completo</label><input required className={inputModerno} value={formUsuario.full_name} onChange={e => setFormUsuario({...formUsuario, full_name: e.target.value})} /></div>
                 <div><label className={labelModerno}>Correo Institucional</label><input required type="email" className={`${inputModerno} font-mono text-[#00B4D8]`} value={formUsuario.email} onChange={e => setFormUsuario({...formUsuario, email: e.target.value})} /></div>
                 <div><label className={labelModerno}>Contraseña de Acceso</label><input required className={`${inputModerno} font-mono`} value={formUsuario.password} onChange={e => setFormUsuario({...formUsuario, password: e.target.value})} /></div>
              </div>

              <div className="w-full md:w-[55%] p-10 bg-slate-50/30 overflow-y-auto">
                 <label className={labelModerno}>Jerarquía Operativa</label>
                 <div className="grid grid-cols-2 gap-4 mb-8">
                    {[ {id:'admin', label:'Director', icon:'/admin.svg'}, {id:'trabajador', label:'Trabajador', icon:'/worker.svg'} ].map(r => (
                       <div key={r.id} onClick={() => setFormUsuario({...formUsuario, role: r.id as any})} className={`p-4 border-2 cursor-pointer text-center transition-all rounded-none ${formUsuario.role === r.id ? 'border-[#00B4D8] bg-white shadow-md' : 'border-slate-100 bg-[#f8fafc]/50 hover:border-slate-200'}`}>
                          <img src={r.icon} className="w-8 h-8 mx-auto mb-2 grayscale opacity-60" />
                          <p className="text-[11px] font-black uppercase tracking-widest">{r.label}</p>
                       </div>
                    ))}
                 </div>
                 
                 <label className={labelModerno}>Módulos Autorizados</label>
                 <div className="space-y-3">
                    {MODULOS_SISTEMA.map(m => (
                       <div 
                         key={m.id} 
                         onClick={() => togglePermiso(m.id)} // <--- AQUÍ SE USA LA FUNCIÓN
                         className={`p-3 bg-white border border-slate-100 flex items-center gap-4 rounded-none cursor-pointer transition-all hover:border-[#00B4D8]`}
                        >
                          <CheckSquare size={18} className={formUsuario.role === 'admin' || formUsuario.permisos?.includes(m.id) ? 'text-[#00B4D8]' : 'text-slate-100'} />
                          <div>
                             <p className="text-[12px] font-black text-[#1E293B] uppercase leading-none">{m.nombre}</p>
                             <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tight">{m.desc}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
            </form>

            <div className="px-10 py-5 border-t border-slate-100 bg-white flex justify-end gap-4 shrink-0">
              <button type="button" onClick={() => setShowModal(false)} className="px-8 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-[#1E293B]">Cancelar</button>
              <button disabled={procesando} onClick={() => document.getElementById('btn-submit-personal')?.click()} className="bg-[#1E293B] text-white px-10 py-4 font-black text-[11px] uppercase tracking-widest hover:bg-[#00B4D8] transition-all rounded-none shadow-[4px_4px_0px_#e2e8f0]">
                 {procesando ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} className="inline mr-2"/>} 
                 {usuarioSeleccionado ? 'Actualizar Cuenta' : 'Confirmar Ingreso'}
              </button>
            </div>
          </div>
        </div>
      )}
      <button type="submit" id="btn-submit-personal" className="hidden" onClick={handleGuardarUsuario}></button>
    </div>
  );
};