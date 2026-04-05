import type {
  RealtimeDB,
  User,
  Checklist,
  ChecklistItem,
  Unsubscribe,
  UserProgress,
  AllUserProgress,
  GlobalNote,
} from "@/core/db";

type Listener<T> = (data: T) => void;

const store: {
  users: Record<string, User & { progress?: AllUserProgress }>;
  checklists: Record<string, Checklist>;
  notes: Record<string, GlobalNote>;
} = {
  users: {},
  checklists: {},
  notes: {},
};

const listeners = {
  users: new Set<Listener<Record<string, User>>>(),
  checklists: new Set<Listener<Record<string, Checklist>>>(),
  checklistItems: new Map<
    string,
    Set<Listener<Record<string, ChecklistItem>>>
  >(),
  checklist: new Map<string, Set<Listener<Checklist | null>>>(),
  userProgress: new Map<string, Set<Listener<UserProgress>>>(),
  allUserProgress: new Map<string, Set<Listener<AllUserProgress>>>(),
  notes: new Set<Listener<Record<string, GlobalNote>>>(),
};

function notifyUsers() {
  const usersCopy: Record<string, User> = {};
  for (const id in store.users) {
    const { progress, ...user } = store.users[id];
    usersCopy[id] = user;
  }
  listeners.users.forEach((cb) => cb(usersCopy));
}

function notifyChecklists() {
  listeners.checklists.forEach((cb) => cb({ ...store.checklists }));
}

function notifyNotes() {
  listeners.notes.forEach((cb) => cb({ ...store.notes }));
}

function notifyItems(cid: string) {
  const cbs = listeners.checklistItems.get(cid);
  if (cbs) {
    const items = store.checklists[cid]?.items || {};
    cbs.forEach((cb) => cb({ ...items }));
  }
}

function notifyChecklist(cid: string) {
  const cbs = listeners.checklist.get(cid);
  if (cbs) {
    const cl = store.checklists[cid] || null;
    cbs.forEach((cb) => cb(cl ? { ...cl } : null));
  }
}

function notifyUserProgress(uid: string, cid: string) {
  const cbs = listeners.userProgress.get(`${uid}:${cid}`);
  if (cbs) {
    const progress = store.users[uid]?.progress?.[cid] || {};
    cbs.forEach((cb) => cb({ ...progress }));
  }
  // Also notify all progress listeners
  const allCbs = listeners.allUserProgress.get(uid);
  if (allCbs) {
    const allProgress = store.users[uid]?.progress || {};
    allCbs.forEach((cb) => cb({ ...allProgress }));
  }
}

export const memoryDb: RealtimeDB = {
  async createUser(name: string): Promise<string> {
    const id = crypto.randomUUID();
    store.users[id] = { name, createdAt: Date.now(), progress: {} };
    notifyUsers();
    return id;
  },

  async deleteUser(uid: string): Promise<void> {
    delete store.users[uid];
    notifyUsers();
  },

  async renameUser(uid: string, name: string): Promise<void> {
    if (store.users[uid]) {
      store.users[uid].name = name;
      notifyUsers();
    }
  },

  async getUser(uid: string): Promise<User | null> {
    if (!store.users[uid]) return null;
    const { progress, ...user } = store.users[uid];
    return user;
  },

  subscribeUsers(cb: (users: Record<string, User>) => void): Unsubscribe {
    listeners.users.add(cb);
    const usersCopy: Record<string, User> = {};
    for (const id in store.users) {
      const { progress, ...user } = store.users[id];
      usersCopy[id] = user;
    }
    cb(usersCopy);
    return () => {
      listeners.users.delete(cb);
    };
  },

  async createChecklist(name: string): Promise<string> {
    const id = crypto.randomUUID();
    store.checklists[id] = { name, createdAt: Date.now(), items: {} };
    notifyChecklists();
    return id;
  },

  async deleteChecklist(cid: string): Promise<void> {
    delete store.checklists[cid];
    // Also cleanup progress for this cid in all users
    for (const uid in store.users) {
      if (store.users[uid].progress) {
        delete store.users[uid].progress[cid];
        notifyUserProgress(uid, cid);
      }
    }
    notifyChecklists();
    notifyChecklist(cid);
    notifyItems(cid);
  },

  async renameChecklist(cid: string, name: string): Promise<void> {
    if (store.checklists[cid]) {
      store.checklists[cid].name = name;
      notifyChecklists();
      notifyChecklist(cid);
    }
  },

  subscribeChecklists(
    cb: (lists: Record<string, Checklist>) => void
  ): Unsubscribe {
    listeners.checklists.add(cb);
    cb({ ...store.checklists });
    return () => {
      listeners.checklists.delete(cb);
    };
  },

  subscribeChecklist(
    cid: string,
    cb: (checklist: Checklist | null) => void
  ): Unsubscribe {
    if (!listeners.checklist.has(cid)) {
      listeners.checklist.set(cid, new Set());
    }
    listeners.checklist.get(cid)!.add(cb);
    cb(store.checklists[cid] ? { ...store.checklists[cid] } : null);
    return () => {
      listeners.checklist.get(cid)?.delete(cb);
    };
  },

  async addItem(cid: string, text: string): Promise<string> {
    const id = crypto.randomUUID();
    if (!store.checklists[cid].items) {
      store.checklists[cid].items = {};
    }
    store.checklists[cid].items![id] = { text };
    notifyItems(cid);
    notifyChecklist(cid);
    notifyChecklists();
    return id;
  },

  async deleteItem(cid: string, itemId: string): Promise<void> {
    if (store.checklists[cid] && store.checklists[cid].items) {
      delete store.checklists[cid].items[itemId];
      // Cleanup progress
      for (const uid in store.users) {
        if (store.users[uid].progress?.[cid]) {
          delete store.users[uid].progress[cid][itemId];
          notifyUserProgress(uid, cid);
        }
      }
      notifyItems(cid);
      notifyChecklist(cid);
      notifyChecklists();
    }
  },

  async updateItem(cid: string, itemId: string, text: string): Promise<void> {
    if (
      store.checklists[cid] &&
      store.checklists[cid].items &&
      store.checklists[cid].items[itemId]
    ) {
      store.checklists[cid].items[itemId].text = text;
      notifyItems(cid);
      notifyChecklist(cid);
      notifyChecklists();
    }
  },

  async toggleItem(
    uid: string,
    cid: string,
    itemId: string,
    checked: boolean
  ): Promise<void> {
    if (!store.users[uid]) return;
    if (!store.users[uid].progress) store.users[uid].progress = {};
    if (!store.users[uid].progress[cid]) store.users[uid].progress[cid] = {};

    if (checked) {
      store.users[uid].progress[cid][itemId] = true;
    } else {
      delete store.users[uid].progress[cid][itemId];
    }
    notifyUserProgress(uid, cid);
  },

  subscribeItems(
    cid: string,
    cb: (items: Record<string, ChecklistItem>) => void
  ): Unsubscribe {
    if (!listeners.checklistItems.has(cid)) {
      listeners.checklistItems.set(cid, new Set());
    }
    listeners.checklistItems.get(cid)!.add(cb);
    cb({ ...(store.checklists[cid]?.items || {}) });
    return () => {
      listeners.checklistItems.get(cid)?.delete(cb);
    };
  },

  subscribeUserProgress(
    uid: string,
    cid: string,
    cb: (progress: UserProgress) => void
  ): Unsubscribe {
    const key = `${uid}:${cid}`;
    if (!listeners.userProgress.has(key)) {
      listeners.userProgress.set(key, new Set());
    }
    listeners.userProgress.get(key)!.add(cb);
    cb(store.users[uid]?.progress?.[cid] || {});
    return () => {
      listeners.userProgress.get(key)?.delete(cb);
    };
  },

  subscribeAllUserProgress(
    uid: string,
    cb: (progress: AllUserProgress) => void
  ): Unsubscribe {
    if (!listeners.allUserProgress.has(uid)) {
      listeners.allUserProgress.set(uid, new Set());
    }
    listeners.allUserProgress.get(uid)!.add(cb);
    cb(store.users[uid]?.progress || {});
    return () => {
      listeners.allUserProgress.get(uid)?.delete(cb);
    };
  },

  subscribeGlobalNotes(cb: (notes: Record<string, GlobalNote>) => void): Unsubscribe {
    listeners.notes.add(cb);
    cb({ ...store.notes });
    return () => {
      listeners.notes.delete(cb);
    };
  },

  async addGlobalNote(text: string): Promise<string> {
    const id = crypto.randomUUID();
    store.notes[id] = { text, createdAt: Date.now() };
    notifyNotes();
    return id;
  },

  async deleteGlobalNote(nid: string): Promise<void> {
    delete store.notes[nid];
    notifyNotes();
  },
};
