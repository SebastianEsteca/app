import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppLayout } from './components/AppLayout';
import InicioPage from './pages/InicioPage';
import CrearTorneoPage from './pages/CrearTorneoPage';
import SorteoPage from './pages/SorteoPage';
import JornadasPage from './pages/JornadasPage';
import TablaGeneralPage from './pages/TablaGeneralPage';
import EliminacionPage from './pages/EliminacionPage';
import EstadisticasPage from './pages/EstadisticasPage';
import CreditosPage from './pages/CreditosPage';
import ViewerPage from './pages/ViewerPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public viewer (no sidebar) */}
        <Route path="/v/:id" element={<ViewerPage />} />

        {/* Admin / editor (with sidebar layout) */}
        <Route element={<AppLayout />}>
          <Route index element={<InicioPage />} />
          <Route path="crear" element={<CrearTorneoPage />} />
          <Route path="creditos" element={<CreditosPage />} />
          <Route path="t/:id">
            <Route index element={<Navigate to="sorteo" replace />} />
            <Route path="sorteo" element={<SorteoPage />} />
            <Route path="jornadas" element={<JornadasPage />} />
            <Route path="tabla" element={<TablaGeneralPage />} />
            <Route path="eliminacion" element={<EliminacionPage />} />
            <Route path="estadisticas" element={<EstadisticasPage />} />
          </Route>
        </Route>
      </Routes>
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#121830',
            border: '1px solid #2A3458',
            color: '#F8FAFC',
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
