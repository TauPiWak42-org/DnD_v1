import { useMemo, type CSSProperties } from 'react';

type EmberSpec = {
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  peak: number;
};

export default function Embers({ count = 26 }: { count?: number }) {
  const embers = useMemo<EmberSpec[]>(
    () =>
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        size: 2 + Math.random() * 4.5,
        duration: 9 + Math.random() * 16,
        delay: -Math.random() * 24,
        drift: (Math.random() - 0.5) * 120,
        peak: 0.35 + Math.random() * 0.55,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {embers.map((e, i) => (
        <span
          key={i}
          className="ember"
          style={
            {
              left: `${e.left}%`,
              width: `${e.size}px`,
              height: `${e.size}px`,
              animationDuration: `${e.duration}s`,
              animationDelay: `${e.delay}s`,
              '--drift': `${e.drift}px`,
              '--peak': e.peak,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
