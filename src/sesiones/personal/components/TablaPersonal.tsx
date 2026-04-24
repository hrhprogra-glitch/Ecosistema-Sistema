// src/sesiones/personal/components/TablaPersonal.tsx
import { Settings2, UserCheck, UserX } from 'lucide-react';
import type { Trabajador } from '../types';

export default function TablaPersonal() {
  const mockData: Trabajador[] = [
    { id: '1', documento_identidad: '71234567', nombre_completo: 'Carlos Mendoza', cargo: 'Soldador Especializado', estado: 'ACTIVO' },
    { id: '2', documento_identidad: '45890123', nombre_completo: 'Elena Rojas', cargo: 'Supervisora de Obra', estado: 'INACTIVO' },
  ];

  return (
    <div className="w-full overflow-x-auto bg-eco-blanco border border-eco-gris-borde">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-eco-gris-claro border-b border-eco-gris-borde text-eco-oscuro text-xs uppercase tracking-widest">
            <th className="p-4 font-semibold">DNI / Doc</th>
            <th className="p-4 font-semibold">Nombre Completo</th>
            <th className="p-4 font-semibold">Cargo</th>
            <th className="p-4 font-semibold">Estado</th>
            <th className="p-4 font-semibold text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {mockData.map((empleado) => (
            <tr key={empleado.id} className="border-b border-eco-gris-borde/50 hover:bg-eco-celeste/20 transition-colors duration-300">
              <td className="p-4 font-medium text-eco-oscuro">{empleado.documento_identidad}</td>
              <td className="p-4 font-semibold text-eco-oscuro">{empleado.nombre_completo}</td>
              <td className="p-4 text-sm text-eco-gris">{empleado.cargo}</td>
              <td className="p-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-none border ${
                  empleado.estado === 'ACTIVO' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {empleado.estado === 'ACTIVO' ? <UserCheck size={14} /> : <UserX size={14} />}
                  {empleado.estado}
                </span>
              </td>
              <td className="p-4 text-center">
                <button className="p-2 text-eco-gris hover:text-eco-oscuro hover:bg-eco-gris-claro transition-all duration-300 rounded-none active:scale-95">
                  <Settings2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}