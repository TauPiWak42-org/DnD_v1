import { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CLASSES, FEMALE_NAMES, MALE_NAMES, QUIRKS, RACES, SURNAMES, pick, uid } from '../lib/data';

type Npc = {
  id: string;
  name: string;
  race: string;
  cls: string;
  quirk: string;
};

const generate = (): Npc => {
  const female = Math.random() < 0.5;
  return {
    id: uid(),
    name: `${pick(female ? FEMALE_NAMES : MALE_NAMES)} ${pick(SURNAMES)}`,
    race: pick(RACES),
    cls: pick(CLASSES),
    quirk: pick(QUIRKS),
};
};

export default function NpcGenerator({ notify }: { notify: (msg: string, kind?: 'gold' | 'red' | 'plain') => void }) {
  const [npc, setNpc] = useState<Npc | null>(null);
  const [casting, setCasting] = useState(false);
  const [saved, setSaved] = useLocalStorage<Npc[]>('dm.npcs.v1', []);

  const summon = () => {
    if (casting) return;
    setCasting(true);
    window.setTimeout(() => {
      setNpc(generate());
      setCasting(false);
    }, 340);
  };

  const save = () => {
    if (!npc || saved.some((s) => s.id === npc.id)) return;
    setSaved((s) => [npc, ...s].slice(0, 12));
    notify(`${npc.name} — в записной книге`, 'gold');
  };

  return (
    <div className="panel panel-etched corner-notch flex h-full flex-col px-6 py-6">
      <h2 className="font-display text-2xl tracking-wide text-[#efe3cd]">Призыв NPC</h2>
      <p className="font-ui text-xs uppercase tracking-[0.22em] text-[#9c8462]">когда игрокам нужен кто-то за стойкой</p>

      <button
        onClick={summon}
        className="btn-ember mt-5 w-full cursor-pointer rounded-sm px-4 py-3 text-sm font-extrabold uppercase tracking-[0.16em]"
      >
        {casting ? 'Туман сгущается…' : '✦ Призвать прохожего'}
      </button>

      <div className="mt-5 min-h-[168px]">
        {!npc && !casting && (
          <div className="flex h-full min-h-[168px] flex-col items-center justify-center rounded-sm border border-dashed border-[#443220] px-4 text-center">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" className="text-[#7d6847]" aria-hidden="true">
              <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
            </svg>
            <p className="font-ui mt-3 text-sm text-[#7d6847]">Трактирщик, наёмник, загадочный старик — кто выйдет из тумана?</p>
          </div>
        )}
        {casting && (
          <div className="flex h-full min-h-[168px] items-center justify-center">
            <span className="font-display animate-pulse text-2xl tracking-[0.3em] text-[#9c8462]">· · ·</span>
          </div>
        )}
        {npc && !casting && (
          <div key={npc.id} className="npc-in rounded-sm border border-[#5fc4a4]/35 bg-[#5fc4a4]/6 px-4 py-4">
            <p className="font-ui text-[10px] font-bold uppercase tracking-[0.26em] text-[#5fc4a4]">
              {npc.race} · {npc.cls}
            </p>
            <p className="font-display mt-1 text-2xl leading-tight text-[#efe3cd]">{npc.name}</p>
            <p className="mt-2 text-sm text-[#c9b693]">
              <span className="font-ui text-xs font-bold uppercase tracking-wider text-[#9c8462]">Привычка: </span>
              {npc.quirk}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={save}
                disabled={saved.some((s) => s.id === npc.id)}
                className="btn-ghost cursor-pointer rounded-sm px-3 py-1.5 text-xs font-bold text-[#d9a84e] disabled:cursor-default"
              >
                {saved.some((s) => s.id === npc.id) ? '✓ Записан' : '✎ В книгу'}
              </button>
              <button onClick={summon} className="btn-ghost cursor-pointer rounded-sm px-3 py-1.5 text-xs">
                Ещё одного
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <h3 className="font-ui text-[11px] font-bold uppercase tracking-[0.26em] text-[#9c8462]">Записная книга</h3>
        {saved.length > 0 && (
          <button onClick={() => setSaved([])} className="font-ui cursor-pointer text-xs text-[#7d6847] underline decoration-dotted underline-offset-2 hover:text-[#d4553f]">
            очистить
          </button>
        )}
      </div>
      <ul className="scroll-slim mt-2 max-h-44 flex-1 space-y-1 overflow-y-auto pr-1">
        {saved.length === 0 && <li className="font-ui py-2 text-center text-xs text-[#7d6847]">Пока никого не записали.</li>}
        {saved.map((n) => (
          <li key={n.id} className="row-in group flex items-baseline gap-2 rounded-sm bg-black/20 px-2.5 py-1.5">
            <span className="font-ui shrink-0 truncate text-sm font-bold text-[#efe3cd]">{n.name}</span>
            <span className="font-ui truncate text-xs text-[#7d6847]">{n.race} · {n.cls}</span>
            <button
              onClick={() => setSaved((s) => s.filter((x) => x.id !== n.id))}
              className="font-ui ml-auto shrink-0 cursor-pointer text-xs text-[#7d6847] opacity-0 transition-opacity hover:text-[#d4553f] group-hover:opacity-100"
              aria-label={`Убрать ${n.name}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
