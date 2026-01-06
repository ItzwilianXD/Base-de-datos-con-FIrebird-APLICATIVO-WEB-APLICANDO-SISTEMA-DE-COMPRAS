import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Producto, Categoria } from '../types';
import { ShoppingCart } from 'lucide-react';

interface CatalogProps {
  onAddToCart: (producto: Producto) => void;
}

export function Catalog({ onAddToCart }: CatalogProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategoriesAndProducts();
  }, []);

  async function loadCategoriesAndProducts() {
    setLoading(true);
    try {
      const cats = await api.getCategorias();
      const catsMapped = cats.map((c: any) => ({
        id: c.ID,
        nombre: c.NOMBRE,
        descripcion: c.DESCRIPCION
      }));
      setCategorias(catsMapped);

      const prods = await api.getProductos();
      const prodsMapped = prods.map((p: any) => ({
        id: p.ID,
        nombre: p.NOMBRE,
        descripcion: p.DESCRIPCION,
        precio: p.PRECIO,
        stock: p.STOCK,
        categoria_id: p.CATEGORIA_ID
      }));
      setProductos(prodsMapped);

      if (catsMapped && catsMapped.length > 0) {
        setSelectedCategory(catsMapped[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = selectedCategory
    ? productos.filter(p => p.categoria_id === selectedCategory)
    : [];

  if (loading) {
    return <div className="text-center py-12">Cargando catalogo...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Catalogo de Productos</h1>
        <p className="text-gray-600">Explora nuestros productos por categoria</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {categorias.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-6 py-3 rounded-lg font-medium transition whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(producto => (
          <div
            key={producto.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{producto.nombre}</h3>
            <p className="text-gray-600 text-sm mb-4">{producto.descripcion}</p>

            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-bold text-blue-600">${producto.precio}</span>
                <span className={`text-sm font-medium ${
                  producto.stock > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {producto.stock > 0 ? `${producto.stock} disponibles` : 'Sin stock'}
                </span>
              </div>

              <button
                onClick={() => onAddToCart(producto)}
                disabled={producto.stock === 0}
                className={`w-full py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                  producto.stock > 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart size={18} />
                Agregar al Carrito
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay productos en esta categoria</p>
        </div>
      )}
    </div>
  );
}
