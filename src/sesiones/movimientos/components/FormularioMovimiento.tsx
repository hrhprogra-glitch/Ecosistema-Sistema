// src/sesiones/movimientos/components/FormularioMovimiento.tsx
import { PackageMinus, User, FileText, Wrench } from 'lucide-react';

export default function FormularioMovimiento() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-eco-gris-borde bg-eco-celeste/20">
        <h3 className="text-lg font-bold uppercase tracking-tight text-eco-oscuro">
          Nueva Transacción
        </h3>
      </div>

      <form className="p-6 flex flex-col gap-6">
        
        {/* Selector de Tipo de Movimiento (Botones tipo Tab) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-eco-gris uppercase tracking-wider">Tipo de Operación</label>
          <div className="grid grid-cols-2 gap-4">
            <label className="cursor-pointer">
              <input type="radio" name="tipo" value="SALIDA" className="peer sr-only" defaultChecked />
              <div className="p-4 border border-eco-gris-borde text-center font-medium text-eco-gris peer-checked:bg-eco-oscuro peer-checked:text-eco-blanco peer-checked:border-eco-oscuro transition-all duration-300 rounded-none active:scale-[0.98]">
                SALIDA (Entrega)
              </div>
            </label>
            <label className="cursor-pointer">
              <input type="radio" name="tipo" value="DEVOLUCION" className="peer sr-only" />
              <div className="p-4 border border-eco-gris-borde text-center font-medium text-eco-gris peer-checked:bg-eco-azul peer-checked:text-eco-oscuro peer-checked:border-eco-azul transition-all duration-300 rounded-none active:scale-[0.98]">
                DEVOLUCIÓN (Retorno)
              </div>
            </label>
          </div>
        </div>

        {/* Fila de Selección (Trabajador y Producto) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 relative">
            <label className="text-xs font-bold text-eco-gris uppercase tracking-wider flex items-center gap-2">
              <User size={14} /> Seleccionar Personal
            </label>
            {/* Aquí luego conectaremos un buscador predictivo (Select) */}
            <select className="input-ecosistema cursor-pointer">
              <option value="">Buscar por DNI o Nombre...</option>
              <option value="1">71234567 - Carlos Mendoza</option>
              <option value="2">45890123 - Elena Rojas</option>
            </select>
          </div>

          <div className="space-y-2 relative">
            <label className="text-xs font-bold text-eco-gris uppercase tracking-wider flex items-center gap-2">
              <Wrench size={14} /> Seleccionar Ítem
            </label>
            <select className="input-ecosistema cursor-pointer">
              <option value="">Buscar SKU o Nombre...</option>
              <option value="1">HER-001 - Taladro Percutor</option>
              <option value="2">CON-045 - Discos de Corte</option>
            </select>
          </div>
        </div>

        {/* Cantidad y Notas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-eco-gris uppercase tracking-wider">Cantidad</label>
            <input type="number" min="1" defaultValue="1" className="input-ecosistema text-center font-bold text-lg" required />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-eco-gris uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} /> Observaciones (Opcional)
            </label>
            <input type="text" placeholder="Ej: Herramienta entregada sin estuche..." className="input-ecosistema" />
          </div>
        </div>

        {/* Botón de Acción Principal */}
        <div className="mt-4 pt-6 border-t border-eco-gris-borde flex justify-end">
          <button type="submit" className="btn-ecosistema w-full sm:w-auto flex justify-center items-center gap-2 text-lg">
            <PackageMinus size={20} />
            Procesar Transacción
          </button>
        </div>

      </form>
    </div>
  );
}