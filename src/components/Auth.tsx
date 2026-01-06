import { useState } from 'react';
import { api } from '../lib/api';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: () => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAuth() {
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const result = await api.register(email, password, '');
        if (result.error) throw new Error(result.error);
        alert('Cuenta creada. Por favor inicia sesión');
        setIsSignUp(false);
        setPassword('');
      } else {
        const result = await api.login(email, password);
        if (result.error) throw new Error(result.error);
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleAuth();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">TiendaApp</h1>
          <p className="text-gray-600">
            {isSignUp ? 'Crea tu cuenta' : 'Inicia sesión en tu tienda'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="tu@email.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleAuth}
          disabled={loading || !email || !password}
          className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
        >
          {isSignUp ? (
            <>
              <UserPlus size={20} />
              Crear Cuenta
            </>
          ) : (
            <>
              <LogIn size={20} />
              Iniciar Sesión
            </>
          )}
        </button>

        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
          }}
          className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          {isSignUp
            ? 'Ya tienes cuenta? Inicia sesión'
            : 'No tienes cuenta? Crear una'}
        </button>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-600">
          <p className="font-medium text-gray-700 mb-2">Datos:</p>
          <p>Curso: Base de Datos I  -    Programa: FireBird 4</p>
          <p>Estudiante: Wilian Yuber Condori Ccama</p>
        </div>
      </div>
    </div>
  );
}
