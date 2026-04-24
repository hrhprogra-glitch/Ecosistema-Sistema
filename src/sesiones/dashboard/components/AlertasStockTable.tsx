// src/sesiones/dashboard/components/AlertasStockTable.tsx
import { AlertOctagon, TrendingDown } from 'lucide-react';

export default function AlertasStockTable() {
  // Mock de ítems con stock_actual <= stock_minimo
  const alertas = [
    { id: '1', sku: 'CON-089', nombre: 'Electrodos 6011 1/8"', actual: 5, minimo: 20, unidad: 'CAJAS' },
    { id: '2', sku: 'CON-112', nombre: 'Silicona Estructural Negra', actual: 2, minimo: 15, unidad: 'TUBOS' },
  ];

  return (
    <div className="flex flex-col">
      <div className="p-6 border-b border-eco-gris-borde flex items-center gap-3 bg-red-50/50">
        <AlertOctagon size={20} className="text-red-500" />
        <h3 className="text-sm font-bold uppercase tracking-tight text-eco-oscuro">
          Atención Requerida: Stock Crítico
        </h3>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-eco-gris-claro border-b border-eco-gris-borde text-eco-oscuro text-xs uppercase tracking-widest">
              <th className="p-4 font-semibold">SKU / Producto</th>
              <th className="p-4 font-semibold">Stock Actual</th>
              <th className="p-4 font-semibold">Mínimo Requerido</th>
              <th className="p-4 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {alertas.map((item) => (
              <tr key={item.id} className="border-b border-eco-gris-borde/50 hover:bg-red-50/30 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-eco-oscuro">{item.nombre}</div>
                  <div className="text-xs text-eco-gris mt-1">SKU: {item.sku}</div>
                </td>
                <td className="p-4">
                  <div className="text-xl font-black text-red-600">{item.actual}</div>
                  <div className="text-[10px] uppercase text-eco-gris font-bold">{item.unidad}</div>
                </td>
                <td className="p-4">
                  <div className="text-lg font-bold text-eco-oscuro">{item.minimo}</div>
                  <div className="text-[10px] uppercase text-eco-gris font-bold">{item.unidad}</div>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-none uppercase">
                    <TrendingDown size={14} />
                    Faltan {item.minimo - item.actual}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}