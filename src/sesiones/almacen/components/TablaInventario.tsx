// src/sesiones/almacen/components/TablaInventario.tsx
import { useEffect, useState } from 'react';
import { Wrench, Package, Loader2, Edit2, Trash2 } from 'lucide-react';
import { inventarioService } from '../../../db/supabase';
import type { InventarioItem } from '../types';

interface TablaProps {
  refreshKey?: number;
  onEdit: (item: InventarioItem) => void;
}

export default function TablaInventario({ refreshKey = 0, onEdit }: TablaProps) {
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await inventarioService.listar();
      setInventario(data);
    } catch (error) {
      console.error("Error al cargar inventario:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [refreshKey]);

  const handleEliminar = async (id: number) => {
    if (window.confirm("CONFIRMACIÓN DE SEGURIDAD: ¿Eliminar permanentemente este ítem del inventario?")) {
      try {
        await inventarioService.eliminar(id);
        await cargarDatos();
      } catch (error) {
        alert("Error al eliminar ítem.");
      }
    }
  };

  return (
    <div className="w-full overflow-x-auto bg-eco-blanco border border-eco-gris-borde rounded-none shadow-none">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-eco-gris-claro border-b-2 border-eco-gris-borde text-eco-oscuro text-[10px] uppercase tracking-widest font-black">
            <th className="p-4">SKU</th>
            <th className="p-4">Ítem / Ubicación</th>
            <th className="p-4">Tipo</th>
            <th className="p-4">Stock</th>
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
          ) : inventario.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-20 text-center text-[10px] uppercase tracking-widest font-black text-eco-gris">
                Inventario Operativo Vacío
              </td>
            </tr>
          ) : (
            inventario.map((item) => (
              <tr key={item.id} className="hover:bg-eco-celeste/10 transition-colors duration-300 bg-eco-blanco">
                <td className="p-4 font-mono text-[12px] font-black text-eco-celeste">{item.codigo_sku}</td>
                <td className="p-4">
                  <div className="font-black text-eco-oscuro text-[13px] uppercase">{item.nombre}</div>
                  <div className="text-[10px] text-eco-gris font-bold uppercase mt-1 tracking-widest">
                    Ubicación: {item.ubicacion || 'NO ASIGNADA'}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border rounded-none shadow-none ${
                    item.tipo === 'HERRAMIENTA' 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                      : 'bg-orange-50 text-orange-700 border-orange-200'
                  }`}>
                    {item.tipo === 'HERRAMIENTA' ? <Wrench size={12} /> : <Package size={12} />}
                    {item.tipo}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-[15px] font-black ${item.stock_actual <= item.stock_minimo ? 'text-red-500' : 'text-eco-oscuro'}`}>
                      {item.stock_actual}
                    </span>
                    <span className="text-[9px] font-black text-eco-gris uppercase tracking-widest">{item.unidad_medida}</span>
                  </div>
                </td>
                <td className="p-4 text-center border-l border-eco-gris-borde">
                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={() => onEdit(item)}
                      title="Editar Ítem"
                      className="p-2 bg-eco-gris-claro border border-eco-gris-borde text-eco-gris hover:text-eco-oscuro hover:border-eco-oscuro transition-all duration-300 rounded-none"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleEliminar(item.id!)}
                      title="Eliminar Ítem"
                      className="p-2 bg-eco-gris-claro border border-eco-gris-borde text-eco-gris hover:text-eco-blanco hover:bg-red-500 hover:border-red-500 transition-all duration-300 rounded-none"
                    >
                      <Trash2 size={16} />
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