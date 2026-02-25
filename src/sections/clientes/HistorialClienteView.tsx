// src/sections/clientes/HistorialClienteView.tsx
import { useState, useEffect } from 'react';
import { finanzasService, obrasService, clientesService } from '../../services/supabase';
import type { Cliente } from '../../services/supabase';
import { Loader2, History,  X, Calculator, LayoutGrid, DollarSign, CheckCircle2, Printer, Trash2, Edit3, Search, ChevronDown,Landmark} from 'lucide-react';
interface Props {
  clienteInicial: Cliente | null;
  onLimpiarFiltro: () => void;
}

export const HistorialGeneralView = ({ clienteInicial, onLimpiarFiltro }: Props) => {
  const [loading, setLoading] = useState(true);
  const [historial, setHistorial] = useState<any[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtroClienteId, setFiltroClienteId] = useState<string>(clienteInicial?.id?.toString() || "");
  const [itemSeleccionado, setItemSeleccionado] = useState<any | null>(null);
  const [busqueda, setBusqueda] = useState("");
  // Estados de Filtros Extra
  const [filtroTipoDoc, setFiltroTipoDoc] = useState('TODOS');
  const [filtroEstadoPago, setFiltroEstadoPago] = useState('TODOS');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  // Estados para Gestión de Pagos
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [montoAbono, setMontoAbono] = useState<string>("");
  const [metodoPago, setMetodoPago] = useState("Transferencia");
  const [itemParaPagar, setItemParaPagar] = useState<any>(null);
  const [pagoAEditar, setPagoAEditar] = useState<any>(null);
  const [datosEdicionCliente, setDatosEdicionCliente] = useState({
  nombre: "",
  direccion: "",
  dni_ruc: "",
  email: "",
  telefono: ""
});
  // Estado para Impresión de Hoja A4
  const [comprobanteImprimir, setComprobanteImprimir] = useState<any | null>(null);

  useEffect(() => {
    if (clienteInicial) setFiltroClienteId(clienteInicial.id?.toString() || "");
  }, [clienteInicial]);

  const cargarBase = async () => {
    setLoading(true);
    try {
      const [cots, obras, clis] = await Promise.all([
        finanzasService.listarCotizacionesTodas(),
        obrasService.listar(),
        clientesService.listar()
      ]);
      setClientes(clis);

      const timeline = [
        ...cots.map((c: any) => ({
          ...c, tipo: 'COTIZACIÓN', fecha: new Date(c.created_at || c.fecha_emision), 
          monto: c.monto_total || 0, items_detalle: c.detalles || []
        })),
        ...obras.map((o: any) => {
          const salidas = o.materiales_asignados?.reduce((acc: number, m: any) => acc + (Number(m.cantidad || 0) * Number(m.precioUnit || 0)), 0) || 0;
          const devoluciones = o.devoluciones?.reduce((acc: number, d: any) => acc + (Number(d.cantidad || 0) * Number(d.precioUnit || 0)), 0) || 0;
          return {
            ...o, tipo: 'PROYECTO', fecha: new Date(o.created_at || o.fecha_inicio), 
            monto: (salidas - devoluciones) || 0,
            detalles: { 
              salidas, devoluciones, codigo: o.codigo_obra,
              lista_salidas: o.materiales_asignados || [],
              lista_devoluciones: o.devoluciones || []
            }
          };
        })
      ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
      
      setHistorial(timeline);

      // 🔥 ESTA ES LA SOLUCIÓN: Actualiza el modal en tiempo real con los datos recién traídos
      setItemSeleccionado((prev: any) => {
        if (!prev) return null;
        return timeline.find((t: any) => t.id === prev.id && t.tipo === prev.tipo) || prev;
      });

    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { cargarBase(); }, []);

  const datosFiltrados = historial.filter(h => {
    // 1. Filtro por Texto y Cliente
    const coincideID = filtroClienteId ? h.cliente_id?.toString() === filtroClienteId : true;
    const nombreCliente = clientes.find(c => c.id === h.cliente_id)?.nombre_cliente.toLowerCase() || "";
    const idDocumento = String(h.id).toLowerCase();
    const coincideTexto = busqueda === "" || 
      nombreCliente.includes(busqueda.toLowerCase()) || 
      idDocumento.includes(busqueda.toLowerCase());

    // 2. Filtro por Fecha
    let coincideFecha = true;
    if (filtroFecha) {
      const fechaStr = h.fecha.toISOString().split('T')[0];
      coincideFecha = fechaStr === filtroFecha;
    }

    // 3. Filtro por Tipo de Documento (Factura >= 700)
    let coincideTipoDoc = true;
    const tipoDocReal = h.monto >= 700 ? 'FACTURA' : 'BOLETA';
    if (filtroTipoDoc !== 'TODOS') {
      coincideTipoDoc = tipoDocReal === filtroTipoDoc;
    }

    // 4. Filtro por Estado de Pago
    let coincideEstadoPago = true;
    if (filtroEstadoPago !== 'TODOS') {
      const abonos = h.pagos || [];
      const abonadoTotal = abonos.reduce((acc: number, p: any) => acc + (p.monto_pagado || 0), 0) || 0;
      const saldo = h.monto - abonadoTotal;
      
      let estadoReal = 'PENDIENTE';
      if (saldo <= 0) estadoReal = 'TOTAL';
      else if (abonadoTotal > 0) estadoReal = 'PARCIAL';

      coincideEstadoPago = estadoReal === filtroEstadoPago;
    }

    return coincideID && coincideTexto && coincideFecha && coincideTipoDoc && coincideEstadoPago;
  });

  // LOGICA DE PAGOS (REGISTRAR / EDITAR)
  const confirmarAbono = async () => {
    const monto = Number(montoAbono);
    
    if (isNaN(monto) || monto <= 0) {
      return alert("Por favor, ingrese un monto válido.");
    }

    // --- 1. NUEVA LÓGICA DE VALIDACIÓN DE SALDO MÁXIMO ---
    const abonosPrevios = itemParaPagar?.pagos || [];
    const abonadoTotalSinActual = abonosPrevios.reduce((acc: number, p: any) => {
      // Si estamos en modo "Editar", ignoramos el monto antiguo de ese pago para poder recalcular
      if (pagoAEditar && p.id === pagoAEditar.id) return acc;
      return acc + (Number(p.monto_pagado) || 0);
    }, 0);
    
    const saldoDisponible = Number(itemParaPagar?.monto || 0) - abonadoTotalSinActual;

    // Comparamos evitando errores de decimales en JavaScript
    if (monto > Number(saldoDisponible.toFixed(2))) {
      return alert(`❌ Operación denegada:\nEl monto ingresado (S/ ${monto.toFixed(2)}) supera el saldo pendiente real (S/ ${saldoDisponible.toFixed(2)}).`);
    }
    // -----------------------------------------------------

    try {
      // 2. ACTUALIZAR DATOS DEL CLIENTE
      if (itemParaPagar?.cliente_id) {
        await clientesService.actualizar(itemParaPagar.cliente_id, {
          nombre_cliente: datosEdicionCliente.nombre.toUpperCase(),
          dni: datosEdicionCliente.dni_ruc,  
          telefono: datosEdicionCliente.telefono,
          direccion: datosEdicionCliente.direccion,
          email: datosEdicionCliente.email.toLowerCase()
        });
      }
      
      // 3. LÓGICA DE PAGO
      if (pagoAEditar?.id) {
        await finanzasService.actualizarPago(pagoAEditar.id, {
          monto_pagado: monto,
          metodo: metodoPago
        });
        alert("✅ Pago editado correctamente.");
      } else {
        await finanzasService.registrarPago(
          itemParaPagar.id, 
          monto, 
          metodoPago
        );
        alert("✅ Pago registrado correctamente.");
      }

      // 4. FINALIZAR Y REFRESCAR AL INSTANTE
      setShowPagoModal(false);
      setPagoAEditar(null);
      await cargarBase(); 
      
    } catch (error: any) {
      console.error("Error:", error);
      alert("Error: " + (error.message || "No se pudo guardar"));
    }
  };
  const handleEditarAbono = (pago: any, cot: any) => {
  const cliente = clientes.find(c => c.id === cot.cliente_id);
  
  setItemParaPagar(cot);
  setPagoAEditar(pago);
  setMontoAbono(pago.monto_pagado.toString());
  setMetodoPago(pago.metodo);
  
  // Cargamos los datos para el formulario de edición
  // Cargamos los datos para el formulario de edición
  setDatosEdicionCliente({
    nombre: cliente?.nombre_cliente || "",
    direccion: cliente?.direccion || "",
    dni_ruc: cliente?.dni || "", // <--- CAMBIA cliente?.dni_ruc POR cliente?.dni
    email: cliente?.email || "",
    telefono: cliente?.telefono || ""
  });
  
  setShowPagoModal(true);
};
  const handleEliminarAbono = async (pagoId: number) => {
    if (!confirm("¿Desea eliminar este registro de pago?")) return;
    try {
      // @ts-ignore
      await finanzasService.eliminarPago(pagoId);
      alert("Pago eliminado.");
      await cargarBase(); // <-- Añadido el await aquí
    } catch (e) { alert("Error al eliminar."); }
  };
  const manejarTecladoBusqueda = (e: React.KeyboardEvent, sugerencias: Cliente[]) => {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    setSelectedIndex(prev => (prev < sugerencias.length - 1 ? prev + 1 : prev));
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
  } else if (e.key === "Enter") {
    if (selectedIndex >= 0 && sugerencias[selectedIndex]) {
      const cliente = sugerencias[selectedIndex];
      setBusqueda(cliente.nombre_cliente);
      setFiltroClienteId(cliente.id?.toString() || "");
      setSelectedIndex(-1);
    }
  } else if (e.key === "Escape") {
    setSelectedIndex(-1);
    (e.target as HTMLInputElement).blur();
  }
};
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER: PANEL DE CUENTAS POR COBRAR CON FILTROS AVANZADOS */}
      <div className="bg-white p-6 border-l-8 border-[#1e293b] flex flex-col gap-5 shadow-sm">
        
        {/* FILA SUPERIOR: TÍTULO Y BUSCADOR PRINCIPAL */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 text-left w-full md:w-auto">
            <div className="bg-[#1e293b] p-3">
              <Landmark className="text-[#00B4D8]" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#1e293b] uppercase tracking-tighter italic">Cuentas por Cobrar</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Gestión de Deudas y Abonos</p>
            </div>
          </div>
          
          {/* BUSCADOR DESPLEGABLE */}
          <div className="relative w-full md:w-[450px]">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="ESCRIBE EL NOMBRE DEL CLIENTE..."
              className="w-full bg-slate-50 border border-slate-200 pl-12 pr-10 py-4 text-[11px] font-black uppercase outline-none focus:border-[#00B4D8] transition-all shadow-inner"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setSelectedIndex(-1);
                if (e.target.value === "") setFiltroClienteId("");
              }}
              onKeyDown={(e) => manejarTecladoBusqueda(e, clientes.filter(c => c.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase())))}
            />
            {busqueda && (
              <button 
                onClick={() => { setBusqueda(""); setFiltroClienteId(""); onLimpiarFiltro(); setSelectedIndex(-1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            )}

            {/* LISTA DE SUGERENCIAS */}
            {busqueda !== "" && !clientes.some(c => c.nombre_cliente === busqueda) && (
              <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 shadow-2xl max-h-60 overflow-y-auto">
                {clientes.filter(c => c.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase())).map((cliente, index) => (
                  <button
                    key={cliente.id}
                    className={`w-full text-left px-5 py-3 text-[10px] font-black uppercase border-b border-slate-50 flex justify-between items-center
                      ${selectedIndex === index ? 'bg-slate-100 text-[#00B4D8]' : 'hover:bg-slate-50'}`}
                    onClick={() => { setBusqueda(cliente.nombre_cliente); setFiltroClienteId(cliente.id?.toString() || ""); setSelectedIndex(-1); }}
                  >
                    <span>{cliente.nombre_cliente}</span>
                    <span className="text-[8px] text-slate-300">SELECCIONAR</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FILA INFERIOR: FILTROS ADICIONALES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          
          {/* 1. FILTRO DE TIPO DE DOCUMENTO */}
          <div className="relative">
            <select 
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-[10px] font-black uppercase outline-none focus:border-[#00B4D8] appearance-none"
              value={filtroTipoDoc}
              onChange={(e) => setFiltroTipoDoc(e.target.value)}
            >
              <option value="TODOS">CUALQUIER DOCUMENTO</option>
              <option value="FACTURA">SOLO FACTURAS </option>
              <option value="BOLETA">SOLO BOLETAS</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* 2. FILTRO DE ESTADO DE PAGO */}
          <div className="relative">
            <select 
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-[10px] font-black uppercase outline-none focus:border-[#00B4D8] appearance-none"
              value={filtroEstadoPago}
              onChange={(e) => setFiltroEstadoPago(e.target.value)}
            >
              <option value="TODOS">TODOS LOS ESTADOS</option>
              <option value="TOTAL">CANCELADO TOTAL (VERDE)</option>
              <option value="PARCIAL">PAGO PARCIAL (NARANJA)</option>
              <option value="PENDIENTE">PENDIENTE DE PAGO (ROJO)</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* 3. FILTRO DE FECHA EXACTA */}
          <div className="relative">
            <input 
              type="date" 
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-[10px] font-black uppercase outline-none focus:border-[#00B4D8]"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
            />
          </div>

          {/* 4. BOTÓN LIMPIAR FILTROS */}
          <button 
            onClick={() => {
              setFiltroTipoDoc('TODOS');
              setFiltroEstadoPago('TODOS');
              setFiltroFecha('');
              setBusqueda('');
              setFiltroClienteId('');
            }}
            className="bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all text-[10px] font-black uppercase tracking-widest py-3"
          >
            Limpiar Filtros
          </button>
        </div>

      </div>

      {/* LISTADO DE ACTIVIDAD (MUESTRA TODO SI BUSQUEDA ESTÁ VACÍA) */}
      <div className="space-y-6">
  {loading ? (
    <div className="bg-white p-24 flex flex-col items-center border border-slate-200 shadow-sm">
      <Loader2 className="animate-spin text-[#00B4D8] mb-4" size={40}/>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando cuentas...</p>
    </div>
  ) : datosFiltrados.length > 0 ? (
    datosFiltrados.map((item, idx) => {
      const abonos = item.pagos || [];
      const abonadoTotal = abonos.reduce((acc: number, p: any) => acc + (p.monto_pagado || 0), 0) || 0;
      const saldo = item.monto - abonadoTotal;

      return (
        <details key={idx} className="group bg-white border border-slate-200 shadow-sm overflow-hidden mb-4 transition-all">
          {/* CABECERA INTEGRADA */}
          <summary className="list-none cursor-pointer flex flex-col md:flex-row items-stretch outline-none">
            <div className={`w-full md:w-2 ${saldo <= 0 ? 'bg-emerald-500' : 'bg-[#00B4D8]'}`}></div>
            
            <div className="flex-1 p-6 flex flex-col md:flex-row justify-between items-center gap-6 hover:bg-slate-50 transition-colors">
              <div className="text-left flex-1">
                {/* CABECERA INTEGRADA CON ALERTAS DE DOCUMENTO Y ESTADO */}
<div className="flex items-center gap-3 mb-2">
  {/* IDENTIFICADOR DEL REGISTRO */}
  <span className="text-[10px] font-black bg-[#1e293b] text-white px-2 py-0.5 font-mono uppercase">
    {item.tipo}: {String(item.id).padStart(4, '0')}
  </span>

  {/* ALERTA DE TIPO DE DOCUMENTO (Basado en el monto >= 700) */}
  <span className={`text-[10px] font-black px-2 py-0.5 shadow-sm border ${
    item.monto >= 700 
      ? 'bg-purple-600 text-white border-purple-700' 
      : 'bg-slate-500 text-white border-slate-600'
    }`}>
    {item.monto >= 700 ? 'FACTURA' : 'BOLETA'}
  </span>

  {/* ALERTA DE ESTADO DE PAGO DINÁMICA */}
  {saldo <= 0 ? (
    <span className="text-[10px] font-black px-2 py-0.5 border shadow-sm border-emerald-500 text-emerald-600 bg-emerald-50">
      CANCELADO TOTAL
    </span>
  ) : abonadoTotal > 0 ? (
    <span className="text-[10px] font-black px-2 py-0.5 border shadow-sm border-orange-400 text-orange-600 bg-orange-50 animate-pulse">
      PAGO PARCIAL (DEBE S/ {saldo.toFixed(2)})
    </span>
  ) : (
    <span className="text-[10px] font-black px-2 py-0.5 border shadow-sm border-red-400 text-red-600 bg-red-50 animate-pulse">
      PENDIENTE DE PAGO
    </span>
  )}
</div>
                <h4 className="text-[15px] font-black text-[#1e293b] uppercase tracking-tighter italic">
                  {clientes.find(c => c.id === item.cliente_id)?.nombre_cliente || 'Cliente no identificado'}
                </h4>
                <p className="text-[11px] text-slate-400 font-bold uppercase mt-1">
                  REGISTRO: {item.fecha.toLocaleDateString()}
                </p>
              </div>

              {/* DATOS ECONÓMICOS PUNTO MEDIO */}
              <div className="grid grid-cols-3 gap-8 items-center border-l border-slate-100 pl-8 text-right">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Total</p>
                  <p className="text-[14px] font-black text-slate-700 font-mono">S/ {item.monto.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-500 uppercase">Abonado</p>
                  <p className="text-[14px] font-black text-emerald-600 font-mono">S/ {abonadoTotal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-red-400 uppercase">Saldo</p>
                  <p className={`text-[14px] font-black font-mono ${saldo > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {saldo > 0 ? `S/ ${saldo.toFixed(2)}` : 'S/ 0.00'}
                  </p>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN LADO A LADO */}
              <div className="flex gap-3 items-center">
                <button 
                  onClick={(e) => { e.preventDefault(); setItemSeleccionado(item); }} 
                  className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] text-white hover:bg-[#00B4D8] transition-all group shadow-sm"
                >
                  <History size={16} className="text-[#00B4D8]" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Historial</span>
                </button>

                {/* BOTÓN ABONAR (Solo Pagar) */}
{saldo > 0 && (
  <button 
    onClick={(e) => { 
      e.preventDefault(); 
      setItemParaPagar(item); 
      setPagoAEditar(null); // <--- IMPORTANTE: null significa que es un PAGO NUEVO
      setMontoAbono(""); 
      setShowPagoModal(true);
      
      const cli = clientes.find(c => c.id === item.cliente_id);
      setDatosEdicionCliente({
        nombre: cli?.nombre_cliente || "",
        direccion: cli?.direccion || "",
        dni_ruc: cli?.dni || "", // <--- CAMBIA cli?.dni_ruc POR cli?.dni
        email: cli?.email || "",
        telefono: cli?.telefono || ""
      });
    }}
    className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 text-[10px] font-black uppercase hover:bg-slate-900 transition-all shadow-md"
  >
    <DollarSign size={14}/> 
    <span>Pagar</span>
  </button>
)}
                <div className="bg-slate-100 p-2 text-slate-400 group-open:rotate-180 transition-transform">
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>
          </summary>

          {/* CUADROS DE PAGOS (VISIBLES AL DESPLEGAR) */}
          <div className="bg-slate-50 border-t border-slate-100 p-6 animate-in slide-in-from-top-2 duration-300">
            <h5 className="text-[13px] font-black text-[#1e293b] uppercase tracking-widest mb-6 flex items-center gap-2">
              <History size={18} className="text-[#00B4D8]"/> Registro de Abonos Realizados
            </h5>

            {abonos.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {abonos.map((p: any, pIdx: number) => (
  <div key={pIdx} className="w-60 bg-white border-2 border-slate-200 p-4 shadow-md hover:border-[#00B4D8] transition-all group/card relative flex flex-col justify-between">
    <div>
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2 rounded-sm ${item.monto >= 700 ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
          <DollarSign size={18} />
        </div>
        {/* ETIQUETA DE DOCUMENTO */}
        <span className={`text-[11px] font-black px-3 py-1 uppercase rounded-sm shadow-sm ${item.monto >= 700 ? 'bg-purple-600 text-white' : 'bg-[#1e293b] text-white'}`}>
          {item.monto >= 700 ? 'FACTURA' : 'BOLETA'}
        </span>
      </div>
      
      <p className="text-[16px] font-black text-[#1e293b] font-mono leading-none">S/ {p.monto_pagado.toFixed(2)}</p>
      <p className="text-[11px] text-slate-500 font-bold uppercase mt-2 border-t pt-2">
        REGISTRO: {new Date(p.fecha_pago).toLocaleDateString()}
      </p>
    </div>

    {/* NUEVOS BOTONES DE ACCIÓN (Imprimir, Editar, Borrar) */}
    <div className="flex gap-2 justify-between border-t border-slate-100 pt-3 mt-3">
      {/* BOTÓN IMPRIMIR */}
      <button 
        onClick={(e) => {
          e.preventDefault(); 
          setComprobanteImprimir({ ...p, cotizacion: item, cliente: clientes.find(c => c.id === item.cliente_id) });
        }}
        className="flex-1 bg-slate-50 hover:bg-blue-50 text-[#00B4D8] py-2 flex flex-col items-center justify-center gap-1 transition-all shadow-sm border border-slate-200"
      >
        <Printer size={14} />
        <span className="text-[9px] font-black uppercase tracking-widest">Doc</span>
      </button>

      {/* BOTÓN EDITAR */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          handleEditarAbono(p, item);
        }}
        className="flex-1 bg-slate-50 hover:bg-amber-50 text-amber-500 py-2 flex flex-col items-center justify-center gap-1 transition-all shadow-sm border border-slate-200"
      >
        <Edit3 size={14} />
        <span className="text-[9px] font-black uppercase tracking-widest">Editar</span>
      </button>

      {/* BOTÓN BORRAR */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          handleEliminarAbono(p.id);
        }}
        className="flex-1 bg-slate-50 hover:bg-red-50 text-red-500 py-2 flex flex-col items-center justify-center gap-1 transition-all shadow-sm border border-slate-200"
      >
        <Trash2 size={14} />
        <span className="text-[9px] font-black uppercase tracking-widest">Borrar</span>
      </button>
    </div>
  </div>
))}
              </div>
            ) : (
              <p className="text-[12px] font-black text-slate-400 uppercase text-center py-4 italic border-2 border-dashed">Pendiente de primer abono</p>
            )}
          </div>
        </details>
      );
    })
  ) : (
    <div className="p-32 text-center bg-white border border-dashed border-slate-300 opacity-50">
      <LayoutGrid size={48} className="mx-auto text-slate-200 mb-4" />
      <p className="text-slate-400 font-black uppercase text-[11px] tracking-[0.4em]">Sin movimientos registrados</p>
    </div>
  )}
</div>

      {/* MODAL DE ABONO */}
      {showPagoModal && (
  <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
    <div className="bg-white w-full max-w-md shadow-2xl border-b-8 border-[#1e293b] overflow-hidden">
      
      {/* TÍTULO DINÁMICO */}
      <div className={`p-6 text-white flex justify-between items-center ${pagoAEditar ? 'bg-amber-500' : 'bg-emerald-500'}`}>
        <h3 className="font-black uppercase tracking-tighter italic flex items-center gap-2 text-sm">
          {pagoAEditar ? <Edit3 size={18}/> : <DollarSign size={18}/>}
          {pagoAEditar ? 'Modificar Registro de Pago' : 'Registrar Nuevo Pago'}
        </h3>
        <button onClick={() => setShowPagoModal(false)}><X size={24}/></button>
      </div>
      
      <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
  {/* SECCIÓN DATOS CLIENTE DENTRO DEL MODAL */}
<div className="grid grid-cols-1 gap-3 border-b pb-4 mb-4">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        Identificación y Contacto
    </p>
    <input 
        className="w-full bg-slate-50 border p-2 text-xs font-bold uppercase" 
        placeholder="NOMBRE / PROPIETARIO"
        value={datosEdicionCliente.nombre}
        onChange={e => setDatosEdicionCliente({...datosEdicionCliente, nombre: e.target.value})}
    />
    <div className="grid grid-cols-2 gap-2">
        <input 
            className="w-full bg-slate-50 border p-2 text-xs font-mono" 
            placeholder="RUC / DNI"
            value={datosEdicionCliente.dni_ruc}
            onChange={e => setDatosEdicionCliente({...datosEdicionCliente, dni_ruc: e.target.value})}
        />
        <input 
            className="w-full bg-slate-50 border p-2 text-xs font-mono" 
            placeholder="TELÉFONO"
            value={datosEdicionCliente.telefono}
            onChange={e => setDatosEdicionCliente({...datosEdicionCliente, telefono: e.target.value})}
        />
    </div>
    {/* NUEVO CAMPO GMAIL */}
    <div className="relative">
        <input 
            className="w-full bg-slate-50 border p-2 text-xs font-mono lowercase pl-8" 
            placeholder="correo@gmail.com"
            value={datosEdicionCliente.email}
            onChange={e => setDatosEdicionCliente({...datosEdicionCliente, email: e.target.value})}
        />
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
            <span className="text-[10px] font-bold text-[#00B4D8]">@</span>
        </div>
    </div>
    <input 
        className="w-full bg-slate-50 border p-2 text-[10px] font-bold uppercase" 
        placeholder="DIRECCIÓN DE OBRA / DOMICILIO"
        value={datosEdicionCliente.direccion}
        onChange={e => setDatosEdicionCliente({...datosEdicionCliente, direccion: e.target.value})}
    />
</div>
  {/* ... (Identificación y Contacto termina aquí) */}

    {/* SECCIÓN MONTO ÚNICA */}
<div className="pt-4 border-t border-slate-100">
  
  {/* CALCULADORA DE IGV (Solo para Facturas) */}
  {Number(itemParaPagar?.monto) >= 700 && (
    <div className="bg-purple-50 p-4 border border-purple-100 mb-4 animate-in slide-in-from-top-2">
      <p className="text-[10px] font-black text-purple-700 uppercase mb-3 tracking-widest flex items-center gap-2">
        <Calculator size={14}/> Asistente de Facturación (IGV 18%)
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button 
          type="button"
          onClick={() => {
            const valor = Number(montoAbono);
            if (valor > 0) setMontoAbono((valor * 1.18).toFixed(2));
          }}
          className="bg-white border-2 border-purple-200 text-[10px] font-black py-2.5 hover:bg-purple-600 hover:text-white transition-all uppercase shadow-sm"
        >
          + Añadir IGV
        </button>
        <button 
          type="button"
          onClick={() => {
            const valor = Number(montoAbono);
            if (valor > 0) setMontoAbono((valor / 1.18).toFixed(2));
          }}
          className="bg-white border-2 border-purple-200 text-[10px] font-black py-2.5 hover:bg-purple-600 hover:text-white transition-all uppercase shadow-sm"
        >
          Desglosar IGV
        </button>
      </div>
    </div>
  )}

  {/* ELIMINA CUALQUIER OTRO INPUT Y DEJA SOLO ESTE */}
</div>


{/* IMPORTANTE: Borra cualquier bloque de código que diga "SECCIÓN MONTO" que esté debajo de esto */}

    {/* SECCIÓN MÉTODO DE PAGO */}
    <div className="mt-4">
      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Método de Operación</label>
      <select 
        className="w-full bg-slate-50 border-2 border-slate-200 p-3 text-[12px] font-black uppercase outline-none focus:border-[#1e293b]" 
        value={metodoPago} 
        onChange={(e) => setMetodoPago(e.target.value)}
      >
        <option value="Transferencia">Transferencia Bancaria</option>
        <option value="Efectivo">Efectivo / Caja</option>
        <option value="Yape / Plin">Yape / Plin</option>
        <option value="Tarjeta">Tarjeta Débito/Crédito</option>
      </select>
    </div>

{/* ... (Botón Final GUARDAR CAMBIOS TOTALES viene aquí) */}
  {/* SECCIÓN MONTO */}
  <div>
    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
      {pagoAEditar ? "Modificar Monto Pagado" : "Registrar Monto a Pagar"}
    </label>
    <input 
      type="number" 
      className="w-full bg-slate-50 border-2 border-slate-200 p-3 text-xl font-black font-mono outline-none focus:border-[#1e293b]" 
      value={montoAbono} 
      onChange={(e) => setMontoAbono(e.target.value)} 
    />
  </div>

  {/* BOTÓN FINAL */}
  <button 
    onClick={confirmarAbono}
    className={`w-full text-white py-4 font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${pagoAEditar ? 'bg-amber-600' : 'bg-emerald-600'}`}
  >
    {pagoAEditar ? <Edit3 size={18} /> : <CheckCircle2 size={18} />}
    {pagoAEditar ? 'GUARDAR CAMBIOS TOTALES' : 'CONFIRMAR PAGO'}
  </button>
</div>
    </div>
  </div>
)}

      {/* COMPROBANTE DE PAGO DINÁMICO: BOLETA (ESTILO WARI) / FACTURA (CON IGV) */}
{comprobanteImprimir && (
  <div className="fixed inset-0 z-[3000] bg-slate-900/90 flex items-start justify-center p-2 md:p-4 overflow-y-auto backdrop-blur-sm">
    <div className="flex flex-col gap-10 my-10 print:my-0">
      {(() => {
        const esFactura = comprobanteImprimir.cotizacion.monto >= 700;
        
        // 1. Aplanamos ítems (Cotización o Proyecto)
        let todosLosItems: any[] = [];
        if (comprobanteImprimir.cotizacion.tipo === 'COTIZACIÓN') {
          comprobanteImprimir.cotizacion.detalles?.forEach((g: any) => {
            if (g.items) todosLosItems.push(...g.items);
          });
        } else {
          todosLosItems = comprobanteImprimir.cotizacion.detalles?.lista_salidas || [];
        }

        // 2. Paginación (20 ítems por hoja)
        const itemsPorPagina = 28;
        const paginas = [];
        for (let i = 0; i < todosLosItems.length; i += itemsPorPagina) {
          paginas.push(todosLosItems.slice(i, i + itemsPorPagina));
        }
        if (paginas.length === 0) paginas.push([]);

        // 3. Cálculos de Factura (IGV 18%)
        const totalFinal = comprobanteImprimir.cotizacion.monto;
        const subtotal = totalFinal / 1.18;
        const igv = totalFinal - subtotal;

        return paginas.map((itemsPagina, index) => (
          <div key={index} className="bg-white w-[595px] h-[842px] shrink-0 p-8 shadow-2xl relative flex flex-col font-sans text-black border border-slate-300 hoja-imprimible overflow-hidden print:border-none print:shadow-none print:p-8">
            
            {index === 0 && (
              <button onClick={() => setComprobanteImprimir(null)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 print:hidden"><X size={32}/></button>
            )}

            {/* ENCABEZADO COMPACTO - SIN FECHA (PARA EVITAR DUPLICADOS) */}
<div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-4">
  <div className="text-left flex-1">
    <h1 className="text-2xl font-black tracking-tighter text-[#1e293b] leading-none">
      ECO SISTEMAS <span className="text-[#00B4D8]">URH</span>
    </h1>
    <p className="text-[8px] font-black text-slate-600 leading-tight mt-1 uppercase tracking-tighter">
      SERVICIOS DE INGENIERÍA Y RIEGO E.I.R.L.
    </p>
    <div className="text-[8px] text-slate-400 mt-2 space-y-0.5 font-bold leading-none">
      <p>Mz A LT 9 A.V NUEVA GALES CIENEGUILLA</p>
      <p>Telf.: 998-270-102 / 985-832-096</p>
    </div>
  </div>

  {/* SOLO EL RECUADRO DEL RUC */}
  <div className="border-[3px] border-[#1e293b] w-52 text-center overflow-hidden bg-white">
    <p className="text-[11px] font-black py-0.5 tracking-widest border-b border-[#1e293b]">
      R.U.C. 20603415121
    </p>
    <div className="bg-[#1e293b] text-white py-1 font-black text-[10px] uppercase tracking-widest">
      {comprobanteImprimir.cotizacion.monto >= 700 ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA'}
    </div>
    <p className="text-[13px] font-black py-0.5 font-mono tracking-tighter">
      {comprobanteImprimir.cotizacion.monto >= 700 ? 'F001' : 'B001'} - {String(comprobanteImprimir.cotizacion.id).padStart(6, '0')}
    </p>
  </div>
</div>
{/* SECCIÓN DE DATOS DEL CLIENTE: FILA ÚNICA SIN DUPLICADOS */}
<div className="space-y-2 mb-4 text-[11px] border-t border-slate-800 pt-3">
  {/* Fila 1: Titular y Fecha */}
  <div className="flex items-end gap-4">
    <div className="flex-1 flex gap-2">
      <span className="font-black uppercase text-[10px] shrink-0">
        {comprobanteImprimir.cotizacion.monto >= 700 ? 'PROPIETARIO:' : 'Sr.(es):'}
      </span>
      <span className="flex-1 border-b border-dotted border-slate-400 text-[11px] font-bold uppercase pb-0.5">
        {comprobanteImprimir.cliente?.nombre_cliente}
      </span>
    </div>

    {/* Bloque de Fecha */}
    {(() => {
      const d = new Date(comprobanteImprimir.fecha_pago);
      return (
        <div className="flex border-2 border-[#1e293b] text-center overflow-hidden bg-white shrink-0 mb-1">
          <div className="border-r-2 border-[#1e293b]">
            <p className="bg-[#1e293b] text-white text-[6px] font-black px-2 py-0.5 uppercase leading-none">Día</p>
            <p className="text-[10px] font-black py-0.5 px-2">{String(d.getDate()).padStart(2, '0')}</p>
          </div>
          <div className="border-r-2 border-[#1e293b]">
            <p className="bg-[#1e293b] text-white text-[6px] font-black px-2 py-0.5 uppercase leading-none">Mes</p>
            <p className="text-[10px] font-black py-0.5 px-2">{String(d.getMonth() + 1).padStart(2, '0')}</p>
          </div>
          <div>
            <p className="bg-[#1e293b] text-white text-[6px] font-black px-2 py-0.5 uppercase leading-none">Año</p>
            <p className="text-[10px] font-black py-0.5 px-2">{d.getFullYear()}</p>
          </div>
        </div>
      );
    })()}
  </div>
  
  {/* Fila 2: Dirección, Telf y RUC (Todo en una sola línea) */}
  <div className="flex justify-between items-center w-full gap-4">
    {/* Dirección */}
    <div className="flex flex-1 gap-1 overflow-hidden">
      <span className="font-black uppercase text-[9px] shrink-0 text-slate-500">Dirección:</span>
      <span className="text-[9px] font-bold uppercase truncate border-b border-dotted border-slate-300 flex-1 pb-0.5">
        {comprobanteImprimir.cliente?.direccion || '---'}
      </span>
    </div>
    
    <div className="flex gap-4 shrink-0 items-center">
      {/* Teléfono */}
      {comprobanteImprimir.cotizacion.monto >= 700 && (
        <div className="flex gap-1">
          <span className="font-black uppercase text-[9px] text-slate-500">TELF:</span>
          <span className="text-[9px] font-mono font-bold border-b border-dotted border-slate-300">{comprobanteImprimir.cliente?.telefono || '---'}</span>
        </div>
      )}

      {/* RUC / DNI */}
      <div className="flex gap-1 bg-slate-50 px-2 py-0.5 border border-slate-200 rounded-sm">
        <span className="font-black uppercase text-[9px] text-[#1e293b]">
          {comprobanteImprimir.cotizacion.monto >= 700 ? 'R.U.C.:' : 'D.N.I.:'}
        </span>
        <span className="text-[9px] font-mono font-black text-[#00B4D8]">
          {comprobanteImprimir.cliente?.dni || '---'}
        </span>
      </div>
    </div>
  </div>
</div>
            

            {/* TABLA DE PRODUCTOS */}
            <div className="flex-1 border-2 border-slate-800 rounded-lg overflow-hidden mb-2 flex flex-col">
  <table className="w-full text-[9px] border-collapse"> {/* Fuente reducida a 9px */}
    <thead>
      <tr className="bg-slate-800 text-white font-black uppercase text-[8px]">
        <th className="py-1 px-2 border-r border-white w-10">CANT.</th>
        <th className="py-1 px-2 border-r border-white text-left">DESCRIPCION</th>
        <th className="py-1 px-2 border-r border-white w-20 text-right">P. UNIT.</th>
        <th className="py-1 px-2 w-20 text-right">IMPORTE</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-200">
      {itemsPagina.map((mat: any, i: number) => {
        const precio = Number(mat.precioUnit || mat.precio || 0);
        const cantidad = Number(mat.cantidad || 0);
        return (
          <tr key={i} className="h-6"> {/* Altura de fila reducida */}
            <td className="text-center font-bold border-r border-slate-200">{cantidad}</td>
            <td className="px-2 uppercase font-medium border-r border-slate-200 truncate max-w-[300px]">
              {mat.producto || mat.descripcion}
            </td>
            <td className="text-right px-2 border-r border-slate-200">{precio.toFixed(2)}</td>
            <td className="text-right px-2 font-black">{(cantidad * precio).toFixed(2)}</td>
          </tr>
        );
      })}
      {/* Relleno de filas vacías más delgadas */}
      {Array.from({ length: itemsPorPagina - itemsPagina.length }).map((_, i) => (
        <tr key={`empty-${i}`} className="h-6">
          <td className="border-r border-slate-200"></td>
          <td className="border-r border-slate-200"></td>
          <td className="border-r border-slate-200"></td>
          <td></td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

            {/* PIE DE PÁGINA (DESGLOSE SOLO SI ES FACTURA) */}
            {index === paginas.length - 1 ? (
              <div className="flex justify-between items-end mt-4">
                <div className="flex flex-col gap-1">
                  <div className="italic text-[10px] font-bold text-slate-400">"Gracias por su preferencia"</div>
                  <div className="bg-emerald-50 border-l-4 border-emerald-500 p-2 mt-2">
                    <p className="text-[9px] font-black text-emerald-700 uppercase">Abono hoy:</p>
                    <p className="text-[16px] font-black text-emerald-800 font-mono">S/ {comprobanteImprimir.monto_pagado.toFixed(2)}</p>
                    <p className="text-[8px] font-bold text-emerald-600 uppercase italic">Vía: {comprobanteImprimir.metodo}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 w-64">
                  {esFactura && (
                    <>
                      <div className="flex justify-between w-full text-[11px] font-bold border-b border-slate-100 py-1">
                        <span>SUBTOTAL S/</span>
                        <span className="font-mono">{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between w-full text-[11px] font-bold border-b border-slate-100 py-1">
                        <span>I.G.V. (18%) S/</span>
                        <span className="font-mono">{igv.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center w-full bg-[#1e293b] text-white p-2 mt-1">
                    <span className="text-[10px] font-black uppercase">TOTAL S/</span>
                    <span className="text-xl font-black font-mono">{totalFinal.toFixed(2)}</span>
                  </div>

                  {/* SALDO PENDIENTE */}
                  {(() => {
  const abonadoTotal = comprobanteImprimir.cotizacion.pagos?.reduce((a: any, b: any) => a + (b.monto_pagado || 0), 0) || 0;
  const saldoRestante = comprobanteImprimir.cotizacion.monto - abonadoTotal;

  // 1. VERDE: Pagado Total (saldo 0)
  if (saldoRestante <= 0.01) {
    return (
      <div className="flex justify-center items-center w-full border-2 border-emerald-500 bg-emerald-50 p-1 mt-1 text-emerald-600">
        <span className="text-[10px] font-black uppercase tracking-widest">¡CANCELADO TOTAL!</span>
      </div>
    );
  } 
  // 2. NARANJA: Pago Parcial (hay abonos, pero falta saldo)
  else if (abonadoTotal > 0) {
    return (
      <div className="flex justify-between items-center w-full border-2 border-orange-400 bg-orange-50 p-1 mt-1 text-orange-600">
        <span className="text-[9px] font-black px-1 uppercase">Pago Parcial - Saldo Restante</span>
        <span className="font-black font-mono">S/ {saldoRestante.toFixed(2)}</span>
      </div>
    );
  } 
  // 3. ROJO: Pendiente (no hay abonos registrados)
  else {
    return (
      <div className="flex justify-between items-center w-full border-2 border-red-500 bg-red-50 p-1 mt-1 text-red-600">
        <span className="text-[9px] font-black px-1 uppercase">Pendiente de Pago Total</span>
        <span className="font-black font-mono">S/ {saldoRestante.toFixed(2)}</span>
      </div>
    );
  }
})()}
                </div>
              </div>
            ) : (
              <div className="text-right text-[10px] font-black uppercase text-slate-400">Continúa en la siguiente página...</div>
            )}

            <div className="absolute bottom-4 left-10 text-[8px] font-bold text-slate-300 uppercase">Página {index + 1} de {paginas.length}</div>
          </div>
        ))
      })()}
      
      <button onClick={() => window.print()} className="bg-[#1e293b] text-white py-5 px-10 font-black uppercase text-sm flex items-center gap-4 justify-center hover:bg-[#00B4D8] transition-all print:hidden shadow-2xl sticky bottom-4">
        <Printer size={20}/> IMPRIMIR DOCUMENTOS
      </button>
    </div>
  </div>
)}


      {/* MODAL DE LIQUIDACIÓN TÉCNICA (VENTANA FLOTANTE GRANDE) */}
{itemSeleccionado && (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
    <div className="bg-white w-full max-w-6xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border-l-[12px] border-[#1e293b]">
      
      {/* CABECERA */}
      <div className="p-6 bg-[#1e293b] text-white flex justify-between items-center">
        <div className="flex items-center gap-4">
          <History size={24} className="text-[#00B4D8]" />
          <div>
            <h3 className="text-xl font-black uppercase italic">Historial Detallado de Movimientos</h3>
            <p className="text-[10px] font-bold text-[#00B4D8] uppercase">{clientes.find(c => c.id === itemSeleccionado.cliente_id)?.nombre_cliente}</p>
          </div>
        </div>
        <button onClick={() => setItemSeleccionado(null)} className="hover:rotate-90 transition-transform"><X size={32} /></button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* COLUMNA IZQUIERDA: RESUMEN FINANCIERO - LIMPIA */}
<div className="w-1/3 bg-slate-50 p-8 border-r flex flex-col gap-4 overflow-y-auto">
  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Resumen Financiero</h4>
  
  <div className="bg-white p-6 border-b-4 border-[#1e293b] shadow-sm">
    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Monto de Insumos</span>
    <span className="text-2xl font-black text-[#1e293b] font-mono">S/ {Number(itemSeleccionado.monto).toFixed(2)}</span>
  </div>

  <div className="bg-white p-6 border-b-4 border-emerald-500 shadow-sm">
    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Total Abonado</span>
    <span className="text-2xl font-black text-emerald-600 font-mono">
      S/ {(itemSeleccionado.pagos?.reduce((acc: any, p: any) => acc + p.monto_pagado, 0) || 0).toFixed(2)}
    </span>
  </div>

  <div className="bg-white p-6 border-b-4 border-red-500 shadow-sm">
    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Saldo Pendiente</span>
    <span className="text-2xl font-black text-red-600 font-mono">
      S/ {(itemSeleccionado.monto - (itemSeleccionado.pagos?.reduce((acc: any, p: any) => acc + p.monto_pagado, 0) || 0)).toFixed(2)}
    </span>
  </div>

  <div className="bg-[#1e293b] p-6 shadow-sm">
    <span className="text-[10px] font-black text-[#00B4D8] uppercase block mb-1 italic">Crédito Retorno</span>
    <span className="text-2xl font-black text-white font-mono">S/ {Number(itemSeleccionado.detalles?.devoluciones || 0).toFixed(2)}</span>
  </div>
</div>

        {/* COLUMNA DERECHA DENTRO DEL MODAL GRANDE */}
<div className="w-2/3 p-8 overflow-y-auto bg-white">
  <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b-2 pb-2 flex items-center gap-2">
    <LayoutGrid size={16}/> Registro Detallado de Comprobantes
  </h4>
  
  <div className="grid grid-cols-2 gap-6">
    {itemSeleccionado.pagos?.map((p: any, i: number) => (
      <div key={i} className="border-2 border-slate-100 p-5 flex flex-col justify-between hover:border-[#00B4D8] transition-colors bg-slate-50/30 rounded-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[10px] font-black text-emerald-500 uppercase block mb-1">Pago Confirmado</span>
            <p className="text-xl font-black font-mono text-[#1e293b]">S/ {p.monto_pagado.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black bg-[#1e293b] text-white px-2 py-1 uppercase rounded-sm">
              {itemSeleccionado.monto >= 700 ? 'FACTURA' : 'BOLETA'}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-[11px] text-slate-500 font-bold border-t border-slate-200 pt-3 mb-4 uppercase italic">
          <span>Fecha: {new Date(p.fecha_pago).toLocaleDateString()}</span>
          <span className="text-[#00B4D8] font-black">{p.metodo || 'EFECTIVO'}</span>
        </div>

        {/* ACCIONES DEL RECIBO (PUNTO MEDIO) */}
        <div className="flex gap-2 justify-between border-t pt-3">
          {/* BOTÓN IMPRIMIR (DOC) */}
          <button 
            onClick={() => setComprobanteImprimir({ ...p, cotizacion: itemSeleccionado, cliente: clientes.find(c => c.id === itemSeleccionado.cliente_id) })}
            className="flex-1 bg-white border border-slate-200 py-2.5 flex flex-col items-center justify-center gap-1 text-[#00B4D8] hover:bg-blue-50 transition-all shadow-sm active:scale-95"
          >
            <Printer size={18} />
            <span className="text-[10px] font-black uppercase">Doc</span>
          </button>

          {/* BOTÓN EDITAR */}
          <button 
  onClick={() => {
    // p = el pago individual, itemSeleccionado = la cotización dueña
    handleEditarAbono(p, itemSeleccionado);
  }}
  className="flex-1 bg-white border border-slate-200 py-2.5 flex flex-col items-center justify-center gap-1 text-amber-500 hover:bg-amber-50 transition-all shadow-sm active:scale-95"
>
  <Edit3 size={18} />
  <span className="text-[9px] font-black uppercase">Editar</span>
</button>

          {/* BOTÓN BORRAR */}
          <button 
            onClick={() => handleEliminarAbono(p.id)}
            className="flex-1 bg-white border border-slate-200 py-2.5 flex flex-col items-center justify-center gap-1 text-red-500 hover:bg-red-50 transition-all shadow-sm active:scale-95"
          >
            <Trash2 size={18} />
            <span className="text-[10px] font-black uppercase">Borrar</span>
          </button>
        </div>
      </div>
    ))}
  </div>
</div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};