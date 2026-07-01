import { LayoutDashboard, ArrowLeftRight, Package, History, Users } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export default function Sidebar({ isOpen, currentTab, setCurrentTab }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
    { id: 'almacen', label: 'Almacén', icon: Package },
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'personal', label: 'Personal', icon: Users },
  ];

  return (
    <aside className={`
      absolute sm:relative z-40 h-full inset-y-0 left-0 bg-eco-gris-claro border-r border-eco-gris-borde
      transition-all duration-500 ease-in-out flex flex-col shadow-xl sm:shadow-none
      ${isOpen ? 'w-64 translate-x-0' : '-translate-x-full sm:w-20 sm:translate-x-0'}
    `}>
      {/* Contenedor flex-1 para empujar el footer hacia abajo, manteniendo tu fondo */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`
                  w-full flex items-center gap-4 p-3 transition-all duration-300 rounded-none
                  ${isActive 
                    /* TU ESTILO ORIGINAL RESTAURADO */
                    ? 'bg-eco-celeste text-eco-oscuro font-bold shadow-sm' 
                    : 'text-eco-oscuro/70 hover:bg-eco-celeste/20 hover:text-eco-oscuro'}
                `}
              >
                {/* shrink-0 evita que el icono se aplaste cuando el texto desaparece */}
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                <span className={`text-sm whitespace-nowrap transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* FOOTER DEL SIDEBAR: Rellena la parte inferior respetando tu paleta */}
      <div className="p-4 border-t border-eco-gris-borde shrink-0">
        <div className={`flex items-center gap-2 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
          <div className="w-2 h-2 bg-green-500 rounded-none animate-pulse"></div>
          <span className="text-xs font-medium text-eco-oscuro/70">
            Sistema Activo
          </span>
        </div>
      </div>
    </aside>
  );
}