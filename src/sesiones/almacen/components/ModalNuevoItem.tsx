// src/sesiones/almacen/components/ModalNuevoItem.tsx
import { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { inventarioService } from '../../../db/supabase';
import type { InventarioItem, TipoItem, UnidadMedida } from '../types';

interface ModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  itemAEditar?: InventarioItem | null;
}

export default function ModalNuevoItem({ onClose, onSuccess, itemAEditar }: ModalProps) {
  const [procesando, setProcesando] = useState(false);
  
  const isModoEdicion = !!itemAEditar;

  // CORRECCIÓN DE UX: stock_actual y stock_minimo inician como strings vacíos ('') para no estorbar visualmente
  const [formData, setFormData] = useState({
    codigo_sku: itemAEditar?.codigo_sku || '',
    tipo: (itemAEditar?.tipo || 'CONSUMIBLE') as TipoItem,
    nombre: itemAEditar?.nombre || '',
    stock_actual: itemAEditar ? String(itemAEditar.stock_actual) : '',
    stock_minimo: itemAEditar ? String(itemAEditar.stock_minimo) : '',
    unidad_medida: (itemAEditar?.unidad_medida || 'UNIDAD') as UnidadMedida,
    ubicacion: itemAEditar?.ubicacion || '',
    estado: itemAEditar?.estado || 'ACTIVO'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcesando(true);
    try {
      // INGENIERÍA: Casteamos estrictamente a Number justo antes de enviarlo a la BD
      const payload = {
        ...formData,
        stock_actual: Number(formData.stock_actual),
        stock_minimo: Number(formData.stock_minimo)
      };

      if (isModoEdicion && itemAEditar?.id) {
        await inventarioService.actualizar(itemAEditar.id, payload);
      } else {
        await inventarioService.crear(payload);
      }
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error(error);
      alert('Error de Integridad: Verifica que el código SKU no esté duplicado en el sistema.');
    } finally {
      setProcesando(false);
    }
  };

  // --- BARRERA DE SEGURIDAD LÓGICA ---
  const bloquearFlechas = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-eco-oscuro/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="card-ecosistema w-full max-w-2xl bg-eco-blanco p-0 flex flex-col shadow-2xl shadow-eco-oscuro/10 scale-in-95 duration-300 rounded-none border-t-4 border-eco-celeste">
        
        <div className="flex justify-between items-center p-6 border-b border-eco-gris-borde bg-eco-gris-claro">
          <div>
            <h3 className="text-xl font-bold uppercase tracking-tighter text-eco-oscuro">
              {isModoEdicion ? 'Actualizar Ítem' : 'Registrar Nuevo Ítem'}
            </h3>
            <p className="text-[10px] text-eco-gris font-bold uppercase tracking-widest mt-1">
              {isModoEdicion ? 'Modificación de parámetros' : 'Ingreso al almacén master'}
            </p>
          </div>
          <button onClick={onClose} className="text-eco-gris hover:text-red-500 transition-colors duration-300">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-eco-gris uppercase tracking-wider">Código SKU</label>
              <input 
                type="text" required
                value={formData.codigo_sku}
                onChange={e => setFormData({...formData, codigo_sku: e.target.value})}
                placeholder="Ej: HER-005" 
                className="input-ecosistema" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-eco-gris uppercase tracking-wider">Tipo de Ítem</label>
              <select 
                required
                value={formData.tipo}
                onChange={e => setFormData({...formData, tipo: e.target.value as TipoItem})}
                className="input-ecosistema"
              >
                <option value="CONSUMIBLE">Consumible</option>
                <option value="HERRAMIENTA">Herramienta</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-eco-gris uppercase tracking-wider">Nombre del Ítem</label>
              <input 
                type="text" required
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
                placeholder="Ej: Taladro de Banco..." 
                className="input-ecosistema" 
              />
            </div>

            {/* APLICACIÓN DE RESTRICCIONES EN STOCK ACTUAL */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-eco-gris uppercase tracking-wider">Stock Actual</label>
              <input 
                type="number" required min="0"
                value={formData.stock_actual}
                onChange={e => setFormData({...formData, stock_actual: e.target.value})}
                onKeyDown={bloquearFlechas}
                className="input-ecosistema no-spinners" 
                placeholder="0"
              />
            </div>

            {/* APLICACIÓN DE RESTRICCIONES EN STOCK MÍNIMO */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-eco-gris uppercase tracking-wider">Stock Mínimo (Alerta)</label>
              <input 
                type="number" required min="0"
                value={formData.stock_minimo}
                onChange={e => setFormData({...formData, stock_minimo: e.target.value})}
                onKeyDown={bloquearFlechas}
                className="input-ecosistema no-spinners" 
                placeholder="0"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-eco-gris uppercase tracking-wider">Unidad de Medida</label>
              <select 
                required
                value={formData.unidad_medida}
                onChange={e => setFormData({...formData, unidad_medida: e.target.value as UnidadMedida})}
                className="input-ecosistema"
              >
                <option value="UNIDAD">Unidades</option>
                <option value="CAJA">Cajas</option>
                <option value="METRO">Metros</option>
                <option value="LITRO">Litros</option>
                <option value="KILOGRAMO">Kilogramos</option>
                <option value="PAR">Pares</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-eco-gris uppercase tracking-wider">Ubicación Física</label>
              <input 
                type="text"
                value={formData.ubicacion}
                onChange={e => setFormData({...formData, ubicacion: e.target.value})}
                placeholder="Ej: Estante A" 
                className="input-ecosistema" 
              />
            </div>

          </div>

          <div className="flex justify-end gap-4 mt-4 pt-6 border-t border-eco-gris-borde">
            <button type="button" onClick={onClose} className="px-6 py-3 font-medium text-eco-gris hover:bg-eco-gris-claro transition-colors border border-transparent rounded-none">
              Cancelar
            </button>
            <button disabled={procesando} type="submit" className="btn-ecosistema flex items-center justify-center gap-2">
              {procesando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isModoEdicion ? 'Actualizar Ítem' : 'Guardar en Inventario'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}