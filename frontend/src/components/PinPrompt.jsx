import { useState } from 'react';
import { Lock, KeyRound } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { setAdminUnlocked } from '../utils/auth';
import { api } from '../utils/api';

export const PinPrompt = ({ open, onOpenChange, tournamentId, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!pin.trim()) {
      toast.error('Ingresa el PIN del torneo');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post(`/tournaments/${tournamentId}/verify-pin`, { pin });
      if (data.valid) {
        setAdminUnlocked(tournamentId);
        toast.success('Modo Admin activado');
        setPin('');
        onUnlock?.();
        onOpenChange(false);
      } else {
        toast.error('PIN incorrecto');
      }
    } catch {
      toast.error('Error al verificar PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#121830] border-[#2A3458] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white font-['Outfit'] flex items-center gap-2">
            <Lock className="w-5 h-5 text-orange-400" />
            Modo Administrador
          </DialogTitle>
          <DialogDescription className="sr-only">
            Ingresa el PIN de 4 dígitos del torneo para activar las funciones de edición.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-gray-400">
          Ingresa el PIN del torneo para acceder a las funciones de edición.
        </p>
        <div className="space-y-3">
          <div>
            <p className="label-caps mb-1.5">PIN</p>
            <Input
              data-testid="pin-input"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="••••"
              className="bg-[#0A0E1F] border-[#2A3458] text-white h-12 text-center font-['Outfit'] font-black text-2xl tracking-[0.5em] focus-visible:ring-orange-500"
            />
          </div>
          <Button
            data-testid="pin-submit"
            onClick={submit}
            disabled={loading || pin.length < 1}
            className="w-full h-11 bg-orange-500 hover:bg-orange-400 text-white font-bold"
          >
            <KeyRound className="w-4 h-4 mr-2" />
            {loading ? 'Verificando...' : 'Desbloquear'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
