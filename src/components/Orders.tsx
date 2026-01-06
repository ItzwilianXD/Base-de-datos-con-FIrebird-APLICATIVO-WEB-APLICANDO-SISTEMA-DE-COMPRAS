import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface OrdersProps {
  userId?: string;
}

interface Pedido {
  ID: string;
  TOTAL: number;
  CREATED_AT: string;
  ESTADO_ID: number;
  ESTADO: string;
}

interface DetallePedido {
  ID: string;
  NOMBRE_PRODUCTO: string;
  CANTIDAD: number;
  PRECIO_UNITARIO: number;
  SUBTOTAL: number;
}

export function Orders({ userId }: OrdersProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [detalles, setDetalles] = useState<Map<string, DetallePedido[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedPedido, setExpandedPedido] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadOrders();
    }
  }, [userId]);

  async function loadOrders() {
    setLoading(true);
    try {
      const pedidosData = await api.getPedidos(userId!);
      setPedidos(pedidosData || []);

      if (pedidosData && pedidosData.length > 0) {
        const detallesMap = new Map<string, DetallePedido[]>();
        for (const pedido of pedidosData) {
          const det = await api.getDetallePedido(pedido.ID);
          detallesMap.set(pedido.ID, det || []);
        }
        setDetalles(detallesMap);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function cambiarEstado(pedidoId: string, nuevoEstadoId: number) {
    try {
      await api.cambiarEstadoPedido(pedidoId, nuevoEstadoId);
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  }

  const obtenerEstadoSiguiente = (estadoActualId: number) => {
    const estadosIds = [1, 2, 3, 4];
    const index = estadosIds.indexOf(estadoActualId);
    return index < estadosIds.length - 1 ? estadosIds[index + 1] : null;
  };

  if (loading) {
    return <div className="text-center py-12">Cargando pedidos...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Mis Pedidos</h1>
        <p className="text-gray-600">{pedidos.length} pedido(s) en total</p>
      </div>

      {pedidos.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center shadow-md">
          <p className="text-gray-500 text-lg mb-4">Aun no tienes pedidos</p>
          <p className="text-gray-600">Cuando realices tu primera compra, aparecera aqui</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map(pedido => {
            const detallesList = detalles.get(pedido.ID) || [];
            const isExpanded = expandedPedido === pedido.ID;
            const estadoSiguiente = obtenerEstadoSiguiente(pedido.ESTADO_ID);

            return (
              <div
                key={pedido.ID}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        Pedido #{pedido.ID.slice(0, 8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {new Date(pedido.CREATED_AT).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${
                              pedido.ESTADO_ID === 1 ? 'bg-yellow-500' :
                              pedido.ESTADO_ID === 2 ? 'bg-blue-500' :
                              pedido.ESTADO_ID === 3 ? 'bg-purple-500' :
                              pedido.ESTADO_ID === 4 ? 'bg-green-500' :
                              'bg-red-500'
                            }`}
                          >
                            {pedido.ESTADO}
                          </span>
                        </div>

                        {estadoSiguiente && (
                          <button
                            onClick={() => cambiarEstado(pedido.ID, estadoSiguiente)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            → Cambiar a proximo estado
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        ${pedido.TOTAL.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">{detallesList.length} producto(s)</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedPedido(isExpanded ? null : pedido.ID)}
                    className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    {isExpanded ? 'Ocultar' : 'Ver'} detalles
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t bg-gray-50 p-6 space-y-3">
                    <h4 className="font-semibold text-gray-900 mb-3">Productos:</h4>
                    {detallesList.map(detalle => (
                      <div key={detalle.ID} className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{detalle.NOMBRE_PRODUCTO}</p>
                          <p className="text-sm text-gray-600">{detalle.CANTIDAD} x ${detalle.PRECIO_UNITARIO.toFixed(2)}</p>
                        </div>
                        <p className="font-bold text-gray-900">${detalle.SUBTOTAL.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
