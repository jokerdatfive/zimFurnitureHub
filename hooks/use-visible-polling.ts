import { useEffect, useRef } from 'react';

/**
 * Runs `fn` immediately and then every `intervalMs`, but only while the browser
 * tab is visible. Replaces always-on Supabase realtime subscriptions and fast
 * polling, which keep the database (and its CPU) busy even when nobody is looking.
 */
export function useVisiblePolling(fn: () => void | Promise<void>, intervalMs: number, enabled = true) {
  const saved = useRef(fn);
  saved.current = fn;

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = () => {
      void saved.current();
    };
    const start = () => {
      if (timer) return;
      tick();
      timer = setInterval(tick, intervalMs);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop());

    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs, enabled]);
}
