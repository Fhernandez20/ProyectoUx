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
  return sessionStorage.getItem('access_token');
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

  // Token vencido o inválido en medio de la sesión: se limpia y se vuelve al login.
  // (En login/registro un 401 significa "credenciales incorrectas", no sesión vencida.)
  if (res.status === 401 && token && !path.startsWith('/auth/')) {
    sessionStorage.removeItem('access_token');
    window.location.assign('/login');
    return new Promise<T>(() => {}); // la página se recarga; no se sigue procesando
  }

  if (!res.ok) {
    let message = 'Ocurrió un error. Intenta de nuevo.';
    try {
      const data = await res.json();
      message = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message ?? message;
    } catch {
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;

  return res.json();
}

// ----- Tipos -----
export interface Usuario {
  id?: string;
  userId?: string;
  nombre: string;
  correo: string;
  fechaRegistro?: string;
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

// ----- Users -----
export const usersApi = {
  // Datos frescos desde la base de datos (el token puede tener un nombre viejo)
  me: () => request<Usuario>('/users/me'),

  actualizar: (data: { nombre: string }) =>
    request<Usuario>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
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

  // IDs de los hábitos que el usuario ya completó hoy
  completadosHoy: () => request<string[]>('/habits/completados-hoy'),
};

// ----- Statistics -----
export interface ResumenStats {
  totalHabitos: number;
  habitosActivos: number;
  habitosFinalizados: number;
  completadosHoy: number;
  esperadosHoy: number;
  rachaActual: number;
  mejorRacha: number;
  cumplimiento: { hoy: number; semana: number; mes: number };
}

export interface ActividadDia {
  fecha: string; // "2026-09-18"
  completados: number;
  esperados: number;
  porcentaje: number;
}

export interface SemanaTendencia {
  desde: string;
  hasta: string;
  porcentaje: number;
}

export interface HabitoStats {
  id: string;
  nombre: string;
  frecuencia: string;
  activo: boolean;
  completadoHoy: boolean;
  completadosSemana: number;
  completadosMes: number;
  rachaActual: number;
  mejorRacha: number;
}

export const statsApi = {
  resumen: () => request<ResumenStats>('/statistics/resumen'),
  actividad: (dias: number) =>
    request<ActividadDia[]>(`/statistics/actividad?dias=${dias}`),
  tendencia: (semanas: number) =>
    request<SemanaTendencia[]>(`/statistics/tendencia?semanas=${semanas}`),
  porHabito: () => request<HabitoStats[]>('/statistics/habitos'),
};