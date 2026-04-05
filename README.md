# Checklist App

A real-time, collaborative checklist application built with Next.js and Firebase.

## Features

- **Real-time Synchronization**: Check/uncheck items and see updates instantly across all users.
- **Admin Dashboard**: Manage users and checklists with a secret password (`12345`).
- **Tiered Analytics**: Publicly view checklist mastery while keeping user performance metrics private for admins.
- **Shared Activity Feed**: A permanent notes sidebar where anyone can post and pin important updates.

## Getting Started

### 1. Installation
Install the project dependencies:
```bash
npm install
```

### 2. Configuration
Create a `.env.local` file in the root directory and add your Firebase credentials:
```env
NEXT_PUBLIC_DB_PROVIDER=firebase
// NEXT_PUBLIC_DB_PROVIDER=memory

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project_id.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### Database Providers
- **`firebase`**: Connects to the real database for global, persistent sync. You need actual firebase credentials to use this provider. You can get them from [Firebase Console](https://console.firebase.google.com/) and add them in the .env.local file.
- **`memory`**: Ignores all Firebase credentials and uses a temporary in-memory store. **Note: All data will be cleared upon a browser refresh.** This is recommended for rapid development or testing purposes.

### 3. Running Locally
Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.
