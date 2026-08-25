import { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DICE, rand, uid } from '../lib/data';

type Roll = { sides: number; value: number };
type HistoryEntry = {
  id: string;
  ts: number;
  label: string;
  rolls: Roll[];
  total: number;
  crit: 'max' | 'min' | null;
};

export function DieIcon({ sides, size = 20, className = '' }: { sides: number; size?: number; className?: string }) {
  const shapes: Record<number, string> = {
    4: '12 2.5 21.5 19.5 2.5 19.5',
    6: '4.5 4.5 19.5 4.5 19.5 19.5 4.5 19.5',
    8: '12 2 21 12 12 22 3 12',
    10: '12 2 20.5 10.5 12 22 3.5 10.5',
    12: '12 2.5 21 9.3 17.7 19.8 6.3 19.8 3 9.3',
    20: '12 2 20.7 7 20.7 17 12 22 3.3 17 3.3 7',
    100: '12 2.5 21.5 12 12 21.5 2.5 12',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <polygon points={shapes[sides]} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      {sides === 20 && (
        <polygon points="12 7 16.4 14.5 7.6 14.5" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" opacity="0.7" />
      )}
      {sides === 100 && <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />}
    </svg>
  );
}

const chipTone = (r: Roll) =>
  r.value === r.sides
    ? 'border-[#d9a84e] text-[#ffd98c] bg-[#d9a84e]/10 shadow-[0_0_14px_rgba(217,168,78,0.25)]'
    : r.value === 1
      ? 'border-[#d4553f]/70 text-[#f0a08d] bg-[#d4553f]/10'
      : 'border-[#443220] text-[#efe3cd] bg-black/25';

export default function DiceRoller({ notify }: { notify: (msg: string, kind?: 'gold' | 'red' | 'plain') => void }) {
  const [pool, setPool] = useState<Record<number, number>>({});
  const [mod, setMod] = useState(0);
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [rolling, setRolling] = useState(false);
  const [lastTotal, setLastTotal] = useState<number | null>(null);
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>('dm.history.v1', []);

  const [fate, setFate] = useState<number | null>(null);
  const [fateRolling, setFateRolling] = useState(false);
  const [fateState, setFateState] = useState<'none' | 'max' | 'min'>('none');
  const fateTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const fateStop = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (fateTimer.current) clearInterval(fateTimer.current);
      if (fateStop.current) clearTimeout(fateStop.current);
    },
    [],
  );

  const poolCount = Object.values(pool).reduce((a, b) => a + b, 0);
  const poolLabel =
    DICE.filter((d) => (pool[d] ?? 0) > 0)
      .map((d) => `${pool[d]}d${d}`)
      .join(' + ') + (mod !== 0 ? ` ${mod > 0 ? '+' : '−'} ${Math.abs(mod)}` : '');

  const addDie = (sides: number) => setPool((p) => ({ ...p, [sides]: (p[sides] ?? 0) + 1 }));
  const removeDie = (sides: number) =>
    setPool((p) => {
      const next = { ...p, [sides]: Math.max(0, (p[sides] ?? 0) - 1) };
      if (next[sides] === 0) delete next[sides];
      return next;
    });

  const rollPool = () => {
    if (poolCount === 0 || rolling) return;
    setRolling(true);
    setLastTotal(null);
    window.setTimeout(() => {
      const results: Roll[] = DICE.filter((d) => (pool[d] ?? 0) > 0).flatMap((d) =>
        Array.from({ length: pool[d] }, () => ({ sides: d as number, value: rand(d) })),
      );
      const sum = results.reduce((a, r) => a + r.value, 0);
      const total = sum + mod;
      const anyMax = results.some((r) => r.sides === 20 && r.value === 20);
      const anyMin = results.some((r) => r.sides === 20 && r.value === 1);
      setRolls(results);
      setLastTotal(total);
      setRolling(false);
      setHistory((h) =>
        [
          {
            id: uid(),
            ts: Date.now(),
            label: poolLabel || '—',
            rolls: results,
            total,
            crit: anyMax ? 'max' : anyMin ? 'min' : null,
          } as HistoryEntry,
          ...h,
        ].slice(0, 24),
      );
      notify(`${poolLabel} → ${total}`, anyMax ? 'gold' : anyMin ? 'red' : 'plain');
    }, 520);
  };

  const rollFate = () => {
    if (fateRolling) return;
    setFateRolling(true);
    setFateState('none');
    fateTimer.current = setInterval(() => setFate(rand(20)), 55);
    fateStop.current = setTimeout(() => {
      if (fateTimer.current) clearInterval(fateTimer.current);
      const v = rand(20);
      setFate(v);
      setFateState(v === 20 ? 'max' : v === 1 ? 'min' : 'none');
      setFateRolling(false);
      setHistory((h) =>
        [
          {
            id: uid(),
            ts: Date.now(),
            label: 'd20 · кость судьбы',
            rolls: [{ sides: 20, value: v }],
            total: v,
            crit: v === 20 ? 'max' : v === 1 ? 'min' : null,
          } as HistoryEntry,
          ...h,
        ].slice(0, 24),
      );
      notify(v === 20 ? 'Критический успех — 20!' : v === 1 ? 'Критический провал — 1…' : `d20 → ${v}`, v === 20 ? 'gold' : v === 1 ? 'red' : 'plain');
    }, 780);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* ---- Кость судьбы ---- */}
      <div className="panel panel-etched corner-notch relative flex flex-col items-center overflow-hidden px-6 py-8">
        <p className="font-ui text-[11px] font-bold uppercase tracking-[0.3em] text-[#9c8462]">Кость судьбы</p>
        <button
          onClick={rollFate}
          className={`group relative mt-5 cursor-pointer select-none ${fateRolling ? 'fate-shake' : ''} ${fateState === 'max' ? 'crit-glow' : ''} ${fateState === 'min' ? 'fumble-glow' : ''}`}
          aria-label="Бросить d20"
          title="Бросить d20"
        >
          <svg width="210" height="210" viewBox="0 0 100 100" className="transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105">
            <defs>
              <linearGradient id="fateFace" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3a2a17" />
                <stop offset="55%" stopColor="#2a1d10" />
                <stop offset="100%" stopColor="#1c120a" />
              </linearGradient>
            </defs>
            <polygon points="50 4 90 27 90 73 50 96 10 73 10 27" fill="url(#fateFace)" stroke="#d9a84e" strokeWidth="1.6" />
            <polygon points="50 28 69 61 31 61" fill="rgba(0,0,0,0.32)" stroke="#d9a84e" strokeWidth="0.9" />
            <line x1="50" y1="4" x2="50" y2="28" stroke="#d9a84e" strokeWidth="0.6" opacity="0.55" />
            <line x1="90" y1="27" x2="50" y2="28" stroke="#d9a84e" strokeWidth="0.6" opacity="0.55" />
            <line x1="10" y1="27" x2="50" y2="28" stroke="#d9a84e" strokeWidth="0.6" opacity="0.55" />
            <line x1="90" y1="73" x2="69" y2="61" stroke="#d9a84e" strokeWidth="0.6" opacity="0.55" />
            <line x1="10" y1="73" x2="31" y2="61" stroke="#d9a84e" strokeWidth="0.6" opacity="0.55" />
            <line x1="50" y1="96" x2="31" y2="61" stroke="#d9a84e" strokeWidth="0.6" opacity="0.55" />
            <line x1="50" y1="96" x2="69" y2="61" stroke="#d9a84e" strokeWidth="0.6" opacity="0.55" />
          </svg>
          <span
            key={`${fate}-${fateState}`}
            className={`font-display pointer-events-none absolute inset-0 flex items-center justify-center text-6xl ${
              fateState === 'max'
                ? 'text-[#ffd98c] drop-shadow-[0_0_16px_rgba(255,179,71,0.8)]'
                : fateState === 'min'
                  ? 'text-[#f0a08d] drop-shadow-[0_0_14px_rgba(212,85,63,0.7)]'
                  : 'text-[#efe3cd]'
            } ${fateRolling ? 'opacity-70' : 'die-pop'}`}
          >
            {fate ?? 'd20'}
          </span>
        </button>
        <p className="font-ui mt-4 text-sm text-[#9c8462]">
          {fateRolling
            ? 'Кость кружится…'
            : fateState === 'max'
              ? 'Сама удача смотрит на вас. Запишите это.'
              : fateState === 'min'
                ? 'Что ж… бывает. Отыграйте это красиво.'
                : fate === null
                  ? 'Нажмите, чтобы бросить проверку'
                  : 'Ещё раз? Кость не обижается.'}
        </p>
      </div>

      {/* ---- Лоток костей ---- */}
      <div className="panel panel-etched corner-notch flex flex-col px-6 py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl tracking-wide text-[#efe3cd]">Лоток костей</h2>
          <span className="font-ui text-xs uppercase tracking-[0.22em] text-[#9c8462]">соберите пул — затем бросайте</span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {DICE.map((d) => (
            <div key={d} className="group relative">
              <button
                onClick={() => addDie(d)}
                className="btn-ghost flex w-full flex-col items-center gap-1 rounded-sm px-1 py-2.5"
                aria-label={`Добавить d${d}`}
                title={`Добавить d${d}`}
              >
                <DieIcon sides={d} size={26} className="text-[#d9a84e] transition-transform duration-200 group-hover:-rotate-12 group-hover:scale-110" />
                <span className="font-ui text-xs font-bold text-[#c9b693]">d{d}</span>
              </button>
              {(pool[d] ?? 0) > 0 && (
                <button
                  onClick={() => removeDie(d)}
                  className="row-in font-ui absolute -top-1.5 -right-1.5 flex h-5 min-w-5 cursor-pointer items-center justify-center rounded-full border border-[#f08c2e] bg-[#3a2410] px-1 text-[11px] font-bold text-[#ffb347] hover:bg-[#f08c2e] hover:text-[#241303]"
                  aria-label={`Убрать d${d}`}
                >
                  {pool[d]}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button onClick={() => setMod((m) => m - 1)} className="btn-ghost h-8 w-8 cursor-pointer rounded-sm text-lg leading-none" aria-label="Уменьшить модификатор">−</button>
            <span className="font-ui w-14 text-center text-sm font-bold text-[#efe3cd]">
              {mod > 0 ? `+${mod}` : mod}
            </span>
            <button onClick={() => setMod((m) => m + 1)} className="btn-ghost h-8 w-8 cursor-pointer rounded-sm text-lg leading-none" aria-label="Увеличить модификатор">+</button>
            <span className="font-ui ml-1 text-xs text-[#9c8462]">модификатор</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {poolCount > 0 && (
              <button onClick={() => setPool({})} className="btn-ghost cursor-pointer rounded-sm px-3 py-2 text-xs uppercase tracking-wider">
                Сброс
              </button>
            )}
            <button
              onClick={rollPool}
              disabled={poolCount === 0 || rolling}
              className="btn-ember cursor-pointer rounded-sm px-6 py-2 text-sm font-extrabold uppercase tracking-[0.14em]"
            >
              {rolling ? 'Бросок…' : 'Бросить'}
            </button>
          </div>
        </div>

        <div className="divider-rune my-4" />

        <div className="min-h-[92px]">
          {poolCount === 0 && rolls.length === 0 && (
            <p className="font-ui pt-2 text-center text-sm text-[#7d6847]">
              Кости ждут. Щёлкните по куби, чтобы добавить его в пул — например, <button onClick={() => { setPool({ 6: 2 }); setMod(3); }} className="cursor-pointer text-[#d9a84e] underline decoration-dotted underline-offset-2 hover:text-[#ffd98c]">2d6+3</button>.
            </p>
          )}
          {poolCount > 0 && rolls.length === 0 && (
            <p className="font-ui pt-2 text-center text-sm text-[#c9b693]">
              Пул: <span className="font-bold text-[#ffd98c]">{poolLabel || '—'}</span>
            </p>
          )}
          {rolls.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {rolls.map((r, i) => (
                <span
                  key={`${r.sides}-${i}-${lastTotal}`}
                  className={`die-pop font-ui flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-sm font-bold ${chipTone(r)}`}
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <DieIcon sides={r.sides} size={15} className="opacity-80" />
                  {r.value}
                </span>
              ))}
              {lastTotal !== null && (
                <span
                  className="die-pop font-display ml-2 rounded-sm border border-[#f08c2e]/60 bg-[#f08c2e]/10 px-4 py-1 text-2xl text-[#ffb347]"
                  style={{ animationDelay: `${rolls.length * 70 + 90}ms` }}
                >
                  = {lastTotal}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-ui text-[11px] font-bold uppercase tracking-[0.26em] text-[#9c8462]">Летопись бросков</h3>
            {history.length > 0 && (
              <button onClick={() => setHistory([])} className="font-ui cursor-pointer text-xs text-[#7d6847] underline decoration-dotted underline-offset-2 hover:text-[#d4553f]">
                очистить
              </button>
            )}
          </div>
          <ul className="scroll-slim mt-2 max-h-40 space-y-1 overflow-y-auto pr-1">
            {history.length === 0 && <li className="font-ui py-2 text-center text-xs text-[#7d6847]">Здесь осядут все броски сессии.</li>}
            {history.map((h) => (
              <li key={h.id} className="row-in font-ui flex items-center gap-2 rounded-sm bg-black/20 px-2.5 py-1.5 text-xs">
                <span className="text-[#7d6847]">
                  {new Date(h.ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="truncate text-[#c9b693]">{h.label}</span>
                <span className="ml-auto shrink-0 text-[#7d6847]">[{h.rolls.map((r) => r.value).join(', ')}]</span>
                <span
                  className={`font-display shrink-0 text-base ${
                    h.crit === 'max' ? 'text-[#ffd98c]' : h.crit === 'min' ? 'text-[#f0a08d]' : 'text-[#efe3cd]'
                  }`}
                >
                  {h.total}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
