import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginSection } from './sections/LoginSection';
import { AdminDashboard } from './sections/AdminDashboard';
import './index.css';

// Panel de Empleado (Placeholder)
const EmpleadoPanel = () => (
  <div className="p-10 text-white bg-[#0b1121] min-h-screen font-sans">
    <h1 className="text-2xl font-black uppercase tracking-widest border-l-4 border-cyan-500 pl-4">
      Panel de Empleado
    </h1>
    <p className="mt-4 text-slate-400 font-medium">
      Módulo en construcción...
    </p>
  </div>
);

function App() {
  return (
    // EL ROUTER DEBE ENVOLVER TODO
    <BrowserRouter>
      <Routes>
        {/* Ruta Login (Inicio) */}
        <Route path="/" element={<LoginSection />} />

        {/* Rutas Protegidas */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/empleado" element={<EmpleadoPanel />} />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;