import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Trash2, ArrowLeft } from 'lucide-react';

interface CartProps {
  onCheckout: () => void;
  onBack: () => void;
  userId?: string;
}

interface CartItem {
  ID: string;
  PRODUCTO_ID: string;
  CANTIDAD: number;
  NOMBRE: string;
  PRECIO: number;
  SUBTOTAL: number;
}

export function Cart({ onCheckout, onBack, userId }: CartProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadCart();
    }
  }, [userId]);

  async function loadCart() {
    setLoading(true);
    try {
      const cartItems = await api.getCarrito(userId!);
      setItems(cartItems || []);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(carritoId: string, cantidad: number) {
    if (cantidad <= 0) {
      await removeFromCart(carritoId);
      return;
    }

    try {
      await api.updateCarrito(carritoId, cantidad);
      loadCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  }

  async function removeFromCart(carritoId: string) {
    try {
      await api.deleteCarrito(carritoId);
      loadCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  }

  const total = items.reduce((sum, item) => sum + item.SUBTOTAL, 0);

  if (loading) {
    return <div className="text-center py-12">Cargando carrito...</div>;
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft size={20} />
          Volver al Catalogo
        </button>
      </div>

      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Carrito de Compras</h1>
        <p className="text-gray-600">{items.length} producto(s) en tu carrito</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-500 text-lg mb-4">Tu carrito esta vacio</p>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Continuar comprando
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.ID} className="bg-white rounded-lg p-4 flex justify-between items-center shadow-md">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.NOMBRE}</h3>
                  <p className="text-gray-600 text-sm">${item.PRECIO.toFixed(2)}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.ID, item.CANTIDAD - 1)}
                      className="px-3 py-1 text-gray-600 hover:text-blue-600 font-bold"
                    >
                      −
                    </button>
                    <span className="px-4 py-1 text-gray-900 font-semibold">{item.CANTIDAD}</span>
                    <button
                      onClick={() => updateQuantity(item.ID, item.CANTIDAD + 1)}
                      className="px-3 py-1 text-gray-600 hover:text-blue-600 font-bold"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-24">
                    <p className="font-bold text-gray-900">${item.SUBTOTAL.toFixed(2)}</p>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.ID)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg p-6 space-y-4 shadow-md border-t-4 border-blue-600">
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold text-gray-900">Subtotal</span>
              <span className="text-gray-700">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold text-gray-900">Envio</span>
              <span className="text-gray-700">Gratis</span>
            </div>
            <div className="border-t pt-4 flex justify-between items-center text-2xl font-bold">
              <span className="text-gray-900">Total</span>
              <span className="text-blue-600">${total.toFixed(2)}</span>
            </div>

            <button
              onClick={onCheckout}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-lg"
            >
              Proceder al Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
