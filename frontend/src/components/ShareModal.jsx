import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, X, Share2, Eye, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { toast } from 'sonner';

export const ShareModal = ({ open, onOpenChange, tournament }) => {
  const [tab, setTab] = useState('link');
  if (!tournament) return null;

  const url = `${window.location.origin}/v/${tournament.id}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#121830] border-[#2A3458] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white font-['Outfit'] flex items-center gap-2">
            <Share2 className="w-5 h-5 text-orange-400" />
            Compartir torneo
          </DialogTitle>
          <DialogDescription className="sr-only">
            Comparte este torneo con espectadores mediante un enlace público o un código QR.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-gray-400">
          Comparte este enlace o código QR. Los espectadores podrán ver el torneo en modo lectura.
        </p>

        <div className="flex gap-1 bg-[#0A0E1F] border border-[#2A3458] rounded-md p-1">
          <button
            onClick={() => setTab('link')}
            data-testid="share-tab-link"
            className={`flex-1 py-2 px-3 text-xs font-bold tracking-tight rounded transition ${tab === 'link' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Enlace
          </button>
          <button
            onClick={() => setTab('qr')}
            data-testid="share-tab-qr"
            className={`flex-1 py-2 px-3 text-xs font-bold tracking-tight rounded transition ${tab === 'qr' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Código QR
          </button>
        </div>

        {tab === 'link' && (
          <div className="space-y-3">
            <div className="bg-[#0A0E1F] border border-[#2A3458] rounded-md p-3">
              <p className="label-caps mb-1">URL pública</p>
              <p data-testid="share-url" className="text-white text-sm break-all font-mono">{url}</p>
            </div>
            <Button onClick={copy} data-testid="copy-share-link" className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold">
              <Copy className="w-4 h-4 mr-2" />Copiar enlace
            </Button>
          </div>
        )}

        {tab === 'qr' && (
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG
                value={url}
                size={200}
                fgColor="#0A0E1F"
                bgColor="#FFFFFF"
                level="M"
                imageSettings={tournament.primary_logo ? {
                  src: tournament.primary_logo,
                  height: 36, width: 36, excavate: true,
                } : undefined}
              />
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <QrCode className="w-3 h-3" />Escanea con la cámara del teléfono
            </p>
          </div>
        )}

        <div className="mt-2 flex items-center gap-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs">
          <Eye className="w-3.5 h-3.5 shrink-0" />
          Modo Espectador: solo lectura. Los espectadores no pueden editar nada.
        </div>
      </DialogContent>
    </Dialog>
  );
};
