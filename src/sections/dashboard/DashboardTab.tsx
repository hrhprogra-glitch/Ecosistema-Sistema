// src/sections/dashboard/DashboardTab.tsx
import { useState, useEffect } from 'react';
import {  ArrowUpRight, ArrowDownRight, 
  MoreVertical, RotateCw
} from 'lucide-react';
import { 
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { clientesService, inventarioService } from '../../services/supabase';

// Solución al error de TypeScript: El tipo debe ser idéntico al del componente padre
interface DashboardTabProps {
  setTab: React.Dispatch<React.SetStateAction<"dashboard" | "personal" | "clientes" | "almacen" | "obras" | "salida_directa" | "devolucion_directa">>;
}

const COLORS = {
  aqua: '#00B4D8',
  emerald: '#10b981',
  orange: '#f97316',
  slate: '#64748b',
  purple: '#8b5cf6'
};

const dataFinancieraMock = [
  { mes: 'Sep', ingresos: 12500, costos: 8200 },
  { mes: 'Oct', ingresos: 15800, costos: 9500 },
  { mes: 'Nov', ingresos: 14200, costos: 8800 },
  { mes: 'Dic', ingresos: 18900, costos: 11200 },
  { mes: 'Ene', ingresos: 16500, costos: 10100 },
  { mes: 'Feb', ingresos: 21400, costos: 12500 },
];

export const DashboardTab = ({ setTab }: DashboardTabProps) => {
  const [stats, setStats] = useState({ totalClientes: 0, obrasActivas: 0, montoTotalObras: 0, itemsCriticos: 0 });
  const [obrasRecientes, setObrasRecientes] = useState<any[]>([]);
  const [estadoObrasData, setEstadoObrasData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [clientes, inventario] = await Promise.all([
           clientesService.listar().catch(() => []), 
           inventarioService.listar().catch(() => [])
        ]);

        const obrasMock = [
          { id: 1, nombre_obra: 'Proyecto San Isidro', estado: 'En Proceso', costo_acumulado: 15000, clientes: { nombre_cliente: 'Empresa A' } },
          { id: 2, nombre_obra: 'Mantenimiento Surco', estado: 'Planificación', costo_acumulado: 4500, clientes: { nombre_cliente: 'Cliente B' } },
          { id: 3, nombre_obra: 'Renovación Miraflores', estado: 'Completada', costo_acumulado: 8200, clientes: { nombre_cliente: 'Cliente C' } },
          { id: 4, nombre_obra: 'Instalación Tuberías', estado: 'En Proceso', costo_acumulado: 6100, clientes: { nombre_cliente: 'Empresa D' } }
        ];

        const activas = obrasMock.filter(o => o.estado !== 'Completada');
        const completadas = obrasMock.filter(o => o.estado === 'Completada');
        const enPlan = obrasMock.filter(o => o.estado === 'Planificación');
        
        const monto = obrasMock.reduce((sum, o) => sum + (Number(o.costo_acumulado) || 0), 0);
        const criticos = (inventario || []).filter((i: any) => i.stock_actual < 5);

        setStats({
          totalClientes: clientes?.length || 0,
          obrasActivas: activas.length,
          montoTotalObras: monto,
          itemsCriticos: criticos.length
        });

        setEstadoObrasData([
          { name: 'En Proceso', value: activas.length - enPlan.length, color: COLORS.aqua },
          { name: 'Planificación', value: enPlan.length, color: COLORS.orange },
          { name: 'Completadas', value: completadas.length, color: COLORS.emerald }
        ]);

        const obrasParaLista = activas.slice(0, 8).map(o => ({
           ...o,
           cliente_nombre: o.clientes?.nombre_cliente || 'Desconocido'
        }));
        
        setObrasRecientes(obrasParaLista);

      } catch (error) { 
        console.error("Error cargando dashboard:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    
    cargarDatos();
  }, []);

  if (loading) return (
    <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center">
       <div className="w-10 h-10 border-4 border-[#e0f7fa] border-t-[#00B4D8] rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="w-full h-full min-h-[800px] flex flex-col animate-in fade-in duration-500 pb-2">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-5 shrink-0 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
           <div className="w-3 h-6 bg-[#00B4D8] rounded-sm"></div> Dashboard
        </h2>
        <div className="flex items-center gap-4 text-[12px] text-slate-500 font-medium">
           <span>Última actualización: Hoy, 08:30 AM</span>
           <button className="flex items-center gap-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md shadow-sm transition-colors">
              <RotateCw size={14}/> Update
           </button>
        </div>
      </div>

      {/* FILA 1: KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 shrink-0 mb-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-2">
             <h3 className="text-[13px] font-bold text-slate-600">Inversión en Obras</h3>
             <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={16}/></button>
          </div>
          <div className="flex justify-between items-center mb-4">
             <span className="text-3xl font-black text-slate-800 tracking-tight">S/ {(stats.montoTotalObras/1000).toFixed(1)}k</span>
             <div className="flex flex-col items-end">
                <span className="flex items-center text-emerald-600 text-[11px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full"><ArrowUpRight size={12} className="mr-0.5"/> 12.5%</span>
             </div>
          </div>
          <div className="mt-auto pt-4 border-t border-slate-100">
             <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400"></div> Ritmo</span>
                <span className="text-slate-700">47.85% Logrado</span>
             </div>
             <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                <div className="bg-emerald-400 h-full" style={{ width: '47.85%' }}></div>
             </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-2">
             <h3 className="text-[13px] font-bold text-slate-600">Obras en Curso</h3>
             <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={16}/></button>
          </div>
          <div className="flex justify-between items-center mb-4">
             <span className="text-3xl font-black text-slate-800 tracking-tight">{stats.obrasActivas}</span>
             <div className="flex flex-col items-end">
                <span className="flex items-center text-orange-500 text-[11px] font-bold bg-orange-50 px-2 py-0.5 rounded-full"><ArrowDownRight size={12} className="mr-0.5"/> 2.4%</span>
             </div>
          </div>
          <div className="mt-auto pt-4 border-t border-slate-100">
             <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400"></div> Ritmo</span>
                <span className="text-slate-700">71.88% Logrado</span>
             </div>
             <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                <div className="bg-[#00B4D8] h-full" style={{ width: '71.88%' }}></div>
             </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-2">
             <h3 className="text-[13px] font-bold text-slate-600">Total Clientes</h3>
             <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={16}/></button>
          </div>
          <div className="flex justify-between items-center mb-4">
             <span className="text-3xl font-black text-slate-800 tracking-tight">{stats.totalClientes}</span>
             <div className="flex flex-col items-end">
                <span className="flex items-center text-emerald-600 text-[11px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full"><ArrowUpRight size={12} className="mr-0.5"/> 5.1%</span>
             </div>
          </div>
          <div className="mt-auto pt-4 border-t border-slate-100">
             <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400"></div> Ritmo</span>
                <span className="text-slate-700">80.00% Logrado</span>
             </div>
             <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                <div className="bg-indigo-500 h-full" style={{ width: '80%' }}></div>
             </div>
          </div>
        </div>
      </div>

      {/* FILA 2: GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-4 shrink-0">
             <h3 className="text-[14px] font-bold text-slate-800">Flujo Financiero</h3>
          </div>
          <div className="flex-1 w-full min-h-[250px]">
             <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={dataFinancieraMock} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                   <defs>
                      <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.3}/>
                         <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                   <Tooltip />
                   <Area type="monotone" dataKey="ingresos" stroke={COLORS.emerald} fill="url(#colorIngresos)" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-2 shrink-0">
             <h3 className="text-[14px] font-bold text-slate-800">Obras en Ejecución</h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 min-h-[250px]">
             <div className="flex flex-col gap-4">
               {obrasRecientes.map((o, i) => (
                  <div key={i} className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors" onClick={() => setTab('obras')}>
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-[#e0f7fa] text-[#0096b4] flex items-center justify-center font-bold text-[11px]">
                          {o.cliente_nombre?.charAt(0)}
                       </div>
                       <div>
                          <p className="text-[12px] font-bold text-slate-800">{o.nombre_obra}</p>
                          <p className="text-[10px] text-slate-500">{o.cliente_nombre}</p>
                       </div>
                    </div>
                    <div className="text-[11px] font-bold text-slate-800">
                       {(o.costo_acumulado / 1000).toFixed(1)}k
                    </div>
                  </div>
               ))}
             </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <h3 className="text-[14px] font-bold text-slate-800 mb-4 shrink-0">Estado del Portafolio</h3>
          <div className="flex-1 relative min-h-[250px]">
             <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                   <Pie data={estadoObrasData} innerRadius={60} outerRadius={80} dataKey="value" stroke="none">
                      {estadoObrasData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                   </Pie>
                   <Tooltip />
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-800">{stats.obrasActivas}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Obras</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};