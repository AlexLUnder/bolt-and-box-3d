// Safe mobile haptics helper with user toggle

let enabled = true;

function vib(pattern: number | number[]) {
  if (!enabled) return;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore unsupported environments
  }
}

export const haptics = {
  get enabled() {
    return enabled;
  },
  setEnabled: (v: boolean) => {
    enabled = v;
  },
  unscrew: () => vib(12),
  locked: () => vib([10, 22, 10]),
  plateDrop: () => vib(24),
  boxSnap: () => vib([14, 28, 22]),
  win: () => vib([20, 35, 20, 35, 45]),
  fail: () => vib([40, 40, 40])
};
