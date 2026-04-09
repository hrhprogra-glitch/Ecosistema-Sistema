// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authAdminService } from './services/supabase';
import { Loader2 } from 'lucide-react';
import { LoginSection } from './sections/LoginSection';
import { AdminDashboard } from './sections/AdminDashboard';
import { EmpleadoDashboard } from './sections/empleado/EmpleadoDashboard'; // Importamos el nuevo Panel Restringido
import './index.css';

// --- COMPONENTE DE ALTA SEGURIDAD (GUARDIÁN DE RUTAS) ---
const RutaProtegidaAdmin = ({ children }: { children: React.ReactNode }) => {
  const [verificando, setVerificando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    const validarAcceso = async () => {
      try {
        // 1. Verificación Criptográfica (Supabase JWT)
        const session = await authAdminService.obtenerSesionActual();
        
        // 2. Verificación de Rol Local
        const localData = localStorage.getItem('userSession');
        const userLocal = localData ? JSON.parse(localData) : null;

        // Alto Contraste: Solo si el servidor aprueba el token Y es admin, entra.
        if (session && userLocal?.rol === 'admin') {
          setAutorizado(true);
        } else {
          setAutorizado(false);
        }
      } catch (error) {
        console.error("Brecha detectada:", error);
        setAutorizado(false);
      } finally {
        setVerificando(false);
      }
    };
    validarAcceso();
  }, []);

  // Pantalla de "Suavizado" mientras se desencripta el acceso
  if (verificando) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#00B4D8] mb-4" size={48} />
        <p className="text-[#00B4D8] font-black tracking-[0.3em] uppercase text-[12px]">Verificando Credenciales Seguras...</p>
      </div>
    );
  }

  // Si no está autorizado, lo expulsa al inicio (Login)
  return autorizado ? <>{children}</> : <Navigate to="/" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Login (Inicio) */}
        <Route path="/" element={<LoginSection />} />

        {/* Ruta Blindada para Administradores Globales */}
        <Route path="/admin" element={
          <RutaProtegidaAdmin>
            <AdminDashboard />
          </RutaProtegidaAdmin>
        } />
        
        {/* Ruta Restringida para Trabajadores/Operarios */}
        <Route path="/empleado" element={<EmpleadoDashboard />} />

        {/* Redirección por defecto ante rutas inexistentes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;