import { useState } from 'react';
import { ListaClientes } from './ListaClientes';
import { CotizacionesTab } from './CotizacionesTab';
import { HistorialGeneralView } from './HistorialClienteView';
import type { Cliente } from '../../services/supabase';

interface ClientesTabProps {
  subTab: 'lista' | 'cotizaciones' | 'historial';
  zoom?: number;
  setSubTab?: (tab: 'lista' | 'cotizaciones' | 'historial') => void; 
}

export const ClientesTab = ({ subTab, zoom = 100, setSubTab }: ClientesTabProps) => {
  // Estado que guardará el nombre para el buscador de la bandeja
  const [nombreParaBandeja, setNombreParaBandeja] = useState('');

  // Esta función maneja el clic en el botón "Bandeja" de la lista
  const irABandejaConFiltro = (cliente: Cliente) => {
    setNombreParaBandeja(cliente.nombre_cliente); 
    
    // Cambia la pestaña a cotizaciones en el AdminDashboard
    if (setSubTab) {
      setSubTab('cotizaciones'); 
    }
  };

  return (
    /* Eliminamos paddings extras que puedan arruinar la estética del Dashboard padre */
    <div className="w-full h-full animate-in fade-in slide-in-from-bottom-1 duration-500">
      
      {subTab === 'lista' && (
        <ListaClientes onVerHistorial={irABandejaConFiltro} />
      )}

      {subTab === 'cotizaciones' && (
        <CotizacionesTab 
          zoom={zoom} 
          filtroInicial={nombreParaBandeja} 
          onFiltroChange={setNombreParaBandeja} // <--- NUEVA LÍNEA AÑADIDA
        />
      )}

      {subTab === 'historial' && (
        <HistorialGeneralView 
          clienteInicial={null} 
          onLimpiarFiltro={() => {}} 
        />
      )}
      
    </div>
  );
};