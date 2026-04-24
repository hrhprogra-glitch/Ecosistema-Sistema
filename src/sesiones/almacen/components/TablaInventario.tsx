// src/sesiones/almacen/components/TablaInventario.tsx
import { Settings2, Wrench, Package } from 'lucide-react';
import type { InventarioItem } from '../types';

export default function TablaInventario() {
  // Datos mockeados temporalmente hasta conectar el Fetch de Supabase
  const mockData: InventarioItem[] = [
    { id: '1', codigo_sku: 'HER-001', nombre: 'Taladro Percutor Bosch', tipo: 'HERRAMIENTA', stock_actual: 5, stock_minimo: 2, unidad_medida: 'UNIDAD', estado: 'ACTIVO', ubicacion: 'Estante A' },
    { id: '2', codigo_sku: 'CON-045', nombre: 'Discos de Corte 4.5"', tipo: 'CONSUMIBLE', stock_actual: 15, stock_minimo: 50, unidad_medida: 'UNIDAD', estado: 'ACTIVO', ubicacion: 'Pasillo 2' },
  ];

  return (
    <div className="w-full overflow-x-auto bg-eco-blanco border border-eco-gris-borde">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-eco-gris-claro border-b border-eco-gris-borde text-eco-oscuro text-xs uppercase tracking-widest">
            <th className="p-4 font-semibold">SKU</th>
            <th className="p-4 font-semibold">Ítem</th>
            <th className="p-4 font-semibold">Tipo</th>
            <th className="p-4 font-semibold">Stock</th>
            <th className="p-4 font-semibold text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {mockData.map((item) => (
            <tr 
              key={item.id} 
              className="border-b border-eco-gris-borde/50 hover:bg-eco-celeste/20 transition-colors duration-300"
            >
              <td className="p-4 font-medium text-eco-oscuro">{item.codigo_sku}</td>
              <td className="p-4">
                <div className="font-semibold text-eco-oscuro">{item.nombre}</div>
                <div className="text-xs text-eco-gris mt-1">Ubicación: {item.ubicacion}</div>
              </td>
              <td className="p-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-none border ${
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
                  <span className={`text-lg font-bold ${item.stock_actual <= item.stock_minimo ? 'text-red-500' : 'text-eco-oscuro'}`}>
                    {item.stock_actual}
                  </span>
                  <span className="text-xs text-eco-gris lowercase">{item.unidad_medida}</span>
                </div>
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