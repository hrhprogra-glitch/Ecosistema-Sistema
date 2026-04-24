import { Menu, X, LogOut } from 'lucide-react';

interface TopbarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  userEmail?: string;
  onLogout: () => void;
}

export default function Topbar({ isSidebarOpen, setIsSidebarOpen, userEmail, onLogout }: TopbarProps) {
  return (
    <header className="h-16 bg-eco-blanco border-b border-eco-gris-borde flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-eco-celeste transition-colors duration-300 rounded-none text-eco-oscuro active:scale-95"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h1 className="text-xl font-bold tracking-tighter text-eco-oscuro uppercase">Ecosistema</h1>
      </div>
      
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
    </header>
  );
}