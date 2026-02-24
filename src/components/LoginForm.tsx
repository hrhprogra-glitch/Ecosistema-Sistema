import { useState } from 'react';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export const LoginForm = ({ onLogin }: { onLogin: () => void }) => {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (user === 'admin' && password === '1234') {
        onLogin();
      } else {
        setError('Las credenciales no coinciden.');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 flex items-start gap-3 animate-in slide-in-from-top-1">
          <AlertCircle className="text-red-500 mt-0.5" size={16} />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">Usuario</label>
          <input
            type="text"
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all text-sm"
            placeholder="nombre@empresa.com"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-zinc-300">Contraseña</label>
            <a href="#" className="text-xs text-zinc-500 hover:text-white transition-colors">¿Olvidaste tu contraseña?</a>
          </div>
          <input
            type="password"
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all text-sm font-sans"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group w-full bg-white hover:bg-zinc-200 text-black font-semibold h-11 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <>
            <span>Iniciar Sesión</span>
            <ArrowRight size={16} className="text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
          </>
        )}
      </button>

    </form>
  );
};