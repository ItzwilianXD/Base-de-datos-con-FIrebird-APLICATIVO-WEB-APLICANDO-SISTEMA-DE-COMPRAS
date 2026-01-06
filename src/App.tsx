import { useEffect, useState } from 'react';
import { api } from './lib/api';
import { Catalog } from './components/Catalog';
import { Cart } from './components/Cart';
import { Checkout } from './components/Checkout';
import { Orders } from './components/Orders';
import { Navigation } from './components/Navigation';
import { Auth } from './components/Auth';
import { Producto } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState('catalog');
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      updateCartCount();
    }
  }, [user, currentPage]);

  async function checkUser() {
    try {
      const currentUser = api.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateCartCount() {
    if (!user) return;
    try {
      const carrito = await api.getCarrito(user.id);
      setCartCount(carrito?.length || 0);
    } catch (error) {
      console.error('Error updating cart count:', error);
    }
  }

  async function handleAddToCart(producto: Producto) {
    if (!user) {
      alert('Por favor inicia sesión para agregar productos');
      return;
    }

    try {
      await api.addCarrito(user.id, producto.id, 1);
      updateCartCount();
      alert('Producto agregado al carrito');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error al agregar al carrito');
    }
  }

  async function handleLogout() {
    try {
      api.logout();
      setUser(null);
      setCurrentPage('catalog');
      setCartCount(0);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={checkUser} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        currentPage={currentPage}
        onNavigation={setCurrentPage}
        cartCount={cartCount}
        isAuthenticated={!!user}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {showOrderSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg flex justify-between items-center">
            <span className="font-semibold">Compra confirmada. Tu pedido ha sido registrado exitosamente.</span>
            <button
              onClick={() => setShowOrderSuccess(false)}
              className="text-green-700 hover:text-green-900"
            >
              ✕
            </button>
          </div>
        )}

        {currentPage === 'catalog' && (
          <Catalog onAddToCart={handleAddToCart} />
        )}

        {currentPage === 'cart' && (
          <Cart
            onCheckout={() => setCurrentPage('checkout')}
            onBack={() => setCurrentPage('catalog')}
            userId={user?.id}
          />
        )}

        {currentPage === 'checkout' && (
          <Checkout
            onBack={() => setCurrentPage('cart')}
            onOrderCreated={() => {
              setShowOrderSuccess(true);
              setCurrentPage('orders');
              updateCartCount();
            }}
            userId={user?.id}
          />
        )}

        {currentPage === 'orders' && (
          <Orders userId={user?.id} />
        )}
      </main>
    </div>
  );
}

export default App;
