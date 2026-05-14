import { useState } from 'react';
import { Check, X, Edit3, Clock } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from './ui/select';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_progress', label: 'En juego' },
  { value: 'finished', label: 'Finalizado' },
];

export const MatchEditor = ({ match, onSave, onCancel, readOnly = false }) => {
  const [scoreA, setScoreA] = useState(match.scoreA ?? '');
  const [scoreB, setScoreB] = useState(match.scoreB ?? '');
  const [date, setDate] = useState(match.date || '');
  const [time, setTime] = useState(match.time || '');
  const [status, setStatus] = useState(match.status || 'pending');

  const save = () => {
    const a = scoreA === '' ? null : parseInt(scoreA, 10);
    const b = scoreB === '' ? null : parseInt(scoreB, 10);
    const finalStatus = (a != null && b != null) ? 'finished' : status;
    onSave({
      ...match,
      scoreA: Number.isFinite(a) ? a : null,
      scoreB: Number.isFinite(b) ? b : null,
      date,
      time,
      status: finalStatus,
    });
  };

  return (
    <div className="bg-[#0A0E1F] border border-orange-500/40 rounded-md p-4 space-y-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <span className="text-white font-semibold text-right truncate">{match.teamA}</span>
        <div className="flex items-center gap-1">
          <Input
            data-testid={`score-a-${match.id}`}
            type="number"
            min="0"
            value={scoreA}
            onChange={(e) => setScoreA(e.target.value)}
            disabled={readOnly}
            className="w-14 h-10 text-center bg-[#121830] border-[#2A3458] text-white font-['Outfit'] font-bold focus-visible:ring-orange-500"
          />
          <span className="text-gray-500 mx-1">-</span>
          <Input
            data-testid={`score-b-${match.id}`}
            type="number"
            min="0"
            value={scoreB}
            onChange={(e) => setScoreB(e.target.value)}
            disabled={readOnly}
            className="w-14 h-10 text-center bg-[#121830] border-[#2A3458] text-white font-['Outfit'] font-bold focus-visible:ring-orange-500"
          />
        </div>
        <span className="text-white font-semibold truncate">{match.teamB}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="label-caps mb-1">Fecha</p>
          <Input
            data-testid={`date-${match.id}`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={readOnly}
            className="bg-[#121830] border-[#2A3458] text-white h-9 text-xs focus-visible:ring-orange-500"
          />
        </div>
        <div>
          <p className="label-caps mb-1">Hora</p>
          <Input
            data-testid={`time-${match.id}`}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={readOnly}
            className="bg-[#121830] border-[#2A3458] text-white h-9 text-xs focus-visible:ring-orange-500"
          />
        </div>
        <div>
          <p className="label-caps mb-1">Estado</p>
          <Select value={status} onValueChange={setStatus} disabled={readOnly}>
            <SelectTrigger data-testid={`status-${match.id}`} className="bg-[#121830] border-[#2A3458] text-white h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#121830] border-[#2A3458] text-white">
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value} className="focus:bg-orange-500/10">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} className="border-[#2A3458] text-white hover:bg-[#121830]">
          <X className="w-3.5 h-3.5 mr-1" />Cancelar
        </Button>
        <Button size="sm" onClick={save} data-testid={`save-match-${match.id}`} className="bg-orange-500 hover:bg-orange-400 text-white font-bold">
          <Check className="w-3.5 h-3.5 mr-1" />Guardar
        </Button>
      </div>
    </div>
  );
};
