// src/components/LoginForm.tsx
import { useState } from 'react';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { usuariosService } from '../services/supabase';

export const LoginForm = ({ onLogin }: { onLogin: (rol: string, usuario: any) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Por favor, ingrese su correo y contraseña.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const usuarioData = await usuariosService.validarUsuario(email, password);

      if (usuarioData) {
        // AMBOS (admin y supervisor) van al AdminDashboard ('admin')
        // El trabajador va a su panel de empleado
        const rolNormalizado = (usuarioData.role === 'admin' || usuarioData.role === 'supervisor') ? 'admin' : 'empleado'; 
        
        onLogin(rolNormalizado, { 
          id: usuarioData.id, 
          nombre: usuarioData.full_name || usuarioData.username || usuarioData.email,
          role: usuarioData.role // Pasamos el rol real a la sesión
        });
      } else {
        setError('Credenciales incorrectas o correo no registrado.');
      }
    } catch (err) {
      console.error("Error en autenticación:", err);
      setError('Error de conexión con el servidor. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-none p-3 flex items-start gap-3 animate-in slide-in-from-top-1">
          <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={16} />
          <p className="text-[11px] text-red-400 font-bold uppercase tracking-widest leading-relaxed">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Correo Electrónico</label>
          <input
            type="email"
            /* Se eliminó la clase 'uppercase' y 'font-bold' para que el texto sea normal */
            className="w-full bg-zinc-900/50 border border-zinc-700 rounded-none px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 transition-all text-sm font-sans"
            placeholder="nombre@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Contraseña de Acceso</label>
          </div>
          <input
            type="password"
            className="w-full bg-zinc-900/50 border border-zinc-700 rounded-none px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 transition-all text-sm font-sans"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group w-full bg-cyan-500 hover:bg-cyan-400 text-[#0f172a] font-black uppercase tracking-widest h-12 rounded-none flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed shadow-[4px_4px_0px_rgba(34,211,238,0.2)]"
      >
        {loading ? (
          <Loader2 className="animate-spin text-[#0f172a]" size={18} />
        ) : (
          <>
            <span>Ingresar al Sistema</span>
            <ArrowRight size={16} className="text-[#0f172a] group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </form>
  );
};