import { Outlet, useParams } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { Sidebar, MobileTopBar } from './Sidebar';
import { getTournament, listTournaments } from '../utils/api';

export const AppLayout = () => {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshList = useCallback(async () => {
    const list = await listTournaments();
    setTournaments(list);
  }, []);

  const loadTournament = useCallback(async (tid) => {
    if (!tid) {
      setTournament(null);
      return;
    }
    setLoading(true);
    try {
      const data = await getTournament(tid);
      setTournament(data);
    } catch (e) {
      setTournament(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  useEffect(() => {
    loadTournament(id);
  }, [id, loadTournament]);

  return (
    <div className="flex min-h-screen bg-[#0A0E1F] text-white">
      <Sidebar activeTournament={tournament} />
      <main className="flex-1 min-w-0">
        <MobileTopBar activeTournament={tournament} />
        <Outlet
          context={{
            tournament,
            tournaments,
            loading,
            refresh: () => loadTournament(id),
            refreshList,
            setTournament,
          }}
        />
      </main>
    </div>
  );
};
