import { useState } from 'react';
import { LogOut, Users, Warehouse, Menu, LayoutGrid, UserSquare2, Building2, LayoutDashboard, ArrowUpRight, ArrowDownRight, FileText, History, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PersonalTab } from './personal/PersonalTab';
import { AlmacenTab } from './almacen/AlmacenTab';
import { ObrasTab } from './obras/ObrasTab';
import { DashboardTab } from './dashboard/DashboardTab';
import { ClientesTab } from './clientes/ClientesTab'; 

// IMPORTACIONES DESDE LA CARPETA OBRAS
import { SalidaObra } from './obras/SalidaObra';
import { DevolucionesTab } from './obras/DevolucionesTab';

export const AdminDashboard = () => {
  const [tab, setTab] = useState<'dashboard' | 'personal' | 'clientes' | 'almacen' | 'obras' | 'salida_directa' | 'devolucion_directa'>('dashboard');
  const [subTabClientes, setSubTabClientes] = useState<'lista' | 'cotizaciones' | 'historial'>('lista');
  const [isExpanded, setIsExpanded] = useState(true); 
  const navigate = useNavigate();

  const irASeccionCliente = (sub: 'lista' | 'cotizaciones' | 'historial') => {
    setTab('clientes');
    setSubTabClientes(sub);
  };

  const SidebarItem = ({ id, label, icon, active, onClick }: { id: string, label: string, icon: any, active: boolean, onClick?: () => void }) => (
    <button
      onClick={onClick || (() => setTab(id as any))}
      className={`group w-full flex items-center justify-between px-4 py-3.5 border-l-4 transition-all
        ${active 
          ? 'bg-slate-900 border-[#00B4D8] text-white font-medium shadow-md shadow-black/20' 
          : 'border-transparent text-slate-400 hover:bg-slate-700/50 hover:text-white'
        }
        ${!isExpanded ? 'justify-center px-0 border-l-0' : ''}
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`${active ? 'text-[#00B4D8]' : 'text-slate-400 group-hover:text-slate-300 transition-colors'}`}>{icon}</div>
        {isExpanded && <span className="text-[14px]">{label}</span>}
      </div>
    </button>
  );

  return (
    <div className="flex h-screen bg-eco-bg font-sans text-eco-text-primary overflow-hidden">
      <aside className={`flex flex-col bg-slate-800 border-r border-slate-900 transition-all duration-300 relative z-20 shadow-2xl ${isExpanded ? 'w-64' : 'w-16'}`}>
        <div className="h-16 flex items-center px-5 shrink-0 border-b border-slate-700/50 bg-slate-900/80">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00B4D8] to-[#0096b4] flex items-center justify-center shrink-0 shadow-lg shadow-[#00B4D8]/30">
            <LayoutGrid className="text-white" size={16} />
          </div>
          {isExpanded && (
            <div className="ml-3 flex flex-col">
              <span className="font-bold text-white tracking-tight text-[16px] leading-tight">EcoSistemas</span>
              <span className="text-[9px] text-[#00B4D8] uppercase tracking-[0.2em] font-black mt-0.5">Gestión ERP</span>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto mt-4 px-2 custom-scrollbar">
          <SidebarItem id="dashboard" label="Panel General" icon={<LayoutDashboard size={18} />} active={tab === 'dashboard'} />
          
          {isExpanded && <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 mt-6">Clientes y Ventas</p>}
          <SidebarItem id="clientes" label="Directorio" icon={<UserSquare2 size={18} />} active={tab === 'clientes'} onClick={() => irASeccionCliente('lista')} />
          
          {isExpanded && <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 mt-6">Operaciones en Obra</p>}
          <SidebarItem id="salidas" label="Punto de Salida" icon={<ArrowUpRight size={18} className="text-rose-400" />} active={tab === 'salida_directa'} onClick={() => setTab('salida_directa')} />
          <SidebarItem id="devoluciones" label="Devoluciones" icon={<ArrowDownRight size={18} className="text-emerald-400" />} active={tab === 'devolucion_directa'} onClick={() => setTab('devolucion_directa')} />
          <SidebarItem id="obras" label="Control de Obras" icon={<Building2 size={18} />} active={tab === 'obras'} />
          
          {isExpanded && <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 mt-6">Logística</p>}
          <SidebarItem id="almacen" label="Almacén Central" icon={<Warehouse size={18} />} active={tab === 'almacen'} />
          <SidebarItem id="personal" label="Equipo de Trabajo" icon={<Users size={18} />} active={tab === 'personal'} />
        </nav>

        <div className="p-3 border-t border-slate-700/50">
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded-lg px-4 py-3 transition-colors text-[13px] font-bold">
            <LogOut size={18} />
            {isExpanded && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 px-6 flex items-center justify-between bg-white border-b border-eco-border shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsExpanded(!isExpanded)} className="text-slate-400 hover:text-[#00B4D8] p-2 rounded-lg hover:bg-[#e0f7fa] transition-colors"><Menu size={20} /></button>
            
            <div className="flex items-center gap-2 ml-4 bg-slate-50 p-1 rounded-xl border border-slate-100">
               {tab === 'clientes' && (
                 <>
                   <button onClick={() => irASeccionCliente('lista')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${subTabClientes === 'lista' ? 'bg-white text-[#00B4D8] shadow-sm' : 'text-slate-500 hover:text-[#00B4D8]'}`}>
                     <UserSquare2 size={14}/> Inicio
                   </button>
                   <button onClick={() => irASeccionCliente('cotizaciones')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${subTabClientes === 'cotizaciones' ? 'bg-white text-[#00B4D8] shadow-sm' : 'text-slate-500 hover:text-[#00B4D8]'}`}>
                     <FileText size={14}/> Presupuestos
                   </button>
                   <button onClick={() => irASeccionCliente('historial')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${subTabClientes === 'historial' ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-500 hover:text-amber-500'}`}>
                     <History size={14}/> Expedientes
                   </button>
                 </>
               )}

               {(tab === 'obras' || tab === 'salida_directa' || tab === 'devolucion_directa') && (
                 <>
                   <button onClick={() => setTab('obras')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${tab === 'obras' ? 'bg-white text-[#00B4D8] shadow-sm' : 'text-slate-500 hover:text-[#00B4D8]'}`}>
                     <Building2 size={14}/> Inicio Obra
                   </button>
                   <button onClick={() => setTab('salida_directa')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${tab === 'salida_directa' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500 hover:text-rose-500'}`}>
                     <ArrowUpRight size={14}/> Punto Salida
                   </button>
                   <button onClick={() => setTab('devolucion_directa')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${tab === 'devolucion_directa' ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-500 hover:text-emerald-500'}`}>
                     <ArrowDownRight size={14}/> Devolución
                   </button>
                 </>
               )}
            </div>
          </div>

          {/* ÁREA DE USUARIO Y CIERRE DE SESIÓN RÁPIDO */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Usuario Activo</span>
              <span className="text-xs font-bold text-slate-700 mt-1">EcoSistemas Pro</span>
            </div>
            
            <div className="h-8 w-px bg-slate-100 mx-1"></div>

            <button 
              onClick={() => navigate('/')}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              title="Cerrar Sesión"
            >
              <LogOut size={20} />
            </button>

            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00B4D8] to-[#90E0EF] border-2 border-white shadow-md flex items-center justify-center font-black text-white">
               A
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-eco-bg custom-scrollbar">
          <div className="w-full max-w-[1500px] mx-auto">
            {tab === 'dashboard' && <DashboardTab setTab={setTab} />}
            {tab === 'personal' && <PersonalTab />}
            {tab === 'clientes' && <ClientesTab subTab={subTabClientes} zoom={100} />}
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
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: #cbd5e1; 
          border-radius: 10px; 
          opacity: 0.4;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #00B4D8; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
      `}</style>
    </div>
  );
};