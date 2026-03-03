// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginSection } from './sections/LoginSection';
import { AdminDashboard } from './sections/AdminDashboard';
import { EmpleadoDashboard } from './sections/empleado/EmpleadoDashboard'; // Importamos el nuevo Panel Restringido
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Login (Inicio) */}
        <Route path="/" element={<LoginSection />} />

        {/* Ruta para Administradores Globales */}
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* Ruta Restringida para Trabajadores/Operarios */}
        <Route path="/empleado" element={<EmpleadoDashboard />} />

        {/* Redirección por defecto ante rutas inexistentes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;