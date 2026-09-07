'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setCargando(true);
    try {
      await register(nombre, correo, contrasena);
      router.push('/dashboard');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No se pudo crear la cuenta',
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400 }} elevation={2}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 500 }}>
          Crear cuenta
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Empieza a construir mejores hábitos
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Nombre"
            fullWidth
            required
            margin="normal"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <TextField
            label="Correo electrónico"
            type="email"
            fullWidth
            required
            margin="normal"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            required
            margin="normal"
            helperText="Mínimo 6 caracteres"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            sx={{ mt: 3 }}
            disabled={cargando}
          >
            {cargando ? <CircularProgress size={24} /> : 'Registrarme'}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: 'inherit' }}>
            Inicia sesión
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
