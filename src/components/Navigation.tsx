import { ShoppingBag, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavigationProps {
  currentPage: string;
  onNavigation: (page: string) => void;
  cartCount: number;
  isAuthenticated: boolean;
  onLogout: () => void;
}

export function Navigation({
  currentPage,
  onNavigation,
  cartCount,
  isAuthenticated,
  onLogout,
}: NavigationProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { id: 'catalog', label: 'Catálogo' },
    { id: 'cart', label: 'Carrito', badge: cartCount > 0 ? cartCount : null },
    { id: 'orders', label: 'Mis Pedidos' },
  ];

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <ShoppingBag className="text-blue-600" size={32} />
            <h1 className="text-2xl font-bold text-gray-900">TiendaApp</h1>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-600 hover:text-gray-900"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigation(item.id)}
                className={`px-4 py-2 rounded-lg font-medium transition relative ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
                {item.badge && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {isAuthenticated && (
            <button
              onClick={onLogout}
              className="hidden md:flex items-center gap-2 text-gray-700 hover:text-red-600 font-medium transition"
            >
              <LogOut size={20} />
              Salir
            </button>
          )}
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigation(item.id);
                  setMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
                {item.badge && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
            {isAuthenticated && (
              <button
                onClick={() => {
                  onLogout();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-red-50 transition flex items-center gap-2"
              >
                <LogOut size={20} />
                Salir
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
