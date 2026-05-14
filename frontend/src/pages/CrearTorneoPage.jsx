import { useState, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Image as ImageIcon, Upload, Trophy, Plus } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select';
import { createTournament } from '../utils/api';
import { toast } from 'sonner';

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function CrearTorneoPage() {
  const navigate = useNavigate();
  const { refreshList } = useOutletContext();
  const [form, setForm] = useState({
    name: 'Copa ESTECA 2026',
    format: 'liga',
    teams_count: 11,
    matchdays_count: 6,
    qualifiers_count: 4,
    matches_per_team: 6,
    allow_auto_rest: true,
    auto_generate: false,
    primary_logo: '',
    secondary_logo: '',
  });
  const [saving, setSaving] = useState(false);
  const primaryRef = useRef(null);
  const secondaryRef = useRef(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleUpload = async (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 2 MB');
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    set(key, dataUrl);
  };

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error('Ingresa un nombre');
      return;
    }
    if (form.teams_count < 2) {
      toast.error('Mínimo 2 equipos');
      return;
    }
    if (form.matchdays_count < 1) {
      toast.error('Mínimo 1 jornada');
      return;
    }
    setSaving(true);
    try {
      const created = await createTournament(form);
      toast.success(`Torneo "${created.name}" creado`);
      await refreshList();
      navigate(`/t/${created.id}/sorteo`);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="label-caps">Configuración</p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white">
            Crear nuevo <span className="gold-text">torneo</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Define los parámetros principales. Podrás agregar equipos en el siguiente paso.
          </p>
        </motion.div>

        {/* Section: General */}
        <Section title="Información general" step="01">
          <Field label="Nombre del torneo">
            <Input
              data-testid="form-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ej. Copa ESTECA 2026"
              className="bg-[#0A0E1F] border-[#2A3458] text-white h-11 focus-visible:ring-orange-500"
            />
          </Field>
          <Field label="Tipo de torneo">
            <Select value={form.format} onValueChange={(v) => set('format', v)}>
              <SelectTrigger data-testid="form-format" className="bg-[#0A0E1F] border-[#2A3458] text-white h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#121830] border-[#2A3458] text-white">
                <SelectItem value="liga" className="focus:bg-orange-500/10">Liga regular</SelectItem>
                <SelectItem value="liga_ko" className="focus:bg-orange-500/10">Liga + Eliminación directa</SelectItem>
                <SelectItem value="ko" className="focus:bg-orange-500/10">Eliminación directa</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Section>

        {/* Section: Numbers */}
        <Section title="Configuración numérica" step="02">
          <Field label="Cantidad de equipos">
            <NumberInput
              testId="form-teams-count"
              value={form.teams_count}
              min={2}
              max={64}
              onChange={(v) => set('teams_count', v)}
            />
          </Field>
          <Field label="Cantidad de jornadas">
            <NumberInput
              testId="form-matchdays-count"
              value={form.matchdays_count}
              min={1}
              max={40}
              onChange={(v) => set('matchdays_count', v)}
            />
          </Field>
          <Field label="Equipos que clasifican">
            <NumberInput
              testId="form-qualifiers-count"
              value={form.qualifiers_count}
              min={2}
              max={Math.max(2, form.teams_count)}
              onChange={(v) => set('qualifiers_count', v)}
            />
          </Field>
          <Field label="Partidos por equipo (máx)">
            <NumberInput
              testId="form-matches-per-team"
              value={form.matches_per_team}
              min={1}
              max={form.matchdays_count}
              onChange={(v) => set('matches_per_team', v)}
            />
          </Field>
        </Section>

        {/* Section: Toggles */}
        <Section title="Reglas del sorteo" step="03">
          <ToggleRow
            label="Permitir descansos automáticos"
            description="Asigna descansos cuando hay número impar de equipos."
            value={form.allow_auto_rest}
            onChange={(v) => set('allow_auto_rest', v)}
            testId="form-auto-rest"
          />
          <ToggleRow
            label="Activar generación automática"
            description="Generará el torneo completo al guardar los equipos."
            value={form.auto_generate}
            onChange={(v) => set('auto_generate', v)}
            testId="form-auto-generate"
          />
        </Section>

        {/* Section: Logos */}
        <Section title="Identidad visual" step="04">
          <LogoUpload
            label="Logo principal del torneo"
            value={form.primary_logo}
            onPick={() => primaryRef.current?.click()}
            onClear={() => set('primary_logo', '')}
            inputRef={primaryRef}
            onFile={(e) => handleUpload(e, 'primary_logo')}
            testId="form-primary-logo"
          />
          <LogoUpload
            label="Logo secundario (escuela / patrocinador)"
            value={form.secondary_logo}
            onPick={() => secondaryRef.current?.click()}
            onClear={() => set('secondary_logo', '')}
            inputRef={secondaryRef}
            onFile={(e) => handleUpload(e, 'secondary_logo')}
            testId="form-secondary-logo"
          />
        </Section>

        <div className="flex flex-col sm:flex-row gap-3 justify-end mt-8">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="border-[#2A3458] text-white hover:bg-[#121830] hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            data-testid="submit-create-tournament"
            onClick={submit}
            disabled={saving}
            className="h-12 px-6 bg-orange-500 hover:bg-orange-400 text-white font-bold tracking-tight shadow-[0_0_24px_rgba(242,99,33,0.30)]"
          >
            <Trophy className="w-4 h-4 mr-2" />
            {saving ? 'Creando...' : 'Crear torneo'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

const Section = ({ title, step, children }) => (
  <motion.section
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#121830] border border-[#2A3458] rounded-xl p-6 mb-6"
  >
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-md bg-orange-500/10 border border-orange-500/30 flex items-center justify-center font-['Outfit'] font-bold text-orange-400 text-sm">
        {step}
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  </motion.section>
);

const Field = ({ label, children }) => (
  <div>
    <Label className="label-caps mb-2 block">{label}</Label>
    {children}
  </div>
);

const NumberInput = ({ value, min, max, onChange, testId }) => (
  <div className="flex items-center gap-2">
    <button
      onClick={() => onChange(Math.max(min, value - 1))}
      className="w-11 h-11 rounded-md bg-[#0A0E1F] border border-[#2A3458] text-white hover:border-orange-500 transition"
      aria-label="Disminuir"
    >
      −
    </button>
    <Input
      data-testid={testId}
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => {
        const v = parseInt(e.target.value, 10);
        if (Number.isFinite(v)) onChange(Math.max(min, Math.min(max, v)));
      }}
      className="bg-[#0A0E1F] border-[#2A3458] text-white h-11 text-center font-['Outfit'] font-bold focus-visible:ring-orange-500"
    />
    <button
      onClick={() => onChange(Math.min(max, value + 1))}
      className="w-11 h-11 rounded-md bg-[#0A0E1F] border border-[#2A3458] text-white hover:border-orange-500 transition"
      aria-label="Aumentar"
    >
      +
    </button>
  </div>
);

const ToggleRow = ({ label, description, value, onChange, testId }) => (
  <div className="md:col-span-2 flex items-center justify-between p-4 bg-[#0A0E1F] border border-[#2A3458] rounded-md">
    <div>
      <p className="text-white font-semibold">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
    <Switch
      data-testid={testId}
      checked={value}
      onCheckedChange={onChange}
      className="data-[state=checked]:bg-orange-500"
    />
  </div>
);

const LogoUpload = ({ label, value, onPick, onClear, inputRef, onFile, testId }) => (
  <div className="md:col-span-1">
    <Label className="label-caps mb-2 block">{label}</Label>
    <div className="bg-[#0A0E1F] border border-dashed border-[#2A3458] rounded-md p-4 flex items-center gap-3">
      <div className="w-16 h-16 bg-[#121830] rounded-md flex items-center justify-center overflow-hidden border border-[#2A3458] shrink-0">
        {value ? (
          <img src={value} alt={label} className="max-w-full max-h-full object-contain" />
        ) : (
          <ImageIcon className="w-6 h-6 text-gray-600" />
        )}
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          className="hidden"
          data-testid={testId}
        />
        <Button
          variant="outline"
          onClick={onPick}
          className="border-[#2A3458] text-white hover:bg-[#121830] hover:text-orange-300 hover:border-orange-500/40 h-9"
        >
          <Upload className="w-3.5 h-3.5 mr-2" />
          {value ? 'Reemplazar' : 'Subir imagen'}
        </Button>
        {value && (
          <button onClick={onClear} className="text-xs text-red-400 hover:text-red-300 self-start">
            Quitar
          </button>
        )}
      </div>
    </div>
  </div>
);
