import { useEffect, useState } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'sonner';
import { TeamsSetup } from './components/TeamsSetup';
import { Dashboard } from './components/Dashboard';
import { emptyMatchdays } from './utils/tournamentAlgorithm';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [teams, setTeams] = useState([]);
  const [matchdays, setMatchdays] = useState(emptyMatchdays());
  const [view, setView] = useState('setup'); // 'setup' | 'dashboard'
  const [loaded, setLoaded] = useState(false);

  // Load tournament from backend on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/tournament`);
        const data = res.data;
        if (data.teams && data.teams.length > 0) {
          setTeams(data.teams);
          setMatchdays(
            data.matchdays && data.matchdays.length === 6
              ? data.matchdays
              : emptyMatchdays()
          );
          if (data.teams.length === 11) {
            setView('dashboard');
          }
        }
      } catch (e) {
        console.error('Error loading tournament', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Persist on changes (debounced via setTimeout)
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      axios
        .put(`${API}/tournament`, { teams, matchdays })
        .catch((e) => console.error('Save failed', e));
    }, 300);
    return () => clearTimeout(t);
  }, [teams, matchdays, loaded]);

  const handleReset = async () => {
    try {
      await axios.delete(`${API}/tournament`);
    } catch (e) {
      console.error(e);
    }
    setMatchdays(emptyMatchdays());
  };

  return (
    <div className="App min-h-screen">
      {view === 'setup' ? (
        <TeamsSetup
          teams={teams}
          onTeamsChange={setTeams}
          onStart={() => setView('dashboard')}
        />
      ) : (
        <Dashboard
          teams={teams}
          matchdays={matchdays}
          onUpdate={setMatchdays}
          onReset={handleReset}
          onBack={() => setView('setup')}
        />
      )}
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#0A120A',
            border: '1px solid #1A2E1A',
            color: '#F8FAFC',
          },
        }}
      />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
