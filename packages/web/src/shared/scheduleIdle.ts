/**
 * Run work after the browser is idle, with a timeout so it still happens
 * during a long task. Used to keep ads and performance monitoring off the
 * marketing LCP path. No-ops during prerender, where effects do not run.
 */
export function scheduleIdle(task: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(() => task(), { timeout: 2000 });
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(task, 1);
  return () => window.clearTimeout(id);
}
