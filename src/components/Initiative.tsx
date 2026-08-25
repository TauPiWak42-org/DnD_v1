import { useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { rand, uid } from '../lib/data';

type Creature = {
  id: string;
  name: string;
  dex: number;
  hp: number;
  maxHp: number;
  init: number | null;
};

export default function Initiative({ notify }: { notify: (msg: string, kind?: 'gold' | 'red' | 'plain') => void }) {
  const [party, setParty] = useLocalStorage<Creature[]>('dm.party.v1', []);
  const [current, setCurrent] = useState(0);
  const [round, setRound] = useState(1);
  const [form, setForm] = useState({ name: '', dex: 0, hp: 12 });

  const rolled = party.length > 0 && party.every((c) => c.init !== null);

  const order = useMemo(
    () =>
      [...party]
        .filter((c) => c.init !== null)
        .sort((a, b) => (b.init as number) - (a.init as number) || b.dex - a.dex),
    [party],
  );

  const addCreature = () => {
    const name = form.name.trim();
    if (!name) {
      notify('Введите имя бойца', 'red');
      return;
    }
    setParty((p) => [
      ...p,
      { id: uid(), name, dex: form.dex, hp: Math.max(1, form.hp), maxHp: Math.max(1, form.hp), init: null },
    ]);
    setForm((f) => ({ ...f, name: '' }));
    notify(`${name} вступает в бой`);
  };

  const removeCreature = (id: string) => {
    const c = party.find((x) => x.id === id);
    setParty((p) => p.filter((x) => x.id !== id));
    setCurrent(0);
    if (c) notify(`${c.name} покидает бой`);
  };

  const adjustHp = (id: string, delta: number) =>
    setParty((p) =>
      p.map((c) => (c.id === id ? { ...c, hp: Math.min(c.maxHp, Math.max(0, c.hp + delta)) } : c)),
    );

  const rollAll = () => {
    if (party.length === 0) {
      notify('Сначала добавьте бойцов', 'red');
      return;
    }
    setParty((p) => p.map((c) => ({ ...c, init: rand(20) + c.dex })));
    setCurrent(0);
    setRound(1);
    notify('Инициатива брошена — бой начался!', 'gold');
  };

  const nextTurn = () => {
    if (order.length === 0) return;
    if (current + 1 >= order.length) {
      setCurrent(0);
      setRound((r) => r + 1);
      notify(`Раунд ${round + 1}`, 'gold');
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const prevTurn = () => {
    if (order.length === 0) return;
    if (current === 0) {
      setCurrent(order.length - 1);
      setRound((r) => Math.max(1, r - 1));
    } else {
      setCurrent((c) => c - 1);
    }
  };

  const resetFight = () => {
    setParty((p) => p.map((c) => ({ ...c, init: null })));
    setCurrent(0);
    setRound(1);
    notify('Бой сброшен — инициатива не брошена');
  };

  const active = rolled ? order[current] : undefined;

  return (
    <div className="panel panel-etched corner-notch flex h-full flex-col px-6 py-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-wide text-[#efe3cd]">Порядок боя</h2>
          <p className="font-ui text-xs uppercase tracking-[0.22em] text-[#9c8462]">инициатива · раунды · здоровье</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {rolled && (
            <>
              <div className="font-ui rounded-sm border border-[#5fc4a4]/40 bg-[#5fc4a4]/10 px-3 py-1.5 text-center">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5fc4a4]">Раунд</div>
                <div className="font-display text-xl leading-none text-[#bde8d8]">{round}</div>
              </div>
              <button onClick={prevTurn} className="btn-ghost cursor-pointer rounded-sm px-3 py-2 text-sm" aria-label="Предыдущий ход">←</button>
              <button onClick={nextTurn} className="btn-ember cursor-pointer rounded-sm px-4 py-2 text-sm font-extrabold uppercase tracking-wider">
                Ход →
              </button>
            </>
          )}
          <button
            onClick={rolled ? resetFight : rollAll}
            className={`cursor-pointer rounded-sm px-4 py-2 text-sm font-extrabold uppercase tracking-wider ${rolled ? 'btn-ghost' : 'btn-ember'}`}
          >
            {rolled ? 'Сбросить' : '⚔ Инициатива'}
          </button>
        </div>
      </div>

      {rolled && active && (
        <div className="row-in mt-4 flex items-center gap-3 rounded-sm border border-[#f08c2e]/50 bg-[#f08c2e]/8 px-4 py-2.5">
          <span className="font-ui text-[10px] font-bold uppercase tracking-[0.24em] text-[#f08c2e]">Сейчас ходит</span>
          <span className="font-display text-2xl text-[#ffd98c]">{active.name}</span>
          {active.hp === 0 && <span className="font-ui text-xs font-bold uppercase text-[#d4553f]">пал в бою</span>}
        </div>
      )}

      <div className="divider-rune my-4" />

      <ul className="space-y-1.5">
        {party.length === 0 && (
          <li className="font-ui py-4 text-center text-sm text-[#7d6847]">
            Отряд пуст. Добавьте героев и чудовищ — и бросьте инициативу.
          </li>
        )}
        {party.length > 0 && !rolled && (
          <li className="font-ui pb-1 text-center text-xs uppercase tracking-[0.2em] text-[#9c8462]">
            Составьте отряд, затем нажмите «Инициатива»
          </li>
        )}
        {order.map((c, i) => {
          const isActive = rolled && c.id === active?.id;
          const down = c.hp === 0;
          return (
            <li
              key={c.id}
              className={`row-in group flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border px-3 py-2 transition-all duration-200 sm:flex-nowrap ${
                isActive
                  ? 'border-[#f08c2e]/70 bg-[#f08c2e]/10 shadow-[0_0_18px_rgba(240,140,46,0.15)]'
                  : 'border-[#372918] bg-black/20 hover:border-[#443220] hover:bg-black/30'
              } ${down ? 'opacity-55' : ''}`}
            >
              <span
                className={`font-display w-9 shrink-0 text-center text-xl ${
                  isActive ? 'text-[#ffb347]' : 'text-[#7d6847]'
                }`}
              >
                {rolled ? (c.init as number) : '—'}
              </span>
              <span className="font-ui w-6 shrink-0 text-center text-[10px] font-bold uppercase text-[#7d6847]">{i + 1}</span>
              <span className={`min-w-0 flex-1 truncate font-semibold ${down ? 'text-[#9c8462] line-through' : 'text-[#efe3cd]'}`}>
                {c.name}
                <span className="font-ui ml-2 text-xs font-normal text-[#7d6847]">Лвк {c.dex >= 0 ? `+${c.dex}` : c.dex}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <button onClick={() => adjustHp(c.id, -1)} className="btn-ghost h-6 w-6 cursor-pointer rounded-sm text-sm leading-none" aria-label="Урон">−</button>
                <span className={`font-ui w-12 text-center text-sm font-bold ${down ? 'text-[#d4553f]' : c.hp <= c.maxHp / 3 ? 'text-[#f08c2e]' : 'text-[#c9b693]'}`}>
                  {c.hp}/{c.maxHp}
                </span>
                <button onClick={() => adjustHp(c.id, +1)} className="btn-ghost h-6 w-6 cursor-pointer rounded-sm text-sm leading-none" aria-label="Лечение">+</button>
              </span>
              <button
                onClick={() => removeCreature(c.id)}
                className="font-ui shrink-0 cursor-pointer text-xs text-[#7d6847] opacity-0 transition-opacity hover:text-[#d4553f] group-hover:opacity-100"
                aria-label={`Убрать ${c.name}`}
                title="Убрать из боя"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto pt-4">
        <div className="divider-rune mb-4" />
        <div className="flex flex-wrap gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && addCreature()}
            placeholder="Имя бойца…"
            className="min-w-0 flex-1 rounded-sm border border-[#443220] bg-black/30 px-3 py-2 text-sm text-[#efe3cd] placeholder-[#7d6847]"
          />
          <label className="font-ui flex items-center gap-1.5 rounded-sm border border-[#443220] bg-black/30 px-2.5 py-2 text-xs text-[#9c8462]">
            Лвк
            <input
              type="number"
              value={form.dex}
              onChange={(e) => setForm((f) => ({ ...f, dex: Number(e.target.value) }))}
              className="w-10 bg-transparent text-center text-sm font-bold text-[#efe3cd]"
            />
          </label>
          <label className="font-ui flex items-center gap-1.5 rounded-sm border border-[#443220] bg-black/30 px-2.5 py-2 text-xs text-[#9c8462]">
            HP
            <input
              type="number"
              value={form.hp}
              onChange={(e) => setForm((f) => ({ ...f, hp: Number(e.target.value) }))}
              className="w-12 bg-transparent text-center text-sm font-bold text-[#efe3cd]"
            />
          </label>
          <button onClick={addCreature} className="btn-ghost cursor-pointer rounded-sm px-4 py-2 text-sm font-bold text-[#d9a84e]">
            + В отряд
          </button>
        </div>
      </div>
    </div>
  );
}
