import { Menu, X, LogOut, Bell, Search } from 'lucide-react';

interface TopbarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  userEmail?: string;
  onLogout: () => void;
}

export default function Topbar({ isSidebarOpen, setIsSidebarOpen, userEmail, onLogout }: TopbarProps) {
  return (
    <header className="h-16 bg-eco-blanco border-b-4 border-eco-celeste flex items-center justify-between px-6 sticky top-0 z-50">
      
      {/* LADO IZQUIERDO: Tu estructura original */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-eco-celeste transition-colors duration-300 rounded-none text-eco-oscuro active:scale-95"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h1 className="text-xl font-bold tracking-tighter text-eco-oscuro uppercase">ECO-SISTEMA</h1>
      </div>
      
      {/* LADO DERECHO: Herramientas integradas sutilmente */}
      <div className="flex items-center gap-4 sm:gap-6">
        
        {/* Buscador Integrado a tu diseño */}
        <div className="hidden md:flex items-center relative">
          <Search size={16} className="absolute left-3 text-eco-oscuro/50" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="pl-9 pr-4 py-1.5 bg-eco-gris-claro border border-eco-gris-borde text-sm outline-none focus:border-eco-celeste transition-colors rounded-none w-48 text-eco-oscuro"
          />
        </div>

        {/* Campana de Alertas sutil */}
        <button className="relative p-2 text-eco-oscuro hover:bg-eco-celeste/20 transition-all duration-300 rounded-none active:scale-95">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-eco-blanco rounded-full"></span>
        </button>

        <div className="w-px h-6 bg-eco-gris-borde hidden sm:block"></div>

        {/* Usuario y Logout (Tu código exacto original) */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-eco-gris hidden sm:block uppercase tracking-wider">
            {userEmail?.split('@')[0]}
          </span>
          <button 
            onClick={onLogout}
            className="p-2 text-eco-oscuro/50 hover:text-red-500 hover:bg-red-50 transition-all duration-300 rounded-none"
            title="Cerrar Sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

    </header>
  );
}