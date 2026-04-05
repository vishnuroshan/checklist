# plan.md

## Goal

Minimal real-time checklist app with shared users and user-specific access via link.

---

## Core Requirements (Final)

* Create users (name only)
* Share user-specific URL
* User opens link → sees all checklists
* User selects checklist → can edit
* Real-time updates
* Home (admin view):

  * list of users
  * expandable → all checklists (sorted)

---

## Tech Stack

* Next.js (App Router)
* Firebase Realtime Database
* Firebase SDK (client-side only)

---

## Data Model (Firebase Realtime DB)

```
users: {
  userId: {
    name: "Aakash",
    createdAt: 1710000000
  }
}

checklists: {
  checklistId: {
    name: "JS Training Day One",
    createdAt: 1710000000,
    items: {
      itemId: {
        text: "Learn closures",
        checked: true
      }
    }
  }
}
```

No per-user checklist mapping. All users see all checklists.

---

## Routes

### 1. Home (Admin View)

```
/
```

* List users
* Expand → show all checklists
* Checklist links → `/user/{uid}/checklist/{cid}`

---

### 2. Create User

```
/create-user
```

---

### 3. Create Checklist

```
/create
```

---

### 4. User Entry Point (Shared Link)

```
/user/[uid]
```

* Fetch user
* Show:

  * user name
  * list of all checklists (sorted by createdAt DESC)
* Each checklist clickable

---

### 5. User Checklist View

```
/user/[uid]/checklist/[cid]
```

* Show:

  * user name
  * checklist name
* Show items
* Add item
* Toggle item (real-time)

---

## Link Pattern

Share only:

```
/user/{uid}
```

User flow:

* open link
* pick checklist
* edit

---

## Firebase Setup

```
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

---

## Real-time Sync

```
onValue(ref(db, path), callback)
```

Subscribe to:

* `/checklists`
* `/checklists/{cid}/items`

---

## Key Features Implementation

### Create User

* push → `/users`

---

### Create Checklist

* push → `/checklists`
* include `createdAt`

---

### Add Item

* push → `/checklists/{cid}/items`

---

### Toggle Item

```
/checklists/{cid}/items/{itemId}/checked
```

---

## User Flow (Important)

1. Admin creates users
2. Admin shares `/user/{uid}`
3. User:

   * opens link
   * sees all checklists
   * selects one
   * updates checklist
4. Updates reflect everywhere instantly

---

## Home Screen Logic

* fetch `/users`
* fetch `/checklists`
* render:

  * users list
  * expandable
  * show all checklists sorted DESC
  * links:

    ```
    /user/{uid}/checklist/{cid}
    ```

---

## Simple Analytics (Low Priority)

Per user (computed client-side):

* total checklists
* per checklist:

  * total items
  * completed items
* average completion %

Display under user:

* "5 checklists"
* "72% avg completion"

---

## Minimal UI

* no styling focus
* basic lists
* expandable sections
* buttons + inputs

---

## File Structure

```
app/
  page.tsx
  create/page.tsx
  create-user/page.tsx
  user/[uid]/page.tsx
  user/[uid]/checklist/[cid]/page.tsx

lib/
  firebase.ts

components/
  UserList.tsx
  ChecklistList.tsx
  Checklist.tsx
  Item.tsx
```

---

## Firebase Helper

* createUser
* createChecklist
* addItem
* toggleItem

---

## State Strategy

* `useState`
* Firebase listeners
* no global store

---

## Edge Cases (Ignore)

* invalid userId
* duplicate names
* deletions

---

## Execution Order

1. Firebase setup
2. Create user
3. Share `/user/{uid}`
4. User page (list checklists)
5. Checklist page
6. Add/toggle items
7. Real-time sync
8. Home admin view
9. Analytics (optional)

---

## Done Criteria

* Create users
* Share user link
* User can pick checklist
* Edit checklist
* Real-time sync works
* Admin sees all users + checklists
