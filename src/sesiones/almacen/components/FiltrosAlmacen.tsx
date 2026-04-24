// src/sesiones/almacen/components/FiltrosAlmacen.tsx
import { Search, Filter } from 'lucide-react';
import type { TipoItem } from '../types';

export default function FiltrosAlmacen() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Buscador Global */}
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-eco-gris">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Buscar por SKU o Nombre del ítem..." 
          className="input-ecosistema pl-11"
        />
      </div>

      {/* Filtro por Tipo */}
      <div className="relative w-full sm:w-64">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-eco-gris">
          <Filter size={18} />
        </div>
        <select className="input-ecosistema pl-11 appearance-none cursor-pointer">
          <option value="TODOS">Todos los Tipos</option>
          <option value="CONSUMIBLE">Solo Consumibles</option>
          <option value="HERRAMIENTA">Solo Herramientas</option>
        </select>
      </div>
    </div>
  );
}