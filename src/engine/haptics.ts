// Safe mobile haptics helper (uses Vibration API when supported, no-op on desktop)

function vib(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore unsupported environments
  }
}

export const haptics = {
  unscrew: () => vib(12),
  locked: () => vib([10, 22, 10]),
  plateDrop: () => vib(24),
  boxSnap: () => vib([14, 28, 22]),
  win: () => vib([20, 35, 20, 35, 45]),
  fail: () => vib([40, 40, 40])
};
