// src/sesiones/dashboard/components/AlertasStockTable.tsx
import { AlertOctagon, TrendingDown } from 'lucide-react';

export default function AlertasStockTable() {
  // Mock de ítems con stock_actual <= stock_minimo
  const alertas = [
    { id: '1', sku: 'CON-089', nombre: 'Electrodos 6011 1/8"', actual: 5, minimo: 20, unidad: 'CAJAS' },
    { id: '2', sku: 'CON-112', nombre: 'Silicona Estructural Negra', actual: 2, minimo: 15, unidad: 'TUBOS' },
  ];

  return (
    <div className="flex flex-col h-full bg-eco-blanco">
      {/* Cabecera Compacta */}
      <div className="p-3 border-b border-eco-gris-borde flex items-center gap-2 bg-red-50/50 shrink-0">
        <AlertOctagon size={16} className="text-red-500" />
        <h3 className="text-[11px] font-bold uppercase tracking-tight text-eco-oscuro">
          Stock Crítico
        </h3>
      </div>

      {/* Contenedor con Scroll Interno Suavizado */}
      <div className="w-full flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-eco-gris-claro border-b border-eco-gris-borde z-10 shadow-sm">
            <tr className="text-eco-oscuro text-[10px] uppercase tracking-wider">
              <th className="p-2 pl-4 font-bold">Producto</th>
              <th className="p-2 font-bold text-center">Stock</th>
              <th className="p-2 pr-4 font-bold text-right">Déficit</th>
            </tr>
          </thead>
          <tbody>
            {alertas.map((item) => (
              <tr key={item.id} className="border-b border-eco-gris-borde/50 hover:bg-red-50/30 transition-colors group">
                <td className="p-2 pl-4">
                  <div className="font-bold text-eco-oscuro text-[11px] truncate max-w-[140px]">{item.nombre}</div>
                  <div className="text-[9px] text-eco-gris font-mono">{item.sku}</div>
                </td>
                <td className="p-2 text-center">
                  <span className="text-sm font-black text-red-600">{item.actual}</span>
                  <span className="text-[8px] text-eco-gris ml-1">{item.unidad.slice(0,3)}</span>
                </td>
                <td className="p-2 pr-4 text-right">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-sm">
                    <TrendingDown size={10} />
                    -{item.minimo - item.actual}
                  </span>
                </td>
              </tr>
            ))}
            {/* Si no hay más datos, esta fila ayuda a mantener la estructura visual */}
            {alertas.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-eco-gris text-[11px] font-medium">
                  No hay alertas críticas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}