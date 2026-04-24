// src/sesiones/historial/components/PanelBusquedaFiltros.tsx
import { Search, Calendar, Filter } from 'lucide-react';

export default function PanelBusquedaFiltros() {
  return (
    <div className="p-6 border-b border-eco-gris-borde bg-eco-blanco flex flex-col lg:flex-row gap-4">
      
      {/* Búsqueda Global */}
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-eco-gris">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Buscar por SKU, Empleado o Ítem..." 
          className="input-ecosistema pl-11 bg-eco-gris-claro"
        />
      </div>

      {/* Filtros de Estado y Fecha (Square Form) */}
      <div className="flex flex-col sm:flex-row gap-4">
        
        <div className="relative w-full sm:w-48">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-eco-gris">
            <Filter size={18} />
          </div>
          <select className="input-ecosistema pl-11 appearance-none cursor-pointer">
            <option value="TODOS">Todos los Estados</option>
            <option value="PENDIENTE_RETORNO">Pendiente de Retorno</option>
            <option value="COMPLETADO">Completado</option>
            <option value="RETORNADO">Retornado</option>
          </select>
        </div>

        <div className="relative w-full sm:w-48">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-eco-gris">
            <Calendar size={18} />
          </div>
          <input 
            type="date" 
            className="input-ecosistema pl-11 uppercase text-sm"
          />
        </div>
        
      </div>
    </div>
  );
}