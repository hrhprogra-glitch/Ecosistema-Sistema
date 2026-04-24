import { LayoutDashboard, ArrowLeftRight, Package, History, Users } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export default function Sidebar({ isOpen, currentTab, setCurrentTab }: SidebarProps) {
  // AQUÍ ESTÁN TUS 5 SESIONES EXACTAS, NADA MÁS
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
    { id: 'almacen', label: 'Almacén', icon: Package },
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'personal', label: 'Personal', icon: Users },
  ];

  return (
    <aside className={`
      bg-eco-gris-claro border-r border-eco-gris-borde
      transition-all duration-500 ease-in-out
      ${isOpen ? 'w-64' : 'w-0 -translate-x-full sm:w-20 sm:translate-x-0'}
    `}>
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`
                w-full flex items-center gap-4 p-3 transition-all duration-300 rounded-none border-l-2
                ${isActive 
                  ? 'bg-eco-celeste text-eco-oscuro border-eco-oscuro font-semibold' 
                  : 'text-eco-gris border-transparent hover:bg-eco-azul/20 hover:text-eco-oscuro'}
              `}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-sm whitespace-nowrap transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}