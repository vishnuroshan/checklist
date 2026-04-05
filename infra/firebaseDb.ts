import { getDb } from "./firebase";
import {
  ref,
  push,
  set,
  update,
  onValue,
  get,
  remove,
} from "firebase/database";
import type {
  RealtimeDB,
  User,
  Checklist,
  ChecklistItem,
  UserProgress,
  AllUserProgress,
  GlobalNote,
} from "@/core/db";

export const firebaseRealtimeDb: RealtimeDB = {
  async createUser(name: string): Promise<string> {
    const db = getDb();
    const r = push(ref(db, "users"));
    await set(r, { name, createdAt: Date.now() });
    return r.key!;
  },

  async deleteUser(uid: string): Promise<void> {
    const db = getDb();
    await remove(ref(db, `users/${uid}`));
  },

  async renameUser(uid: string, name: string): Promise<void> {
    const db = getDb();
    await update(ref(db, `users/${uid}`), { name });
  },

  async getUser(uid: string): Promise<User | null> {
    const db = getDb();
    const snapshot = await get(ref(db, `users/${uid}`));
    return snapshot.exists() ? (snapshot.val() as User) : null;
  },

  subscribeUsers(cb: (users: Record<string, User>) => void) {
    const db = getDb();
    const r = ref(db, "users");
    const unsubscribe = onValue(r, (s) => cb(s.val() || {}));
    return unsubscribe;
  },

  async createChecklist(name: string): Promise<string> {
    const db = getDb();
    const r = push(ref(db, "checklists"));
    await set(r, { name, createdAt: Date.now() });
    return r.key!;
  },

  async deleteChecklist(cid: string): Promise<void> {
    const db = getDb();
    await remove(ref(db, `checklists/${cid}`));
  },

  async renameChecklist(cid: string, name: string): Promise<void> {
    const db = getDb();
    await update(ref(db, `checklists/${cid}`), { name });
  },

  subscribeChecklists(cb: (lists: Record<string, Checklist>) => void) {
    const db = getDb();
    const r = ref(db, "checklists");
    const unsubscribe = onValue(r, (s) => cb(s.val() || {}));
    return unsubscribe;
  },

  subscribeChecklist(cid: string, cb: (checklist: Checklist | null) => void) {
    const db = getDb();
    const r = ref(db, `checklists/${cid}`);
    const unsubscribe = onValue(r, (s) =>
      cb(s.exists() ? (s.val() as Checklist) : null)
    );
    return unsubscribe;
  },

  async addItem(cid: string, text: string): Promise<string> {
    const db = getDb();
    const r = push(ref(db, `checklists/${cid}/items`));
    await set(r, { text });
    return r.key!;
  },

  async deleteItem(cid: string, itemId: string): Promise<void> {
    const db = getDb();
    await remove(ref(db, `checklists/${cid}/items/${itemId}`));
  },

  async updateItem(cid: string, itemId: string, text: string): Promise<void> {
    const db = getDb();
    await update(ref(db, `checklists/${cid}/items/${itemId}`), { text });
  },

  async toggleItem(
    uid: string,
    cid: string,
    itemId: string,
    checked: boolean
  ): Promise<void> {
    const db = getDb();
    const progressRef = ref(db, `users/${uid}/progress/${cid}/${itemId}`);
    if (checked) {
      await set(progressRef, true);
    } else {
      await remove(progressRef);
    }
  },

  subscribeItems(
    cid: string,
    cb: (items: Record<string, ChecklistItem>) => void
  ) {
    const db = getDb();
    const r = ref(db, `checklists/${cid}/items`);
    const unsubscribe = onValue(r, (s) => cb(s.val() || {}));
    return unsubscribe;
  },

  subscribeUserProgress(
    uid: string,
    cid: string,
    cb: (progress: UserProgress) => void
  ) {
    const db = getDb();
    const r = ref(db, `users/${uid}/progress/${cid}`);
    const unsubscribe = onValue(r, (s) => cb(s.val() || {}));
    return unsubscribe;
  },

  subscribeAllUserProgress(uid: string, cb: (progress: AllUserProgress) => void) {
    const db = getDb();
    const r = ref(db, `users/${uid}/progress`);
    const unsubscribe = onValue(r, (s) => cb(s.val() || {}));
    return unsubscribe;
  },

  subscribeGlobalNotes(cb: (notes: Record<string, GlobalNote>) => void) {
    const db = getDb();
    const r = ref(db, "global/notes");
    const unsubscribe = onValue(r, (s) => cb(s.val() || {}));
    return unsubscribe;
  },

  async addGlobalNote(text: string): Promise<string> {
    const db = getDb();
    const r = push(ref(db, "global/notes"));
    await set(r, { text, createdAt: Date.now() });
    return r.key!;
  },

  async deleteGlobalNote(nid: string): Promise<void> {
    const db = getDb();
    await remove(ref(db, `global/notes/${nid}`));
  },

  async togglePinGlobalNote(nid: string, pinned: boolean): Promise<void> {
    const db = getDb();
    await update(ref(db, `global/notes/${nid}`), { pinned });
  },
};
