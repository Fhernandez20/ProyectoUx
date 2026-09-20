'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { authApi, usersApi, Usuario, ApiError } from './api';

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
  actualizarUsuario: (usuario: Usuario) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token) {
      setCargando(false);
      return;
    }

    usersApi
      .me()
      .then((data) => setUsuario(data))
      .catch(() => {
        sessionStorage.removeItem('access_token');
      })
      .finally(() => setCargando(false));
  }, []);

  async function login(correo: string, contrasena: string) {
    const data = await authApi.login({ correo, contrasena });
    sessionStorage.setItem('access_token', data.access_token);
    setUsuario(data.usuario);
  }

  async function register(nombre: string, correo: string, contrasena: string) {
    const data = await authApi.register({ nombre, correo, contrasena });
    sessionStorage.setItem('access_token', data.access_token);
    setUsuario(data.usuario);
  }

  function logout() {
    sessionStorage.removeItem('access_token');
    setUsuario(null);
  }

  // Para refrescar el nombre en la Navbar después de editar el perfil
  function actualizarUsuario(actualizado: Usuario) {
    setUsuario(actualizado);
  }

  return (
    <AuthContext.Provider
      value={{ usuario, cargando, login, register, logout, actualizarUsuario }}
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