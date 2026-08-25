import { useCallback, useState } from 'react';
import DiceRoller from './components/DiceRoller';
import Initiative from './components/Initiative';
import NpcGenerator from './components/NpcGenerator';
import TablesNotes from './components/TablesNotes';
import Embers from './components/Embers';
import Reveal from './components/Reveal';

type Toast = { id: number; msg: string; kind: 'gold' | 'red' | 'plain' };

const BUILD = 'D_M_I_0.1.001';

export default function App() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((msg: string, kind: Toast['kind'] = 'plain') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, msg, kind }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  return (
    <div className="bg-forge relative min-h-screen">
      {/* слои фона */}
      <div className="noise-veil pointer-events-none fixed inset-0 z-0" aria-hidden="true" />
      <div className="rune-grid pointer-events-none fixed inset-0 z-0" aria-hidden="true" />
      <Embers />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        {/* ---- шапка ---- */}
        <header className="flex flex-wrap items-end justify-between gap-6 pt-10 pb-8 sm:pt-14">
          <div className="flex items-center gap-5">
            <a href="#dice" className="sigil block" aria-label="К костям" title="К костям">
              <svg width="72" height="72" viewBox="0 0 100 100" fill="none" aria-hidden="true">
                <polygon points="50 4 90 27 90 73 50 96 10 73 10 27" stroke="#d9a84e" strokeWidth="2.4" fill="rgba(240,140,46,0.06)" />
                <polygon points="50 28 69 61 31 61" stroke="#f08c2e" strokeWidth="1.6" fill="rgba(0,0,0,0.3)" />
                <line x1="50" y1="4" x2="50" y2="28" stroke="#d9a84e" strokeWidth="1" opacity="0.6" />
                <line x1="90" y1="27" x2="50" y2="28" stroke="#d9a84e" strokeWidth="1" opacity="0.6" />
                <line x1="10" y1="27" x2="50" y2="28" stroke="#d9a84e" strokeWidth="1" opacity="0.6" />
                <line x1="90" y1="73" x2="69" y2="61" stroke="#d9a84e" strokeWidth="1" opacity="0.6" />
                <line x1="10" y1="73" x2="31" y2="61" stroke="#d9a84e" strokeWidth="1" opacity="0.6" />
                <line x1="50" y1="96" x2="31" y2="61" stroke="#d9a84e" strokeWidth="1" opacity="0.6" />
                <line x1="50" y1="96" x2="69" y2="61" stroke="#d9a84e" strokeWidth="1" opacity="0.6" />
                <text x="50" y="55" textAnchor="middle" fontFamily="Forum, serif" fontSize="22" fill="#ffd98c">20</text>
              </svg>
            </a>
            <div>
              <p className="font-ui text-[11px] font-bold uppercase tracking-[0.34em] text-[#f08c2e]">
                Ширма данжен-мастера
              </p>
              <h1 className="font-display mt-1 text-4xl leading-none tracking-wide text-[#efe3cd] sm:text-6xl">
                Гримуар <span className="text-outline-gold">Мастера</span>
              </h1>
            </div>
          </div>
          <nav className="font-ui flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#9c8462] sm:pb-2">
            <a href="#dice" className="transition-colors hover:text-[#ffd98c]">Кости</a>
            <a href="#battle" className="transition-colors hover:text-[#ffd98c]">Бой</a>
            <a href="#npc" className="transition-colors hover:text-[#ffd98c]">NPC</a>
            <a href="#journal" className="transition-colors hover:text-[#ffd98c]">Журнал</a>
          </nav>
        </header>

        <p className="font-ui mb-10 max-w-2xl border-l-2 border-[#f08c2e]/60 pl-4 text-[15px] leading-relaxed text-[#c9b693]">
          Всё, что нужно за столом, — в одном свитке: броски с летописью, порядок боя по раундам,
          прохожие из тумана и случайности, когда партия свернула не туда. Данные живут в вашем браузере.
        </p>

        {/* ---- секции ---- */}
        <main className="space-y-8">
          <section id="dice">
            <Reveal>
              <DiceRoller notify={notify} />
            </Reveal>
          </section>

          <section id="battle" className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <Reveal>
              <Initiative notify={notify} />
            </Reveal>
            <Reveal delay={120}>
              <div id="npc">
                <NpcGenerator notify={notify} />
              </div>
            </Reveal>
          </section>

          <section id="journal">
            <Reveal>
              <TablesNotes notify={notify} />
            </Reveal>
          </section>
        </main>

        {/* ---- подвал ---- */}
        <footer className="mt-14">
          <div className="divider-rune" />
          <div className="font-ui mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#7d6847]">
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <polygon points="12 2 20.7 7 20.7 17 12 22 3.3 17 3.3 7" stroke="#9c8462" strokeWidth="1.6" />
              </svg>
              Гримуар Мастера — собрано для тех, кто сидит за ширмой
            </span>
            <span>
              сборка <span className="font-bold text-[#9c8462]">{BUILD}</span> · кости честные, криты — по совести
            </span>
          </div>
        </footer>
      </div>

      {/* ---- тосты ---- */}
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-72 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-in font-ui rounded-sm border px-3.5 py-2.5 text-sm font-bold shadow-[0_12px_30px_rgba(0,0,0,0.5)] ${
              t.kind === 'gold'
                ? 'border-[#d9a84e] bg-[#2d2013] text-[#ffd98c]'
                : t.kind === 'red'
                  ? 'border-[#d4553f] bg-[#2a150f] text-[#f0a08d]'
                  : 'border-[#443220] bg-[#261b11] text-[#c9b693]'
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
