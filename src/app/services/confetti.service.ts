import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

/** The slice of the canvas-confetti API this app uses. Declared locally so the lazily loaded
 *  CommonJS bundle only has to be cast from its interop shape in one place. */
interface ConfettiOptions {
  angle?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
  particleCount?: number;
  startVelocity?: number;
  scalar?: number;
  ticks?: number;
  disableForReducedMotion?: boolean;
}

interface ConfettiApi {
  (options: ConfettiOptions): unknown;
  reset(): void;
}

/** Emerald leads, with amber and sky accents so the burst still reads as a celebration. */
const COLORS = ['#047857', '#10b981', '#34d399', '#fbbf24', '#38bdf8', '#f8fafc'];

@Injectable({ providedIn: 'root' })
export class ConfettiService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private loader: Promise<ConfettiApi | null> | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];

  /** Two angled cannons, then a wider burst from the middle of the screen. Does nothing while the
   *  app is being prerendered on the server, and the library itself skips users who have asked for
   *  reduced motion. */
  async celebrate(): Promise<void> {
    if (!this.isBrowser) return;

    const confetti = await this.load();
    if (!confetti) return;

    this.clearTimers();
    confetti.reset();

    this.fire(confetti, {
      origin: { x: 0.12, y: 0.85 },
      angle: 55,
      spread: 60,
      particleCount: 90,
      startVelocity: 45,
    });
    this.fire(confetti, {
      origin: { x: 0.88, y: 0.85 },
      angle: 125,
      spread: 60,
      particleCount: 90,
      startVelocity: 45,
    });
    this.timers.push(
      setTimeout(
        () =>
          this.fire(confetti, {
            origin: { x: 0.5, y: 0.45 },
            angle: 90,
            spread: 100,
            particleCount: 140,
            startVelocity: 38,
            scalar: 1.1,
          }),
        250,
      ),
      setTimeout(() => confetti.reset(), 3600),
    );
  }

  private fire(confetti: ConfettiApi, options: ConfettiOptions) {
    confetti({ ticks: 220, colors: COLORS, disableForReducedMotion: true, ...options });
  }

  /** Loaded on demand so the library stays out of the initial bundle and is never evaluated on
   *  the server. Cached across calls; a failed load is not retried. */
  private load(): Promise<ConfettiApi | null> {
    this.loader ??= import('canvas-confetti')
      .then((mod) => {
        const interop = mod as unknown as { default?: ConfettiApi };
        return interop.default ?? (mod as unknown as ConfettiApi);
      })
      .catch(() => null);
    return this.loader;
  }

  private clearTimers() {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
  }
}
