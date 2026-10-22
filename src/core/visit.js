/** Explicit stages keep browsing and 3D picking behind Flora's introduction. */
export function createVisitState() {
  let phase = 'outside';
  return {
    get phase() { return phase; },
    enter() { if (phase !== 'outside') return false; phase = 'entering'; return true; },
    finishIntro() { if (phase !== 'introducing') return false; phase = 'moving-to-flowers'; return true; },
    leave() { if (!['introducing', 'browsing'].includes(phase)) return false; phase = 'leaving'; return true; },
    complete() {
      if (phase === 'entering') phase = 'introducing';
      else if (phase === 'moving-to-flowers') phase = 'browsing';
      else if (phase === 'leaving') phase = 'outside';
      else return false;
      return true;
    },
  };
}
