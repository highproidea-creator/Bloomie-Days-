import {
  applyBouquetAction,
  clone,
  validateBouquet,
} from "../keepsakes/model.js";
export function createBouquetStore(initial, onChange = () => {}) {
  validateBouquet(initial);
  let draft = clone(initial),
    past = [],
    future = [],
    gesture = null;
  const notify = (persist = true) =>
    onChange(clone(draft), {
      persist,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
    });
  function commit(before) {
    if (JSON.stringify(before) === JSON.stringify(draft)) return;
    past.push(before);
    if (past.length > 50) past.shift();
    future = [];
    notify();
  }
  return {
    get draft() {
      return clone(draft);
    },
    get canUndo() {
      return past.length > 0;
    },
    get canRedo() {
      return future.length > 0;
    },
    dispatch(action) {
      const before = clone(draft);
      draft = applyBouquetAction(draft, action);
      commit(before);
    },
    replace(value) {
      validateBouquet(value);
      const before = clone(draft);
      draft = clone(value);
      commit(before);
    },
    beginGesture() {
      gesture = clone(draft);
    },
    move(id, position) {
      draft = applyBouquetAction(draft, { type: "move", id, position });
      notify(false);
    },
    endGesture() {
      if (gesture) {
        const before = gesture;
        gesture = null;
        commit(before);
      }
    },
    cancelGesture() {
      if (gesture) {
        draft = gesture;
        gesture = null;
        notify(false);
      }
    },
    undo() {
      if (!past.length) return;
      future.push(clone(draft));
      draft = past.pop();
      gesture = null;
      notify();
    },
    redo() {
      if (!future.length) return;
      past.push(clone(draft));
      draft = future.pop();
      gesture = null;
      notify();
    },
  };
}
