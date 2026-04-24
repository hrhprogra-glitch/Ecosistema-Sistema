import { useState, useEffect } from 'react';
import { supabase } from './db/supabase';

import Topbar from './layout/Topbar';
import Sidebar from './layout/Sidebar';

// IMPORTACIÓN DE TUS 5 CARPETAS REALES
import DashboardSession from './sesiones/dashboard';
import MovimientosSession from './sesiones/movimientos';
import AlmacenSession from './sesiones/almacen';
import HistorialSession from './sesiones/historial';
import PersonalSession from './sesiones/personal';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ORQUESTADOR EXACTO PARA ALMACÉN
  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':   return <DashboardSession />;
      case 'movimientos': return <MovimientosSession />;
      case 'almacen':     return <AlmacenSession />;
      case 'historial':   return <HistorialSession />;
      case 'personal':    return <PersonalSession />;
      default:            return <DashboardSession />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-eco-blanco flex items-center justify-center">
        <div className="text-eco-oscuro font-bold uppercase tracking-tighter animate-pulse">
          Cargando Ecosistema...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-eco-blanco flex flex-col font-sans selection:bg-eco-azul/30">
      <Topbar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        userEmail={user?.email || "Invitado@ecosistema.com"}
        onLogout={() => supabase.auth.signOut()}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen} 
          currentTab={currentTab} 
          setCurrentTab={setCurrentTab} 
        />

        <main className="flex-1 overflow-y-auto bg-eco-blanco p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}