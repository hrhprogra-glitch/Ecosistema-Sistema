// src/sesiones/personal/components/TablaPersonal.tsx
import { useEffect, useState } from 'react';
import { UserCheck, UserX, Loader2, Power, Edit2, Trash2 } from 'lucide-react';
import { trabajadoresService } from '../../../db/supabase';

// Blindaje contra errores de Vite
interface TrabajadorLocal {
  id?: number;
  documento_identidad: string;
  nombre_completo: string;
  cargo: string;
  estado: string;
}

interface TablaProps {
  refreshKey?: number;
  onEdit: (trabajador: any) => void;
}

export default function TablaPersonal({ refreshKey = 0, onEdit }: TablaProps) {
  const [trabajadores, setTrabajadores] = useState<TrabajadorLocal[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await trabajadoresService.listar();
      setTrabajadores(data as TrabajadorLocal[]);
    } catch (error) {
      console.error("Error al cargar trabajadores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [refreshKey]);

  const handleAlternarEstado = async (id: number, estadoActual: string) => {
    try {
      await trabajadoresService.alternarEstado(id, estadoActual);
      await cargarDatos(); 
    } catch (error) {
      console.error("Error cambiando estado:", error);
    }
  };

  const handleEliminar = async (id: number) => {
    if (window.confirm("CONFIRMACIÓN ESTRUCTURAL: ¿Estás seguro de revocar y eliminar este trabajador de la base de datos permanentemente?")) {
      try {
        await trabajadoresService.eliminar(id);
        await cargarDatos();
      } catch (error) {
        console.error("Error eliminando trabajador:", error);
        alert("Fallo al procesar la eliminación.");
      }
    }
  };

  return (
    <div className="w-full overflow-x-auto bg-eco-blanco border border-eco-gris-borde rounded-none shadow-none">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-eco-gris-claro border-b-2 border-eco-gris-borde text-eco-oscuro text-[10px] uppercase tracking-widest font-black">
            <th className="p-4">DNI / Doc</th>
            <th className="p-4">Nombre Completo</th>
            <th className="p-4">Cargo</th>
            <th className="p-4">Estado</th>
            <th className="p-4 text-center border-l border-eco-gris-borde">Operaciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-eco-gris-borde/50">
          {loading ? (
            <tr>
              <td colSpan={5} className="py-20 text-center text-eco-gris">
                <Loader2 size={32} className="animate-spin mx-auto text-eco-celeste" />
              </td>
            </tr>
          ) : trabajadores.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-20 text-center text-[10px] uppercase tracking-widest font-black text-eco-gris">
                Directorio Operativo Vacío
              </td>
            </tr>
          ) : (
            trabajadores.map((empleado) => (
              <tr key={empleado.id} className="hover:bg-eco-celeste/10 transition-colors duration-300 bg-eco-blanco">
                <td className="p-4 font-mono text-[12px] font-black text-eco-celeste">{empleado.documento_identidad}</td>
                <td className="p-4 font-black text-eco-oscuro text-[13px] uppercase">{empleado.nombre_completo}</td>
                <td className="p-4 text-xs text-eco-gris font-bold uppercase">{empleado.cargo}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border rounded-none shadow-none ${
                    empleado.estado === 'ACTIVO' 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-red-50 text-red-500 border-red-200'
                  }`}>
                    {empleado.estado === 'ACTIVO' ? <UserCheck size={14} /> : <UserX size={14} />}
                    {empleado.estado}
                  </span>
                </td>
                <td className="p-4 text-center border-l border-eco-gris-borde">
                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={() => onEdit(empleado)}
                      title="Editar Ficha"
                      className="p-2 bg-eco-gris-claro border border-eco-gris-borde text-eco-gris hover:text-eco-oscuro hover:border-eco-oscuro transition-all duration-300 rounded-none"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleEliminar(empleado.id!)}
                      title="Dar de Baja Permanentemente"
                      className="p-2 bg-eco-gris-claro border border-eco-gris-borde text-eco-gris hover:text-eco-blanco hover:bg-red-500 hover:border-red-500 transition-all duration-300 rounded-none"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleAlternarEstado(empleado.id!, empleado.estado)}
                      title={empleado.estado === 'ACTIVO' ? "Suspender Trabajador" : "Habilitar Trabajador"}
                      className="p-2 bg-eco-gris-claro border border-eco-gris-borde text-eco-gris hover:text-eco-blanco hover:bg-eco-oscuro hover:border-eco-oscuro transition-all duration-300 rounded-none"
                    >
                      <Power size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}