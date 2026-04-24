// src/sesiones/historial/components/TablaHistorialGlobal.tsx
import { ArrowUpRight, ArrowDownLeft, RotateCcw } from 'lucide-react';
import type { MovimientoDetalle } from '../types';

export default function TablaHistorialGlobal() {
  // Datos mockeados simulando un JOIN de Base de Datos
  const mockHistorial: MovimientoDetalle[] = [
    {
      id: 'TRX-001', fecha: '2026-04-24 10:15', tipo: 'SALIDA', estado: 'PENDIENTE_RETORNO', cantidad: 1,
      item_id: '1', item_sku: 'HER-001', item_nombre: 'Taladro Percutor Bosch', item_tipo: 'HERRAMIENTA',
      trabajador_id: '1', trabajador_nombre: 'Carlos Mendoza', trabajador_documento: '71234567'
    },
    {
      id: 'TRX-002', fecha: '2026-04-24 09:30', tipo: 'SALIDA', estado: 'COMPLETADO', cantidad: 5,
      item_id: '2', item_sku: 'CON-045', item_nombre: 'Discos de Corte 4.5"', item_tipo: 'CONSUMIBLE',
      trabajador_id: '2', trabajador_nombre: 'Elena Rojas', trabajador_documento: '45890123'
    }
  ];

  return (
    <div className="w-full overflow-x-auto bg-eco-blanco">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-eco-gris-claro border-b border-eco-gris-borde text-eco-oscuro text-xs uppercase tracking-widest">
            <th className="p-4 font-semibold">ID / Fecha</th>
            <th className="p-4 font-semibold">Transacción</th>
            <th className="p-4 font-semibold">Ítem</th>
            <th className="p-4 font-semibold">Personal</th>
            <th className="p-4 font-semibold text-center">Auditoría / Acción</th>
          </tr>
        </thead>
        <tbody>
          {mockHistorial.map((trx) => (
            <tr key={trx.id} className="border-b border-eco-gris-borde/50 hover:bg-eco-celeste/10 transition-colors duration-300">
              
              <td className="p-4">
                <div className="font-bold text-eco-oscuro text-xs">{trx.id}</div>
                <div className="text-xs text-eco-gris mt-1">{trx.fecha}</div>
              </td>

              <td className="p-4">
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-none border ${
                  trx.tipo === 'SALIDA' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'
                }`}>
                  {trx.tipo === 'SALIDA' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                  {trx.tipo}
                </span>
                <div className="font-bold text-eco-oscuro mt-2">{trx.cantidad} und.</div>
              </td>

              <td className="p-4">
                <div className="font-semibold text-eco-oscuro">{trx.item_nombre}</div>
                <div className="text-xs text-eco-gris mt-1">SKU: {trx.item_sku} • {trx.item_tipo}</div>
              </td>

              <td className="p-4">
                <div className="font-medium text-eco-oscuro">{trx.trabajador_nombre}</div>
                <div className="text-xs text-eco-gris mt-1">DNI: {trx.trabajador_documento}</div>
              </td>

              <td className="p-4 text-center">
                {trx.estado === 'PENDIENTE_RETORNO' ? (
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-eco-oscuro text-eco-blanco font-bold text-xs uppercase tracking-wider hover:bg-eco-azul hover:text-eco-oscuro transition-all duration-300 rounded-none active:scale-95">
                    <RotateCcw size={14} />
                    Retornar
                  </button>
                ) : (
                  <span className={`inline-block px-3 py-1 text-xs font-bold border rounded-none ${
                    trx.estado === 'COMPLETADO' ? 'text-eco-gris bg-eco-gris-claro border-eco-gris-borde' : 'text-blue-700 bg-blue-50 border-blue-200'
                  }`}>
                    {trx.estado}
                  </span>
                )}
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}