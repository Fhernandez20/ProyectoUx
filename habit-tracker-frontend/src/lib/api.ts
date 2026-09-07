const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = 'Ocurrió un error. Intenta de nuevo.';
    try {
      const data = await res.json();
      message = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message ?? message;
    } catch {
      // el backend no devolvió JSON, usamos el mensaje genérico
    }
    throw new ApiError(message, res.status);
  }

  // 204 No Content (por ejemplo, en un delete)
  if (res.status === 204) return undefined as T;

  return res.json();
}

// ----- Tipos -----
export interface Usuario {
  id?: string;
  userId?: string;
  nombre: string;
  correo: string;
}

export interface AuthResponse {
  access_token: string;
  usuario: Usuario;
}

export interface Habito {
  id: string;
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
  frecuencia: 'diario' | 'semanal' | 'personalizada';
  prioridad?: number | null;
  fechaInicio: string;
  fechaFin?: string | null;
  activo: boolean;
  usuarioId: string;
}

export interface HabitoInput {
  nombre: string;
  descripcion?: string;
  categoria?: string;
  frecuencia: 'diario' | 'semanal' | 'personalizada';
  prioridad?: number;
}

// ----- Auth -----
export const authApi = {
  register: (data: { nombre: string; correo: string; contrasena: string }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { correo: string; contrasena: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<Usuario>('/auth/me'),
};

// ----- Habits -----
export const habitsApi = {
  listar: () => request<Habito[]>('/habits'),

  crear: (data: HabitoInput) =>
    request<Habito>('/habits', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  actualizar: (id: string, data: Partial<HabitoInput>) =>
    request<Habito>(`/habits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  eliminar: (id: string) =>
    request<void>(`/habits/${id}`, { method: 'DELETE' }),

  toggle: (id: string) =>
    request<Habito>(`/habits/${id}/toggle`, { method: 'PATCH' }),

  completar: (id: string) =>
    request(`/habits/${id}/completar`, { method: 'POST' }),
};
