/** The transition lock prevents duplicate clicks and reverse-flight races. */
export function createVisitState() {
  let phase = 'outside';
  return {
    get phase() { return phase; },
    enter() { if (phase !== 'outside') return false; phase = 'entering'; return true; },
    leave() { if (phase !== 'inside') return false; phase = 'leaving'; return true; },
    complete() {
      if (phase === 'entering') phase = 'inside';
      else if (phase === 'leaving') phase = 'outside';
      else return false;
      return true;
    },
  };
}
