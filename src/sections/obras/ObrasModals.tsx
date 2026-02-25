// src/sections/obras/ObrasModals.tsx
import { X, Shield, Save, PackagePlus, DollarSign, Loader2, Users, MapPin, Calendar } from 'lucide-react';

const labelStyle = "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2";
const inputStyle = "w-full bg-white border border-slate-200 p-3 text-[13px] font-bold uppercase rounded-none outline-none focus:border-[#00B4D8] transition-all shadow-sm";

export const ObrasModal = ({ obraSeleccionada, clientes, proximoIdObra, onClose, onSave }: any) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1E293B]/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-none shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="px-8 py-5 border-b border-slate-100 bg-[#f8fafc] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#1E293B] p-2 rounded-none">
              <Shield className="text-[#00B4D8]" size={18} />
            </div>
            <h3 className="text-lg font-black text-[#1E293B] uppercase tracking-tighter italic">
              {obraSeleccionada ? 'Expediente de Proyecto' : 'Apertura de Nuevo Proyecto'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-red-500 transition-colors"><X size={20}/></button>
        </div>

        <form onSubmit={(e: any) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          onSave(Object.fromEntries(formData));
        }} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelStyle}>Identificador de Obra</label>
              <input readOnly name="codigo_obra" className={`${inputStyle} bg-slate-50 text-[#00B4D8] font-mono`} value={proximoIdObra} />
            </div>
            <div>
              <label className={labelStyle}>Titular / Cliente</label>
              <select name="cliente_id" required className={inputStyle} defaultValue={obraSeleccionada?.cliente_id || ""}>
                <option value="">-- SELECCIONAR CLIENTE --</option>
                {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nombre_cliente}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelStyle}>Ubicación / Link Maps</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input name="direccion_link" className={`${inputStyle} pl-10`} placeholder="https://maps.google.com/..." defaultValue={obraSeleccionada?.direccion_link} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelStyle}>Fecha de Inicio</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="date" name="fecha_inicio" className={`${inputStyle} pl-10`} defaultValue={obraSeleccionada?.fecha_inicio} />
              </div>
            </div>
            <div>
              <label className={labelStyle}>Estado Inicial</label>
              <select name="estado" className={inputStyle} defaultValue={obraSeleccionada?.estado || "En proceso"}>
                <option value="En proceso">En proceso</option>
                <option value="Finalizada">Finalizada</option>
                <option value="Pausada">Pausada</option>
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#1E293B] transition-all">Descartar</button>
            <button type="submit" className="bg-[#1E293B] text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#00B4D8] transition-all rounded-none shadow-[4px_4px_0px_#e2e8f0] flex items-center gap-2">
              <Save size={14} className="text-[#00B4D8]" /> {obraSeleccionada ? 'Actualizar Proyecto' : 'Confirmar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// FIX: Added 'export' to IngresarMaterialModal
export const IngresarMaterialModal = ({ obraSeleccionada, inventario, usuarios, onClose, onConfirm, procesando }: any) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#1E293B]/60 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-none shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 bg-[#f8fafc] flex justify-between items-center">
          <h3 className="text-md font-black text-[#1E293B] uppercase tracking-tighter flex items-center gap-2">
            <PackagePlus size={18} className="text-[#00B4D8]"/> Salida de Insumos
          </h3>
          <button onClick={onClose} className="text-slate-300 hover:text-red-500"><X size={20}/></button>
        </div>
        <form onSubmit={(e: any) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.target));
          const prod = inventario.find((p: any) => String(p.id) === data.producto_id);
          onConfirm(data, prod);
        }} className="p-6 space-y-5">
          <div className="bg-[#f8fafc] p-3 border border-slate-100 text-center">
            <p className={labelStyle}>Proyecto Destino</p>
            <p className="font-black text-[#1E293B] uppercase text-[12px] italic">{obraSeleccionada?.nombre_obra}</p>
          </div>
          <div>
            <label className={labelStyle}>Material en Stock</label>
            <select name="producto_id" required className={inputStyle}>
              <option value="">-- SELECCIONAR SKU --</option>
              {inventario.map((p: any) => <option key={p.id} value={p.id}>{p.producto} (STK: {p.stock_actual})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>Cantidad</label>
              <input name="cantidad" type="number" required min="1" className={`${inputStyle} text-center text-lg text-[#00B4D8]`} placeholder="0" />
            </div>
            <div>
              <label className={labelStyle}>Responsable</label>
              <select name="trabajador_id" required className={inputStyle}>
                <option value="">-- PERSONAL --</option>
                {usuarios.map((u: any) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
            </div>
          </div>
          <button disabled={procesando} className="w-full bg-[#1E293B] text-white py-4 text-[10px] font-black uppercase tracking-widest hover:bg-[#00B4D8] transition-all rounded-none shadow-[4px_4px_0px_#e2e8f0] flex justify-center items-center gap-2">
            {procesando ? <Loader2 size={16} className="animate-spin"/> : "Registrar Salida de Almacén"}
          </button>
        </form>
      </div>
    </div>
  );
};

// FIX: Added 'export' to AbonarObraModal
export const AbonarObraModal = ({ obraSeleccionada, onClose, onConfirm, procesando }: any) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#1E293B]/60 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-none shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 text-center">
        <div className="p-10 space-y-6">
          <div className="w-16 h-16 bg-[#f8fafc] border border-slate-100 flex items-center justify-center mx-auto shadow-sm">
            <DollarSign className="text-[#00B4D8]" size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#1E293B] uppercase tracking-tighter italic">Cargar Abono</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{obraSeleccionada?.codigo_obra}</p>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#1E293B]">S/</span>
            <input id="inputMonto" type="number" step="0.01" className={`${inputStyle} pl-10 text-center text-2xl font-mono text-[#00B4D8]`} placeholder="0.00" />
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#1E293B] transition-all border border-transparent">Anular</button>
            <button disabled={procesando} onClick={() => onConfirm((document.getElementById('inputMonto') as HTMLInputElement).value)} className="flex-1 bg-[#1E293B] text-white py-4 text-[10px] font-black uppercase tracking-widest hover:bg-[#00B4D8] transition-all rounded-none shadow-[4px_4px_0px_#e2e8f0]">
              {procesando ? "..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// FIX: Added 'export' to SupervisarEquipoModal
export const SupervisarEquipoModal = ({ obraSeleccionada, usuarios, onClose }: any) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#1E293B]/60 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-none shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 bg-[#f8fafc] flex justify-between items-center">
          <h3 className="text-md font-black text-[#1E293B] uppercase tracking-tighter flex items-center gap-2">
            <Users size={18} className="text-[#00B4D8]"/> Personal en Obra
          </h3>
          <button onClick={onClose} className="text-slate-300 hover:text-red-500"><X size={20}/></button>
        </div>
        <div className="p-6 space-y-4">
           <div className="text-center pb-4 border-b border-slate-100">
              <p className={labelStyle}>Proyecto Activo</p>
              <p className="font-black text-[#1E293B] uppercase text-[12px]">{obraSeleccionada?.nombre_obra}</p>
           </div>
           <div className="max-h-60 overflow-y-auto space-y-2">
              {obraSeleccionada?.trabajadores_asignados?.length > 0 ? (
                obraSeleccionada.trabajadores_asignados.map((tId: any) => {
                   const u = usuarios.find((user: any) => user.id === Number(tId));
                   return (
                      <div key={tId} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100">
                         <div className="w-8 h-8 bg-[#1E293B] flex items-center justify-center text-[10px] text-white font-black">ID</div>
                         <span className="text-[12px] font-bold text-[#1E293B] uppercase">{u?.full_name || `ID: ${tId}`}</span>
                      </div>
                   );
                })
              ) : (
                <p className="text-center py-4 text-slate-400 text-[11px] uppercase font-bold">Sin personal asignado</p>
              )}
           </div>
           <button onClick={onClose} className="w-full bg-[#1E293B] text-white py-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#00B4D8] transition-all rounded-none shadow-sm">Cerrar Expediente</button>
        </div>
      </div>
    </div>
  );
};