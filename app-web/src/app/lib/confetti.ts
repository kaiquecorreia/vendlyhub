import confetti from 'canvas-confetti';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function fireSuccessConfetti(): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

  const base = {
    particleCount: 110,
    spread: 70,
    origin: { y: 0.65 },
  };

  void confetti(base);
  window.setTimeout(() => {
    void confetti({ ...base, particleCount: 55, spread: 50, origin: { y: 0.7 } });
  }, 130);
}
