import { ShoppingCart, Trash2, CheckCircle2 } from 'lucide-react';

export default function ResumenTemporal() {
  // Mock de ítems temporales en el lote
  const items = [
    { id: 1, sku: 'HER-045', nombre: 'Taladro Percutor Bosch 800W', cant: 1, unidad: 'UND' },
    { id: 2, sku: 'CON-089', nombre: 'Electrodos 6011 1/8"', cant: 5, unidad: 'CAJAS' }
  ];

  return (
    <div className="card-ecosistema bg-white shadow-xl shadow-eco-oscuro/5 h-full flex flex-col border border-eco-gris-borde">
      
      {/* Cabecera del Lote */}
      <div className="p-4 border-b border-eco-gris-borde flex justify-between items-center bg-eco-gris-claro shrink-0">
        <h3 className="text-sm font-bold uppercase tracking-tight text-eco-oscuro flex items-center gap-2">
          <ShoppingCart size={18} className="text-eco-celeste" />
          Lote Actual ({items.length})
        </h3>
        <button className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors">
          Vaciar Lote
        </button>
      </div>

      {/* Lista de Movimientos con Scroll Suavizado */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-white border-b border-eco-gris-borde z-10 shadow-sm">
            <tr className="text-eco-gris text-[10px] uppercase tracking-wider">
              <th className="p-3 pl-4 font-bold">Producto</th>
              <th className="p-3 font-bold text-center">Cant.</th>
              <th className="p-3 pr-4 font-bold text-right">Quitar</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-eco-gris-borde/40 hover:bg-eco-gris-claro/50 transition-colors group">
                <td className="p-3 pl-4">
                  <div className="font-bold text-eco-oscuro text-xs truncate max-w-[200px]">{item.nombre}</div>
                  <div className="text-[10px] text-eco-gris font-mono mt-0.5">{item.sku}</div>
                </td>
                <td className="p-3 text-center">
                  <span className="text-sm font-black text-eco-oscuro bg-eco-gris-claro px-2 py-1 rounded-sm border border-eco-gris-borde">
                    {item.cant} <span className="text-[9px] text-eco-gris font-bold ml-0.5">{item.unidad}</span>
                  </span>
                </td>
                <td className="p-3 pr-4 text-right">
                  <button className="text-eco-gris hover:text-red-500 transition-colors p-1">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-eco-gris text-[11px] font-medium">
                  El lote está vacío. Agrega productos desde el formulario.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Botón de Confirmación Fijo (Square) */}
      <div className="p-4 border-t border-eco-gris-borde bg-eco-blanco shrink-0">
        <button className="w-full py-4 bg-eco-oscuro hover:bg-black text-eco-celeste font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
          <CheckCircle2 size={20} />
          Procesar Movimientos
        </button>
      </div>

    </div>
  );
}