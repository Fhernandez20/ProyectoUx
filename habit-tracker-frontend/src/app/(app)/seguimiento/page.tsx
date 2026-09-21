'use client';

import { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import VistaDiaria from '@/components/seguimiento/VistaDiaria';
import VistaSemanal from '@/components/seguimiento/VistaSemanal';
import VistaMensual from '@/components/seguimiento/VistaMensual';

const PESTANAS = ['Diario', 'Semanal', 'Mensual'];

export default function SeguimientoPage() {
  const [pestana, setPestana] = useState(0);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 500 }}>
        Seguimiento
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Consulta tu progreso día por día, por semana o por mes
      </Typography>

      <Tabs
        value={pestana}
        onChange={(_, valor: number) => setPestana(valor)}
        variant="fullWidth"
        aria-label="Periodo de seguimiento"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        {PESTANAS.map((p, i) => (
          <Tab
            key={p}
            label={p}
            id={`seguimiento-tab-${i}`}
            aria-controls={`seguimiento-panel-${i}`}
          />
        ))}
      </Tabs>

      <Box
        role="tabpanel"
        id={`seguimiento-panel-${pestana}`}
        aria-labelledby={`seguimiento-tab-${pestana}`}
      >
        {pestana === 0 && <VistaDiaria />}
        {pestana === 1 && <VistaSemanal />}
        {pestana === 2 && <VistaMensual />}
      </Box>
    </Box>
  );
}
