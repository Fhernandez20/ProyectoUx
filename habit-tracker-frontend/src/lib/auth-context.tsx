'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { authApi, Usuario, ApiError } from './api';

interface AuthContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  login: (correo: string, contrasena: string) => Promise<void>;
  register: (
    nombre: string,
    correo: string,
    contrasena: string,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  // Al cargar la app, si hay token guardado, valida sesión con /auth/me
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setCargando(false);
      return;
    }

    authApi
      .me()
      .then((data) => setUsuario(data))
      .catch(() => {
        localStorage.removeItem('access_token');
      })
      .finally(() => setCargando(false));
  }, []);

  async function login(correo: string, contrasena: string) {
    const data = await authApi.login({ correo, contrasena });
    localStorage.setItem('access_token', data.access_token);
    setUsuario(data.usuario);
  }

  async function register(nombre: string, correo: string, contrasena: string) {
    const data = await authApi.register({ nombre, correo, contrasena });
    localStorage.setItem('access_token', data.access_token);
    setUsuario(data.usuario);
  }

  function logout() {
    localStorage.removeItem('access_token');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider
      value={{ usuario, cargando, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

export { ApiError };
