const API_URL = 'http://localhost:3001/api';

interface User {
  id: string;
  email: string;
  nombre?: string;
}

let currentUser: User | null = null;

export const api = {
  async getCategorias() {
    const res = await fetch(`${API_URL}/categorias`);
    return res.json();
  },

  async getProductos() {
    const res = await fetch(`${API_URL}/productos`);
    return res.json();
  },

  async getCarrito(usuarioId: string) {
    const res = await fetch(`${API_URL}/carrito/${usuarioId}`);
    return res.json();
  },

  async addCarrito(usuarioId: string, productoId: string, cantidad: number = 1) {
    const res = await fetch(`${API_URL}/carrito`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId, productoId, cantidad }),
    });
    return res.json();
  },

  async updateCarrito(carritoId: string, cantidad: number) {
    const res = await fetch(`${API_URL}/carrito/${carritoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cantidad }),
    });
    return res.json();
  },

  async deleteCarrito(carritoId: string) {
    const res = await fetch(`${API_URL}/carrito/${carritoId}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async getPedidos(usuarioId: string) {
    const res = await fetch(`${API_URL}/pedidos/${usuarioId}`);
    return res.json();
  },

  async getDetallePedido(pedidoId: string) {
    const res = await fetch(`${API_URL}/pedidos/${pedidoId}/detalles`);
    return res.json();
  },

  async crearPedido(usuarioId: string, total: number) {
    const res = await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId, total }),
    });
    return res.json();
  },

  async cambiarEstadoPedido(pedidoId: string, estadoId: number) {
    const res = await fetch(`${API_URL}/pedidos/${pedidoId}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estadoId }),
    });
    return res.json();
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  async register(email: string, password: string, nombre: string = '') {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nombre }),
    });
    return res.json();
  },

  logout() {
    currentUser = null;
    localStorage.removeItem('user');
  },

  getCurrentUser(): User | null {
    if (currentUser) return currentUser;
    const stored = localStorage.getItem('user');
    if (stored) {
      currentUser = JSON.parse(stored);
      return currentUser;
    }
    return null;
  },

  async getEstados() {
    const res = await fetch(`${API_URL}/estados`);
    return res.json();
  },
};
