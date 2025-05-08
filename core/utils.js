// Shared helpers

/**
 * Clamp value `v` to [min, max].
 */
export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Random int in [0, n)
 */
export function rand(n) {
  return Math.floor(Math.random()*n);
}

/**
 * Simple event bus
 */
const events = {};
export function on(evt, fn) {
  if (!events[evt]) events[evt]=[];
  events[evt].push(fn);
}
export function emit(evt, ...args) {
  (events[evt]||[]).forEach(fn=>fn(...args));
}
