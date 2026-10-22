import { createBouquetDraft, validateBouquet } from "../keepsakes/model.js";
export const DRAFT_KEY = "bloomie-days:bouquet:v2",
  FINISHED_KEY = "bloomie-days:bouquet:finished",
  BACKUP_KEY = "bloomie-days:bouquet:previous";
export function createBouquetStorage(storage) {
  let damaged = null;
  return {
    load() {
      try {
        const raw = storage.getItem(DRAFT_KEY);
        if (!raw) return { draft: createBouquetDraft(), restored: false };
        try {
          const draft = JSON.parse(raw);
          validateBouquet(draft);
          return { draft, restored: true };
        } catch {
          damaged = raw;
          return {
            draft: createBouquetDraft(),
            restored: false,
            error:
              "ช่อเดิมอ่านไม่ได้ จะเก็บต้นฉบับสำรองไว้ก่อนบันทึกช่อใหม่ค่ะ",
          };
        }
      } catch {
        return {
          draft: createBouquetDraft(),
          restored: false,
          error:
            "เบราว์เซอร์ไม่อนุญาตให้บันทึกในเครื่อง ข้อมูลจะอยู่เฉพาะหน้านี้ค่ะ",
        };
      }
    },
    previous() {
      try {
        const draft = JSON.parse(storage.getItem(BACKUP_KEY));
        validateBouquet(draft);
        return draft;
      } catch {
        return null;
      }
    },
    save(draft) {
      try {
        validateBouquet(draft);
        if (damaged) {
          storage.setItem(BACKUP_KEY, damaged);
          damaged = null;
        }
        storage.setItem(DRAFT_KEY, JSON.stringify(draft));
        return true;
      } catch {
        return false;
      }
    },
    archive(draft) {
      try {
        storage.setItem(BACKUP_KEY, JSON.stringify(draft));
        return true;
      } catch {
        return false;
      }
    },
    finish(payload) {
      try {
        validateBouquet(payload.bouquet);
        storage.setItem(FINISHED_KEY, JSON.stringify(payload));
        storage.setItem(DRAFT_KEY, JSON.stringify(payload.bouquet));
        return true;
      } catch {
        return false;
      }
    },
  };
}
