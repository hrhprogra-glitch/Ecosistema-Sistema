import { useState, useEffect } from 'react';
// IMPORTANTE: Usamos useNavigate para cambiar de página
import { useNavigate } from 'react-router-dom'; 
import { LoginForm } from '../components/LoginForm';

const IMAGENES_FONDO = [
  "https://images.unsplash.com/photo-1515150144380-bca9f1650ed9?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1615811361523-6bd03c772863?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?q=80&w=2071&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1558904541-efa843a96f01?q=80&w=2069&auto=format&fit=crop"
];

// Ya no recibimos props aquí
export const LoginSection = () => {
  const navigate = useNavigate(); // Hook de navegación
  const [indiceActual, setIndiceActual] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceActual((prev) => (prev + 1) % IMAGENES_FONDO.length);
    }, 5000);
    return () => clearInterval(intervalo);
  }, []);

  // Función interna para manejar el login exitoso
  const handleLoginSuccess = () => {
    // Aquí podrías guardar un token si fuera real
    // Redirigimos al Dashboard
    navigate('/admin');
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0f172a] selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* SECCIÓN IZQUIERDA */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 relative z-20 bg-[#0f172a] border-r border-white/5">
        <div className="w-full max-w-[420px] space-y-10 animate-in slide-in-from-left-4 duration-700 fade-in flex flex-col items-center text-center">
          
          <div className="flex flex-col items-center gap-6">
            <img src="/logo.svg" alt="Logo" className="h-24 w-24 drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-white tracking-tighter">
                EcoSistemas <span className="text-cyan-500">URH</span>
              </h1>
              <p className="text-slate-400 font-medium">Gestión Integral de Proyectos</p>
            </div>
          </div>

          <div className="w-full text-left">
             {/* Pasamos la nueva función handleLoginSuccess */}
             <LoginForm onLogin={handleLoginSuccess} />
          </div>
          
          <p className="text-xs text-slate-600 mt-8">
            © 2026 Eco Sistemas URH SAC - v2.4.0 Stable
          </p>
        </div>
      </div>

      {/* SECCIÓN DERECHA */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden bg-black z-10">
        {IMAGENES_FONDO.map((img, index) => (
          <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === indiceActual ? 'opacity-100' : 'opacity-0'}`}>
            <img src={img} alt={`Fondo ${index}`} className="w-full h-full object-cover opacity-80" />
          </div>
        ))}
        <div className="absolute inset-0 bg-[#0f172a]/30 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-90" />
        
        <div className="absolute bottom-0 left-0 right-0 p-12 z-20">
          <div className="max-w-lg">
            <h2 className="text-3xl font-bold text-white mb-3 leading-tight tracking-tight">Sistema de Gestión Integral.</h2>
            <p className="text-slate-300 text-base leading-relaxed font-light border-l-2 border-cyan-500 pl-4">
              Plataforma centralizada para el control total de inventarios, administración de clientes y optimización de recursos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};