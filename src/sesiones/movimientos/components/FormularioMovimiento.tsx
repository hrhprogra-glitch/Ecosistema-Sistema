// src/sesiones/movimientos/components/FormularioMovimiento.tsx
import { useState, useRef, useEffect } from 'react';
import { Search, Plus, ArrowUpRight, ArrowDownLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { trabajadoresService, inventarioService } from '../../../db/supabase';
import type { ItemLote } from '../index';

interface FormProps {
  onAgregar: (item: ItemLote) => void;
  refreshKey: number;
  itemAEditar: ItemLote | null;
  onLimpiarEdicion: () => void;
}

export default function FormularioMovimiento({ onAgregar, refreshKey, itemAEditar, onLimpiarEdicion }: FormProps) {
  const [tipoMovimiento, setTipoMovimiento] = useState<'SALIDA' | 'DEVOLUCION'>('SALIDA');
  const inputRef = useRef<HTMLInputElement>(null);

  const [trabajadores, setTrabajadores] = useState<any[]>([]);
  const [inventario, setInventario] = useState<any[]>([]);

  const [busquedaDni, setBusquedaDni] = useState('');
  const [busquedaSku, setBusquedaSku] = useState('');
  const [cantidad, setCantidad] = useState(1);

  // Estados visuales para los Dropdowns
  const [mostrarDropdownT, setMostrarDropdownT] = useState(false);
  const [mostrarDropdownI, setMostrarDropdownI] = useState(false);

  useEffect(() => {
    const cargarMatrices = async () => {
      try {
        const [trabData, invData] = await Promise.all([
          trabajadoresService.listar(),
          inventarioService.listar()
        ]);
        setTrabajadores(trabData);
        setInventario(invData);
      } catch (error) {
        console.error("Error precargando matrices", error);
      }
    };
    cargarMatrices();
  }, [refreshKey]);

  // LÓGICA DE EDICIÓN Y RETORNO CRUZADO (CORREGIDA)
  useEffect(() => {
    // 1. Interceptor desde la tabla de Historial (Navegación Cruzada)
    const dataPendiente = sessionStorage.getItem('eco_transicion_retorno');
    if (dataPendiente) {
      try {
        const parseada = JSON.parse(dataPendiente);
        setTipoMovimiento('DEVOLUCION');
        setBusquedaDni(parseada.dni_trabajador);
        setBusquedaSku(parseada.sku_item);
        sessionStorage.removeItem('eco_transicion_retorno'); // Limpiamos caché
      } catch (e) {
        console.error(e);
      }
    }

    // 2. Interceptor desde el Lote Temporal (Botón Editar)
    if (itemAEditar) {
      setTipoMovimiento(itemAEditar.tipo_movimiento);
      // Extraemos exactamente el DNI y el SKU para forzar la coincidencia exacta
      setBusquedaDni(itemAEditar.trabajador_documento); 
      setBusquedaSku(itemAEditar.codigo_sku);
      setCantidad(itemAEditar.cantidad);
      inputRef.current?.focus();
      onLimpiarEdicion(); 
    }
  }, [itemAEditar, onLimpiarEdicion, refreshKey]);

  // FILTROS VISUALES (DROPDOWNS)
  const trabajadoresFiltrados = trabajadores.filter(t => 
    t.nombre_completo.toLowerCase().includes(busquedaDni.toLowerCase()) || 
    t.documento_identidad.toLowerCase().includes(busquedaDni.toLowerCase())
  ).slice(0, 5);

  const itemsFiltrados = inventario.filter(i => 
    i.nombre.toLowerCase().includes(busquedaSku.toLowerCase()) || 
    i.codigo_sku.toLowerCase().includes(busquedaSku.toLowerCase())
  ).slice(0, 5);

  // VALIDACIÓN EXACTA PARA PROCEDER
  const trabajadorSeleccionado = trabajadores.find(t => t.documento_identidad === busquedaDni.trim() || t.nombre_completo === busquedaDni.trim());
  const itemSeleccionado = inventario.find(i => i.codigo_sku === busquedaSku.trim() || i.nombre === busquedaSku.trim());

  const handleAgregarAlLote = () => {
    if (!trabajadorSeleccionado || !itemSeleccionado) return;
    if (cantidad <= 0) return alert("Cantidad inválida.");

    if (tipoMovimiento === 'SALIDA' && itemSeleccionado.stock_actual < cantidad) {
      alert(`ALERTA LOGÍSTICA: Solo tienes ${itemSeleccionado.stock_actual} unidades de ${itemSeleccionado.nombre} en el almacén.`);
      return;
    }

    const nuevoItem: ItemLote = {
      temp_id: Date.now() + Math.random(),
      trabajador_id: trabajadorSeleccionado.id,
      trabajador_nombre: trabajadorSeleccionado.nombre_completo,
      trabajador_documento: trabajadorSeleccionado.documento_identidad,
      item_id: itemSeleccionado.id,
      codigo_sku: itemSeleccionado.codigo_sku,
      item_nombre: itemSeleccionado.nombre,
      tipo_item: itemSeleccionado.tipo,
      tipo_movimiento: tipoMovimiento,
      cantidad: cantidad
    };

    onAgregar(nuevoItem);
    setBusquedaSku('');
    setCantidad(1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (trabajadorSeleccionado && itemSeleccionado) handleAgregarAlLote();
    }
  };

  const bloquearFlechas = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
  };

  return (
    <div className="card-ecosistema bg-eco-blanco shadow-xl shadow-eco-oscuro/5 h-full flex flex-col p-5 border-t-4 border-eco-oscuro rounded-none">
      
      <div className="flex gap-2 mb-6 shrink-0">
        <button 
          onClick={() => setTipoMovimiento('SALIDA')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all duration-200 border-2 rounded-none ${tipoMovimiento === 'SALIDA' ? 'bg-eco-oscuro border-eco-oscuro text-eco-blanco shadow-md' : 'bg-eco-gris-claro border-eco-gris-borde text-eco-gris hover:border-eco-oscuro/50'}`}
        >
          <ArrowUpRight size={16} className="inline mr-2" /> Salida
        </button>
        <button 
          onClick={() => setTipoMovimiento('DEVOLUCION')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all duration-200 border-2 rounded-none ${tipoMovimiento === 'DEVOLUCION' ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-eco-gris-claro border-eco-gris-borde text-eco-gris hover:border-emerald-600/50'}`}
        >
          <ArrowDownLeft size={16} className="inline mr-2" /> Retorno
        </button>
      </div>

      <div className="flex flex-col gap-5 flex-1">
        
        {/* BLOQUE PERSONAL CON DROPDOWN */}
        <div className="relative">
          <label className="block text-[10px] font-black text-eco-oscuro uppercase tracking-[0.2em] mb-1">
            {tipoMovimiento === 'SALIDA' ? 'Asignar a (Nombre o DNI)' : 'Devuelto por (Nombre o DNI)'}
          </label>
          <input 
            type="text" 
            value={busquedaDni}
            onChange={e => { setBusquedaDni(e.target.value); setMostrarDropdownT(true); }}
            onBlur={() => setTimeout(() => setMostrarDropdownT(false), 200)}
            placeholder="Escribe para buscar..." 
            className="w-full bg-eco-gris-claro border border-eco-gris-borde text-eco-oscuro font-bold px-3 py-3 outline-none focus:border-eco-celeste transition-all pr-10 rounded-none shadow-none uppercase"
          />
          {busquedaDni.length > 0 && (
            <div className="absolute right-3 top-[34px]">
              {trabajadorSeleccionado ? <CheckCircle2 size={18} className="text-emerald-500" /> : <AlertCircle size={18} className="text-red-500" />}
            </div>
          )}
          {/* Dropdown Personal */}
          {mostrarDropdownT && busquedaDni && !trabajadorSeleccionado && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-eco-gris-borde shadow-2xl">
              {trabajadoresFiltrados.map((t, idx) => (
                <div 
                  key={idx} 
                  onClick={() => { setBusquedaDni(t.documento_identidad); setMostrarDropdownT(false); }}
                  className="p-3 border-b border-eco-gris-borde/50 hover:bg-eco-celeste hover:text-white cursor-pointer transition-colors text-xs font-bold uppercase text-eco-oscuro"
                >
                  {t.nombre_completo} <span className="text-[9px] font-black opacity-70 ml-2">DNI: {t.documento_identidad}</span>
                </div>
              ))}
            </div>
          )}
          <div className="h-4 mt-1">
            {trabajadorSeleccionado && <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{trabajadorSeleccionado.nombre_completo} - {trabajadorSeleccionado.documento_identidad}</span>}
          </div>
        </div>

        {/* BLOQUE PRODUCTO CON DROPDOWN */}
        <div className="relative">
          <label className="block text-[10px] font-black text-eco-oscuro uppercase tracking-[0.2em] mb-1">Producto (Nombre o SKU)</label>
          <Search size={18} className="absolute left-3 top-[42px] text-eco-gris" />
          <input 
            ref={inputRef}
            type="text" 
            value={busquedaSku}
            onChange={e => { setBusquedaSku(e.target.value); setMostrarDropdownI(true); }}
            onBlur={() => setTimeout(() => setMostrarDropdownI(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe para buscar..." 
            className="w-full bg-white border-2 border-eco-oscuro text-eco-oscuro font-black text-lg pl-10 pr-10 py-4 outline-none focus:border-eco-celeste transition-colors shadow-inner uppercase rounded-none"
          />
          {busquedaSku.length > 0 && (
            <div className="absolute right-4 top-[42px]">
              {itemSeleccionado ? <CheckCircle2 size={24} className="text-emerald-500" /> : <AlertCircle size={24} className="text-red-500" />}
            </div>
          )}
          {/* Dropdown Productos */}
          {mostrarDropdownI && busquedaSku && !itemSeleccionado && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-eco-gris-borde shadow-2xl">
              {itemsFiltrados.map((i, idx) => (
                <div 
                  key={idx} 
                  onClick={() => { setBusquedaSku(i.codigo_sku); setMostrarDropdownI(false); }}
                  className="p-3 border-b border-eco-gris-borde/50 hover:bg-eco-celeste hover:text-white cursor-pointer transition-colors text-[11px] font-bold uppercase text-eco-oscuro"
                >
                  {i.nombre} <span className="text-[9px] font-black opacity-70 ml-2">SKU: {i.codigo_sku}</span>
                </div>
              ))}
            </div>
          )}
          <div className="h-4 mt-1 flex justify-between">
            {itemSeleccionado && (
              <>
                <span className="text-[10px] font-black text-eco-oscuro uppercase tracking-widest truncate">{itemSeleccionado.nombre}</span>
                <span className="text-[10px] font-black text-eco-celeste uppercase tracking-widest ml-2 whitespace-nowrap">Stock BD: {itemSeleccionado.stock_actual}</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 mt-2">
          <div className="col-span-2">
            <label className="block text-[10px] font-black text-eco-oscuro uppercase tracking-[0.2em] mb-1">Cantidad</label>
            <input 
              type="number" 
              value={cantidad}
              onChange={e => setCantidad(Number(e.target.value))}
              onKeyDown={(e) => { handleKeyDown(e); bloquearFlechas(e); }}
              min={1}
              className="w-full bg-white border border-eco-gris-borde text-eco-oscuro font-bold text-center text-lg px-3 py-3 outline-none focus:border-eco-celeste no-spinners rounded-none shadow-none"
            />
          </div>
          <div className="col-span-3 flex items-end">
            <button 
              onClick={handleAgregarAlLote}
              disabled={!trabajadorSeleccionado || !itemSeleccionado}
              className="w-full h-[54px] bg-eco-celeste hover:bg-sky-400 text-eco-oscuro font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-colors shadow-none rounded-none disabled:opacity-50 disabled:bg-eco-gris-claro disabled:text-eco-gris border border-transparent"
            >
              <Plus size={16} /> Agregar
            </button>
          </div>
        </div>
      </div>
      
      <p className="text-[10px] text-eco-gris text-center mt-6 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
        <kbd className="bg-eco-gris-claro px-1.5 py-0.5 rounded-none border border-eco-gris-borde font-mono font-black text-eco-oscuro">Enter</kbd> = Agregar rápido
      </p>

    </div>
  );
}