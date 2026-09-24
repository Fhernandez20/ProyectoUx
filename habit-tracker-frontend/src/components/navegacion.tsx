import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import ChecklistIcon from '@mui/icons-material/ChecklistOutlined';
import CalendarIcon from '@mui/icons-material/CalendarMonthOutlined';
import BarChartIcon from '@mui/icons-material/BarChartOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlineOutlined';

export const itemsNavegacion = [
  { label: 'Dashboard', corto: 'Inicio', href: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Mis hábitos', corto: 'Hábitos', href: '/habitos', icon: <ChecklistIcon /> },
  { label: 'Seguimiento', corto: 'Seguimiento', href: '/seguimiento', icon: <CalendarIcon /> },
  { label: 'Estadísticas', corto: 'Estadísticas', href: '/estadisticas', icon: <BarChartIcon /> },
  { label: 'Perfil', corto: 'Perfil', href: '/perfil', icon: <PersonIcon /> },
];

export const itemsBarraInferior = itemsNavegacion.filter((i) => i.href !== '/perfil');

export function rutaActiva(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
