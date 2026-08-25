import { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { EVENTS, TAVERNS, TRINKETS, rand } from '../lib/data';

type TabKey = 'tavern' | 'event' | 'trinket';

const TABS: { key: TabKey; label: string; table: string[]; hint: string }[] = [
  { key: 'tavern', label: 'Таверна', table: TAVERNS, hint: 'Где партия пропьёт золото' },
  { key: 'event', label: 'Событие', table: EVENTS, hint: 'Что встретится на дороге' },
  { key: 'trinket', label: 'Безделушка', table: TRINKETS, hint: 'Что найдут в сундуке' },
];

export default function TablesNotes({ notify }: { notify: (msg: string, kind?: 'gold' | 'red' | 'plain') => void }) {
  const [tab, setTab] = useState<TabKey>('tavern');
  const [result, setResult] = useState<Record<TabKey, { die: number; item: string } | null>>({
    tavern: null,
    event: null,
    trinket: null,
  });
  const [spinning, setSpinning] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const [notes, setNotes] = useLocalStorage<string>('dm.notes.v1', '');
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const active = TABS.find((t) => t.key === tab)!;

  const rollTable = () => {
    if (spinning) return;
    setSpinning(true);
    window.setTimeout(() => {
      const die = rand(8);
      setResult((r) => ({ ...r, [tab]: { die, item: active.table[die - 1] } }));
      setSpinning(false);
    }, 380);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ---- Случайные таблицы ---- */}
      <div className="panel panel-etched corner-notch px-6 py-6">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl tracking-wide text-[#efe3cd]">Колесо случая</h2>
          <span className="font-ui text-xs text-[#9c8462]">d8 решает</span>
        </div>

        <div className="mt-4 flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`font-ui cursor-pointer rounded-sm border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                tab === t.key
                  ? 'border-[#f08c2e]/70 bg-[#f08c2e]/12 text-[#ffb347]'
                  : 'border-[#372918] text-[#9c8462] hover:border-[#443220] hover:text-[#c9b693]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex min-h-[132px] items-center gap-4">
          <button
            onClick={rollTable}
            className={`font-display flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-sm border text-2xl transition-all duration-200 ${
              spinning
                ? 'animate-pulse border-[#f08c2e] text-[#ffb347]'
                : 'border-[#d9a84e]/50 bg-black/25 text-[#d9a84e] hover:border-[#d9a84e] hover:bg-[#d9a84e]/10 hover:shadow-[0_0_18px_rgba(217,168,78,0.2)]'
            }`}
            aria-label="Бросить d8 по таблице"
            title="Бросок d8"
          >
            {spinning ? '?' : result[tab]?.die ?? 'd8'}
          </button>
          <div key={`${tab}-${result[tab]?.item ?? 'none'}`} className={result[tab] ? 'npc-in' : ''}>
            {result[tab] ? (
              <>
                <p className="font-display text-xl leading-snug text-[#efe3cd]">{result[tab]!.item}</p>
                <p className="font-ui mt-1 text-xs text-[#7d6847]">{active.hint}</p>
              </>
            ) : (
              <p className="font-ui text-sm text-[#7d6847]">{active.hint}. Щёлкните по куби — и судьба подскажет.</p>
            )}
          </div>
        </div>
      </div>

      {/* ---- Заметки ---- */}
      <div className="panel panel-etched corner-notch flex flex-col px-6 py-6">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl tracking-wide text-[#efe3cd]">Журнал сессии</h2>
          {savedAt && (
            <span className="font-ui row-in text-xs text-[#5fc4a4]">✓ сохранено {savedAt}</span>
          )}
        </div>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setSavedAt(new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
          }}
          placeholder={'Имена, которые нельзя забыть…\n«Торговался с гоблином. Проиграл.»\nКуда делся ключ от склепа?'}
          className="scroll-slim mt-4 min-h-[170px] flex-1 resize-none rounded-sm border border-[#443220] bg-black/30 px-3.5 py-3 text-[15px] leading-relaxed text-[#efe3cd] placeholder-[#7d6847]"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="font-ui text-xs text-[#7d6847]">{notes.length} симв. · хранится в браузере</span>
          {notes.length > 0 && (
            <button
              onClick={() => {
                if (!confirmClear) {
                  setConfirmClear(true);
                  window.setTimeout(() => setConfirmClear(false), 2500);
                  return;
                }
                setNotes('');
                setSavedAt(null);
                setConfirmClear(false);
                notify('Журнал очищен');
              }}
              className={`font-ui cursor-pointer text-xs font-bold uppercase tracking-wider transition-colors ${
                confirmClear ? 'text-[#d4553f]' : 'text-[#9c8462] hover:text-[#d4553f]'
              }`}
            >
              {confirmClear ? 'Точно стереть?' : 'Очистить'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
