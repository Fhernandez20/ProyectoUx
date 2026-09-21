'use client';

import { Box, Card, CardContent, LinearProgress, Typography } from '@mui/material';

interface Dato {
  label: string;
  valor: string | number;
}

interface Props {
  titulo: string;
  porcentaje: number;
  datos: Dato[];
}

/** Tarjeta con el % de cumplimiento del periodo y datos de apoyo. */
export default function ResumenPeriodo({ titulo, porcentaje, datos }: Props) {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            mb: 1,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            {titulo}
          </Typography>
          <Typography variant="h4" style={{ fontWeight: 500 }}>
            {porcentaje}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={porcentaje}
          color="success"
          sx={{ height: 8, borderRadius: 4, mb: 2 }}
          aria-label={`${titulo}: ${porcentaje}%`}
        />
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {datos.map((d) => (
            <Box key={d.label}>
              <Typography variant="body2" color="text.secondary">
                {d.label}
              </Typography>
              <Typography variant="h6" style={{ fontWeight: 500 }}>
                {d.valor}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
