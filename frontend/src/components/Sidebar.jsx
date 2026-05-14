import { NavLink, useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Plus,
  Shuffle,
  Calendar,
  BarChart3,
  Trophy,
  Users,
  Award,
  ChevronLeft,
} from 'lucide-react';

const ESTECA_LOGO = 'https://customer-assets.emergentagent.com/job_liga-sorteo-equipos/artifacts/js911xp3_LOGO%20OFICIAL%20ESTECA-PC2019.jpg';
const COPA_LOGO = 'https://customer-assets.emergentagent.com/job_liga-sorteo-equipos/artifacts/bmxz6k50_logo%20campeonato.png';

const generalLinks = [
  { to: '/', icon: Home, label: 'Inicio', end: true, testId: 'nav-inicio' },
  { to: '/crear', icon: Plus, label: 'Crear torneo', testId: 'nav-crear' },
  { to: '/creditos', icon: Award, label: 'Créditos', testId: 'nav-creditos' },
];

const tournamentLinks = (id) => [
  { to: `/t/${id}/sorteo`, icon: Shuffle, label: 'Sorteo', testId: 'nav-sorteo' },
  { to: `/t/${id}/jornadas`, icon: Calendar, label: 'Jornadas y partidos', testId: 'nav-jornadas' },
  { to: `/t/${id}/tabla`, icon: BarChart3, label: 'Tabla general', testId: 'nav-tabla' },
  { to: `/t/${id}/eliminacion`, icon: Trophy, label: 'Eliminación directa', testId: 'nav-eliminacion' },
  { to: `/t/${id}/estadisticas`, icon: Users, label: 'Estadísticas', testId: 'nav-estadisticas' },
];

export const Sidebar = ({ activeTournament }) => {
  const { id } = useParams();
  const tid = id || activeTournament?.id;

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col bg-[#0F1428] border-r border-[#2A3458] min-h-screen sticky top-0">
      <div className="px-5 pt-6 pb-5 border-b border-[#2A3458]">
        <div className="flex items-center gap-3">
          <img src={COPA_LOGO} alt="Copa ESTECA" className="w-12 h-12 rounded-lg object-contain bg-white/5 p-1" />
          <div>
            <p className="label-caps !text-[10px]">Comisión Deportes</p>
            <p className="text-white font-['Outfit'] font-bold text-base leading-tight">Copa ESTECA</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <p className="label-caps px-3 py-2">General</p>
        {generalLinks.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            data-testid={l.testId}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all ${
                isActive
                  ? 'nav-active text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <l.icon className="w-4 h-4" />
            {l.label}
          </NavLink>
        ))}

        {tid && (
          <>
            <p className="label-caps px-3 pt-5 pb-2">Torneo activo</p>
            {tournamentLinks(tid).map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                data-testid={l.testId}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all ${
                    isActive
                      ? 'nav-active text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <l.icon className="w-4 h-4" />
                {l.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-[#2A3458] flex items-center gap-3">
        <img src={ESTECA_LOGO} alt="ESTECA-PC" className="w-9 h-9 rounded-full object-cover" />
        <div className="text-xs leading-tight">
          <p className="text-white font-semibold">ESTECA-PC</p>
          <p className="text-gray-500">Since 2002</p>
        </div>
      </div>
    </aside>
  );
};

export const MobileTopBar = ({ activeTournament }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const showBack = location.pathname !== '/';
  return (
    <div className="lg:hidden sticky top-0 z-30 bg-[#0F1428]/90 backdrop-blur-xl border-b border-[#2A3458] px-4 py-3 flex items-center gap-3">
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-md flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/5"
          aria-label="Atrás"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <img src={COPA_LOGO} alt="Copa" className="w-9 h-9 rounded-lg object-contain bg-white/5 p-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-white font-['Outfit'] font-bold truncate">{activeTournament?.name || 'Copa ESTECA'}</p>
        <p className="text-xs text-gray-500 truncate">Comisión de Deportes</p>
      </div>
    </div>
  );
};

export { ESTECA_LOGO, COPA_LOGO };
