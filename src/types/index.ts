export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria_id: string;
  imagen_url?: string;
}

export interface CarritoItem {
  id: string;
  usuario_id: string;
  producto_id: string;
  cantidad: number;
  producto?: Producto;
}

export interface Pedido {
  id: string;
  usuario_id: string;
  estado_id: number;
  total: number;
  created_at: string;
  updated_at: string;
  estado?: EstadoPedido;
}

export interface DetallePedido {
  id: string;
  pedido_id: string;
  producto_id: string;
  nombre_producto: string;
  descripcion_producto?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at: string;
}

export interface EstadoPedido {
  id: number;
  nombre: string;
  descripcion?: string;
}
