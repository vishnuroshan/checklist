export type Unsubscribe = () => void;

export interface User {
  name: string;
  createdAt: number;
}

export interface ChecklistItem {
  text: string;
}

export type UserProgress = Record<string, boolean>; // itemId -> checked
export type AllUserProgress = Record<string, UserProgress>; // cid -> UserProgress

export interface Checklist {
  name: string;
  createdAt: number;
  items?: Record<string, ChecklistItem>;
}

export interface GlobalNote {
  text: string;
  createdAt: number;
}

export interface RealtimeDB {
  createUser(name: string): Promise<string>;
  getUser(uid: string): Promise<User | null>;
  subscribeUsers(
    cb: (users: Record<string, User>) => void
  ): Unsubscribe;

  deleteUser(uid: string): Promise<void>;
  renameUser(uid: string, name: string): Promise<void>;

  createChecklist(name: string): Promise<string>;
  deleteChecklist(cid: string): Promise<void>;
  renameChecklist(cid: string, name: string): Promise<void>;
  subscribeChecklists(
    cb: (lists: Record<string, Checklist>) => void
  ): Unsubscribe;
  subscribeChecklist(
    cid: string,
    cb: (checklist: Checklist | null) => void
  ): Unsubscribe;

  addItem(cid: string, text: string): Promise<string>;
  deleteItem(cid: string, itemId: string): Promise<void>;
  updateItem(cid: string, itemId: string, text: string): Promise<void>;
  
  toggleItem(uid: string, cid: string, itemId: string, checked: boolean): Promise<void>;
  
  subscribeItems(
    cid: string,
    cb: (items: Record<string, ChecklistItem>) => void
  ): Unsubscribe;

  subscribeUserProgress(
    uid: string,
    cid: string,
    cb: (progress: UserProgress) => void
  ): Unsubscribe;

  subscribeAllUserProgress(
    uid: string,
    cb: (progress: AllUserProgress) => void
  ): Unsubscribe;

  subscribeGlobalNotes(cb: (notes: Record<string, GlobalNote>) => void): Unsubscribe;
  addGlobalNote(text: string): Promise<string>;
  deleteGlobalNote(nid: string): Promise<void>;
}
