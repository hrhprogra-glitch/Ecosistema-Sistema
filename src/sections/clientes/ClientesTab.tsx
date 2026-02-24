import { useState } from 'react';
import { ListaClientes } from './ListaClientes';
import { CotizacionesTab } from './CotizacionesTab';
import { HistorialGeneralView } from './HistorialClienteView'; // Componente que crearemos
import type { Cliente } from '../../services/supabase';

interface ClientesTabProps {
  subTab: 'lista' | 'cotizaciones' | 'historial'; // Añadimos 'historial'
  zoom?: number; 
}

export const ClientesTab = ({ subTab, zoom = 100 }: ClientesTabProps) => {
  // Mantenemos la capacidad de ir a un historial específico desde la lista
  const [clienteFiltro, setClienteFiltro] = useState<Cliente | null>(null);

  const irAHistorialEspecifico = (cliente: Cliente) => {
    setClienteFiltro(cliente);
    // Nota: El cambio de subTab a 'historial' debe ser manejado por el componente padre (AdminDashboard)
  };

  return (
    <div className="w-full h-full animate-in fade-in duration-500">
      
      {subTab === 'lista' && (
        <ListaClientes onVerHistorial={irAHistorialEspecifico} />
      )}

      {subTab === 'cotizaciones' && (
        <CotizacionesTab zoom={zoom} />
      )}

      {subTab === 'historial' && (
        <HistorialGeneralView 
          clienteInicial={clienteFiltro} 
          onLimpiarFiltro={() => setClienteFiltro(null)} 
        />
      )}
      
    </div>
  );
};