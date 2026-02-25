// src/sections/AdminDashboard.tsx
import { useState } from 'react';
import { 
  LogOut, Users, Warehouse, Menu, LayoutGrid, UserSquare2, 
  Building2, LayoutDashboard, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PersonalTab } from './personal/PersonalTab';
import { AlmacenTab } from './almacen/AlmacenTab';
import { ObrasTab } from './obras/ObrasTab';
import { DashboardTab } from './dashboard/DashboardTab';
import { ClientesTab } from './clientes/ClientesTab'; 
import { SalidaObra } from './obras/SalidaObra';
import { DevolucionesTab } from './obras/DevolucionesTab';

export const AdminDashboard = () => {
  const [tab, setTab] = useState<'dashboard' | 'personal' | 'clientes' | 'almacen' | 'obras' | 'salida_directa' | 'devolucion_directa'>('dashboard');
  const [subTabClientes, setSubTabClientes] = useState<'lista' | 'cotizaciones' | 'historial'>('lista');
  const [isExpanded, setIsExpanded] = useState(true); 
  const navigate = useNavigate();

  // Mapeo de títulos de sección
  const sectionTitles = {
    dashboard: 'Resumen General',
    personal: 'Gestión de Personal',
    clientes: 'Panel de Clientes',
    almacen: 'Inventario de Almacén',
    obras: 'Control de Proyectos',
    salida_directa: 'Registro de Salidas',
    devolucion_directa: 'Retorno de Equipos'
  };

  const irASeccionCliente = (sub: 'lista' | 'cotizaciones' | 'historial') => {
    setTab('clientes');
    setSubTabClientes(sub);
  };

  const SidebarItem = ({ id, label, icon, active, onClick }: { id: string, label: string, icon: any, active: boolean, onClick?: () => void }) => (
    <button
      onClick={onClick || (() => setTab(id as any))}
      className={`group w-full flex items-center gap-3 px-4 py-4 transition-all rounded-none border-r-4
        ${active 
          ? 'bg-white/10 border-[#00B4D8] text-white font-bold' 
          : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-[#00B4D8]'
        }
        ${!isExpanded ? 'justify-center px-0 border-r-0' : ''}
      `}
    >
      <div className={`${active ? 'text-[#00B4D8]' : 'text-slate-400 group-hover:text-[#00B4D8] transition-colors'}`}>
        {icon}
      </div>
      {isExpanded && <span className="text-[12px] uppercase tracking-wider font-bold">{label}</span>}
    </button>
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden">
      
      {/* SIDEBAR: NEGRO SUAVE + CELESTE */}
      <aside className={`flex flex-col bg-[#1e293b] transition-all duration-300 relative z-20 shadow-xl ${isExpanded ? 'w-64' : 'w-20'}`}>
        <div className="h-20 flex items-center px-6 shrink-0 border-b border-white/5">
          <div className="w-10 h-10 bg-[#00B4D8] flex items-center justify-center shrink-0 shadow-lg shadow-[#00B4D8]/20">
            <LayoutGrid className="text-[#1e293b]" size={20} />
          </div>
          {isExpanded && (
            <div className="ml-4 flex flex-col">
              <span className="font-black text-white tracking-tighter text-[17px] leading-tight uppercase italic">EcoSistemas</span>
              <span className="text-[9px] text-[#00B4D8] uppercase tracking-[0.2em] font-black">Admin Panel</span>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto mt-6 custom-scrollbar">
          <SidebarItem id="dashboard" label="Resumen" icon={<LayoutDashboard size={20} />} active={tab === 'dashboard'} />
          
          <div className="mt-8 mb-2">
            {isExpanded && <p className="px-6 text-[9px] font-black text-[#00B4D8] uppercase tracking-[0.2em] mb-2 opacity-70">Comercial</p>}
            <SidebarItem id="clientes" label="Clientes" icon={<UserSquare2 size={20} />} active={tab === 'clientes'} onClick={() => irASeccionCliente('lista')} />
          </div>

          <div className="mt-8 mb-2">
            {isExpanded && <p className="px-6 text-[9px] font-black text-[#00B4D8] uppercase tracking-[0.2em] mb-2 opacity-70">Operaciones</p>}
            <SidebarItem id="salidas" label="Salidas" icon={<ArrowUpRight size={20} />} active={tab === 'salida_directa'} onClick={() => setTab('salida_directa')} />
            <SidebarItem id="devoluciones" label="Retornos" icon={<ArrowDownRight size={20} />} active={tab === 'devolucion_directa'} onClick={() => setTab('devolucion_directa')} />
            <SidebarItem id="obras" label="Proyectos" icon={<Building2 size={20} />} active={tab === 'obras'} />
          </div>

          <div className="mt-8 mb-2">
            {isExpanded && <p className="px-6 text-[9px] font-black text-[#00B4D8] uppercase tracking-[0.2em] mb-2 opacity-70">Logística</p>}
            <SidebarItem id="almacen" label="Almacén" icon={<Warehouse size={20} />} active={tab === 'almacen'} />
            <SidebarItem id="personal" label="Personal" icon={<Users size={20} />} active={tab === 'personal'} />
          </div>
        </nav>

        <div className="p-4 bg-black/20 border-t border-white/5">
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 text-slate-400 hover:text-white px-4 py-3 transition-colors text-[11px] font-black uppercase tracking-widest group">
            <LogOut size={18} className="group-hover:text-red-400" />
            {isExpanded && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative">
        
        {/* TOPBAR: BLANCO + CELESTE (HIGH CONTRAST) */}
        <header className="h-20 px-8 flex items-center justify-between bg-white border-b-2 border-slate-100 shrink-0 z-10">
          <div className="flex items-center gap-8">
            <button onClick={() => setIsExpanded(!isExpanded)} className="text-[#1e293b] hover:text-[#00B4D8] p-2 transition-colors">
              <Menu size={24} />
            </button>
            
            <div className="flex items-center gap-6">
              {/* Título de Sección */}
              <div className="flex items-center gap-4 border-l-4 border-[#00B4D8] pl-5 h-10">
                <h2 className="text-[20px] font-black text-[#1e293b] uppercase tracking-tighter">
                  {sectionTitles[tab]}
                </h2>
              </div>

              {/* Selectores de Sub-Pestañas Restaurados */}
              <div className="flex items-center bg-slate-50 p-1 border border-slate-200 rounded-none ml-4">
                {tab === 'clientes' && (
                  <>
                    <button onClick={() => irASeccionCliente('lista')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${subTabClientes === 'lista' ? 'bg-[#00B4D8] text-white shadow-md' : 'text-slate-400 hover:text-[#00B4D8]'}`}>Inicio</button>
                    <button onClick={() => irASeccionCliente('cotizaciones')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${subTabClientes === 'cotizaciones' ? 'bg-[#00B4D8] text-white shadow-md' : 'text-slate-400 hover:text-[#00B4D8]'}`}>Cotizar</button>
                    <button onClick={() => irASeccionCliente('historial')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${subTabClientes === 'historial' ? 'bg-[#00B4D8] text-white shadow-md' : 'text-slate-400 hover:text-[#00B4D8]'}`}>Cuentas x Cobrar</button>
                  </>
                )}

                {(tab === 'obras' || tab === 'salida_directa' || tab === 'devolucion_directa') && (
                  <>
                    <button onClick={() => setTab('obras')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'obras' ? 'bg-[#00B4D8] text-white shadow-md' : 'text-slate-400 hover:text-[#00B4D8]'}`}>Obras</button>
                    <button onClick={() => setTab('salida_directa')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'salida_directa' ? 'bg-[#00B4D8] text-white shadow-md' : 'text-slate-400 hover:text-[#00B4D8]'}`}>Salidas</button>
                    <button onClick={() => setTab('devolucion_directa')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'devolucion_directa' ? 'bg-[#00B4D8] text-white shadow-md' : 'text-slate-400 hover:text-[#00B4D8]'}`}>Devolución</button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-black text-[#00B4D8] uppercase tracking-[0.2em] leading-none">Usuario Activo</span>
              <span className="text-xs font-black text-[#1e293b] mt-1 uppercase">SISTEMA PRO</span>
            </div>
            <div className="w-12 h-12 bg-[#1e293b] border-2 border-[#00B4D8] flex items-center justify-center font-black text-[#00B4D8] text-xl shadow-lg shadow-[#00B4D8]/10 select-none">
               AD
            </div>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#f8fafc] custom-scrollbar">
          <div className="w-full max-w-[1600px] mx-auto">
            {tab === 'dashboard' && <DashboardTab setTab={setTab} />}
            {tab === 'personal' && <PersonalTab />}
            {tab === 'clientes' && (
  <ClientesTab 
    subTab={subTabClientes} 
    zoom={100} 
    setSubTab={setSubTabClientes} // <--- AÑADIMOS ESTA PROP
  />
)}
            {tab === 'almacen' && <AlmacenTab zoom={100} subTab="inventario" />}
            {tab === 'obras' && <ObrasTab />}
            {tab === 'salida_directa' && <SalidaObra zoom={100} />}
            {tab === 'devolucion_directa' && <DevolucionesTab zoom={100} />}
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 0px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #00B4D8; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
      `}</style>
    </div>
  );
};