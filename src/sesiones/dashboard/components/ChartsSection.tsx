// src/sesiones/dashboard/components/ChartsSection.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const dataMovimientos = [
  { name: 'LUN', salidas: 40, retornos: 24 },
  { name: 'MAR', salidas: 30, retornos: 13 },
  { name: 'MIE', salidas: 20, retornos: 98 },
  { name: 'JUE', salidas: 27, retornos: 39 },
  { name: 'VIE', salidas: 18, retornos: 48 },
  { name: 'SAB', salidas: 23, retornos: 38 },
];

const dataStock = [
  { cat: 'HERRAMIENTAS', cant: 45 },
  { cat: 'CONSUMIBLES', cant: 82 },
  { cat: 'EPPS', cant: 35 },
  { cat: 'QUÍMICOS', cant: 21 },
];

export default function ChartsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Tendencias (Area Chart) */}
      <div className="card-ecosistema p-6 bg-eco-blanco shadow-xl shadow-eco-oscuro/5">
        <h3 className="text-sm font-bold uppercase tracking-widest text-eco-gris mb-6 border-b border-eco-gris-borde pb-2">
          Tendencia de Movimientos (7D)
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataMovimientos}>
              <defs>
                <linearGradient id="colorCeleste" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d1d5db" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#111827', fontSize: 12, fontWeight: 'bold'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#111827', fontSize: 12}} />
              <Tooltip contentStyle={{borderRadius: '0px', border: '2px solid #111827'}} />
              <Area type="monotone" dataKey="salidas" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorCeleste)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Inventario (Bar Chart) */}
      <div className="card-ecosistema p-6 bg-eco-blanco shadow-xl shadow-eco-oscuro/5">
        <h3 className="text-sm font-bold uppercase tracking-widest text-eco-gris mb-6 border-b border-eco-gris-borde pb-2">
          Distribución de Almacén
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataStock}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d1d5db" />
              <XAxis dataKey="cat" axisLine={false} tickLine={false} tick={{fill: '#111827', fontSize: 10, fontWeight: 'bold'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#111827', fontSize: 12}} />
              <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '0px', border: '2px solid #111827'}} />
              <Bar dataKey="cant" fill="#111827" stroke="#38bdf8" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}