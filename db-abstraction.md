# db-abstraction.md

## Goal

Allow switching realtime database (Firebase → anything else) without changing UI code.

---

## Core Idea

* Define a single interface (`RealtimeDB`)
* Implement it per provider
* Use one exported instance (`dbClient`)
* UI depends only on interface, never on Firebase

---

## Interface (Core Contract)

```ts
export type Unsubscribe = () => void

export interface RealtimeDB {
  createUser(name: string): Promise<string>
  subscribeUsers(cb: (users: any) => void): Unsubscribe

  createChecklist(name: string): Promise<string>
  subscribeChecklists(cb: (lists: any) => void): Unsubscribe

  addItem(cid: string, text: string): Promise<string>
  toggleItem(cid: string, itemId: string, checked: boolean): Promise<void>

  subscribeItems(
    cid: string,
    cb: (items: any) => void
  ): Unsubscribe
}
```

---

## Firebase Implementation

```ts
import { db } from "./firebase"
import { ref, push, set, update, onValue, off } from "firebase/database"

export const firebaseDb = {
  async createUser(name) {
    const r = push(ref(db, "users"))
    await set(r, { name, createdAt: Date.now() })
    return r.key
  },

  subscribeUsers(cb) {
    const r = ref(db, "users")
    const unsub = onValue(r, s => cb(s.val() || {}))
    return () => off(r, "value", unsub)
  },

  async createChecklist(name) {
    const r = push(ref(db, "checklists"))
    await set(r, { name, createdAt: Date.now() })
    return r.key
  },

  subscribeChecklists(cb) {
    const r = ref(db, "checklists")
    const unsub = onValue(r, s => cb(s.val() || {}))
    return () => off(r, "value", unsub)
  },

  async addItem(cid, text) {
    const r = push(ref(db, `checklists/${cid}/items`))
    await set(r, { text, checked: false })
    return r.key
  },

  async toggleItem(cid, itemId, checked) {
    await update(ref(db, `checklists/${cid}/items/${itemId}`), { checked })
  },

  subscribeItems(cid, cb) {
    const r = ref(db, `checklists/${cid}/items`)
    const unsub = onValue(r, s => cb(s.val() || {}))
    return () => off(r, "value", unsub)
  }
}
```

---

## Memory Implementation (Optional)

```ts
const store = {
  users: {},
  checklists: {}
}

export const memoryDb = {
  async createUser(name) {
    const id = crypto.randomUUID()
    store.users[id] = { id, name, createdAt: Date.now() }
    return id
  },

  subscribeUsers(cb) {
    cb(store.users)
    return () => {}
  },

  async createChecklist(name) {
    const id = crypto.randomUUID()
    store.checklists[id] = { id, name, createdAt: Date.now(), items: {} }
    return id
  },

  subscribeChecklists(cb) {
    cb(store.checklists)
    return () => {}
  },

  async addItem(cid, text) {
    const id = crypto.randomUUID()
    store.checklists[cid].items[id] = { id, text, checked: false }
    return id
  },

  async toggleItem(cid, itemId, checked) {
    store.checklists[cid].items[itemId].checked = checked
  },

  subscribeItems(cid, cb) {
    cb(store.checklists[cid]?.items || {})
    return () => {}
  }
}
```

---

## Provider Switch

```ts
import { firebaseDb } from "@/infra/firebaseDb"
import { memoryDb } from "@/infra/memoryDb"

const provider = process.env.NEXT_PUBLIC_DB_PROVIDER

export const dbClient =
  provider === "memory" ? memoryDb : firebaseDb
```

---

## Usage Rule (Strict)

* Only import `dbClient` in:

  * pages
  * components
  * hooks

* Never import:

  * firebase
  * database SDK

---

## Example Usage

```ts
import { dbClient } from "@/lib/db"

useEffect(() => {
  const unsub = dbClient.subscribeChecklists(setLists)
  return unsub
}, [])

const addItem = () => {
  dbClient.addItem(cid, text)
}
```

---

## Folder Structure

```
core/
  db.ts

infra/
  firebaseDb.ts
  memoryDb.ts

lib/
  db.ts
```

---

## Future Swap

To switch DB:

1. Add new implementation (e.g. `supabaseDb.ts`)
2. Match interface
3. Change env variable

No UI changes required.

---

## Rule to Maintain

If any Firebase import appears outside `infra/`, abstraction is broken.
