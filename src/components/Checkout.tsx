import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Check, ArrowLeft } from 'lucide-react';

interface CheckoutProps {
  onBack: () => void;
  onOrderCreated: () => void;
  userId?: string;
}

interface CartItem {
  ID: string;
  NOMBRE: string;
  PRECIO: number;
  CANTIDAD: number;
  SUBTOTAL: number;
}

export function Checkout({ onBack, onOrderCreated, userId }: CheckoutProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

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

  const total = items.reduce((sum, item) => sum + item.SUBTOTAL, 0);

  async function confirmarCompra() {
    if (!userId || items.length === 0) return;

    setProcessing(true);
    try {
      await api.crearPedido(userId, total);
      setItems([]);
      onOrderCreated();
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('Error al confirmar la compra. Por favor intenta de nuevo.');
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12">Cargando informacion...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl space-y-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft size={20} />
          Volver
        </button>
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-500 text-lg">Tu carrito esta vacio</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft size={20} />
          Volver al Carrito
        </button>
      </div>

      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Confirmar Compra</h1>
        <p className="text-gray-600">Revisa tu pedido antes de confirmar</p>
      </div>

      <div className="bg-white rounded-lg p-6 space-y-4 shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen del Pedido</h2>

        {items.map(item => (
          <div key={item.ID} className="flex justify-between items-center border-b pb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{item.NOMBRE}</h3>
              <p className="text-sm text-gray-600">{item.CANTIDAD} x ${item.PRECIO.toFixed(2)}</p>
            </div>
            <p className="font-bold text-gray-900">${item.SUBTOTAL.toFixed(2)}</p>
          </div>
        ))}

        <div className="border-t pt-4 flex justify-between items-center text-xl font-bold">
          <span className="text-gray-900">Total a Pagar</span>
          <span className="text-blue-600">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <div className="flex items-start gap-3">
          <Check size={20} className="text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-gray-900">Informacion de Envio</h3>
            <p className="text-sm text-gray-600">Envío gratis a cualquier parte del pais</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Check size={20} className="text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-gray-900">Seguridad de Compra</h3>
            <p className="text-sm text-gray-600">Tu compra está protegida 100%</p>
          </div>
        </div>
      </div>

      <button
        onClick={confirmarCompra}
        disabled={processing}
        className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {processing ? 'Procesando...' : 'Confirmar y Pagar'}
      </button>

      <button
        onClick={onBack}
        className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
      >
        Volver al Carrito
      </button>
    </div>
  );
}
