---
name: Kanban Workflow App (Simplified)
overview: Build a kanban workflow application using React + Tailwind and Supabase. Backend added only when needed. Focus on shipping a working app first, then iterate.
todos:
  - id: phase1-supabase
    content: "Phase 1.1: Supabase setup - Create project, database schema, RLS policies, and auth"
    status: pending
  - id: phase1-frontend
    content: "Phase 1.2: React frontend - Build UI components, Supabase integration, drag-and-drop board"
    status: pending
  - id: phase1-realtime
    content: "Phase 1.3: Real-time sync - Add live updates using Supabase Realtime"
    status: pending
  - id: phase2-polish
    content: "Phase 2: Polish - Error handling, loading states, optimistic updates, testing"
    status: pending
  - id: phase3-backend
    content: "Phase 3 (Optional): FastAPI backend - Add only if you need email, exports, or complex logic"
    status: pending
  - id: phase4-advanced
    content: "Phase 4 (Future): Redis, background jobs, mobile app"
    status: pending
isProject: false
---

# Kanban Workflow Dashboard - Simplified Plan

## Architecture

```
Phase 1-2 (Core App):
┌─────────────────┐         ┌─────────────────┐
│  React Frontend │ ──────► │    Supabase     │
│  + Tailwind     │         │  (Auth, DB, RT) │
└─────────────────┘         └─────────────────┘

Phase 3+ (If Needed):
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  React Frontend │ ──────► │  FastAPI        │ ──────► │    Supabase     │
│  + Tailwind     │         │  (Complex logic)│         │  (Auth, DB, RT) │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

---

## Project Structure (Simplified)

```
workflow-dashboard/
├── frontend/                 # React + Tailwind
│   ├── src/
│   │   ├── components/       # UI components (Button, Card, Modal)
│   │   ├── features/         # Feature modules
│   │   │   ├── auth/         # Login, Signup, AuthProvider
│   │   │   ├── boards/       # Board list, Board view
│   │   │   └── kanban/       # Columns, Cards, DragDrop
│   │   ├── lib/
│   │   │   └── supabase.ts   # Supabase client
│   │   ├── hooks/            # useAuth, useBoard, useCards
│   │   └── types/            # TypeScript types
│   ├── .env                  # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
│   └── package.json
│
├── supabase/                 # Optional: local migrations
│   └── migrations/
│
└── README.md
```

**Note:** No backend folder in Phase 1-2. Add it in Phase 3 if needed.

---

## Database Schema

```sql
-- Users are managed by Supabase Auth (auth.users table)
-- We create a profiles table to store additional user data

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

create table boards (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table columns (
  id uuid default gen_random_uuid() primary key,
  board_id uuid references boards(id) on delete cascade not null,
  title text not null,
  position integer not null,
  created_at timestamptz default now()
);

create table cards (
  id uuid default gen_random_uuid() primary key,
  column_id uuid references columns(id) on delete cascade not null,
  title text not null,
  description text,
  position integer not null,
  priority text default 'medium',
  due_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table boards enable row level security;
alter table columns enable row level security;
alter table cards enable row level security;

-- RLS Policies (users can only access their own data)
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can view own boards"
  on boards for select using (auth.uid() = owner_id);

create policy "Users can create boards"
  on boards for insert with check (auth.uid() = owner_id);

create policy "Users can update own boards"
  on boards for update using (auth.uid() = owner_id);

create policy "Users can delete own boards"
  on boards for delete using (auth.uid() = owner_id);

-- Columns: access if user owns the parent board
create policy "Users can manage columns on own boards"
  on columns for all using (
    exists (
      select 1 from boards where boards.id = columns.board_id and boards.owner_id = auth.uid()
    )
  );

-- Cards: access if user owns the parent board
create policy "Users can manage cards on own boards"
  on cards for all using (
    exists (
      select 1 from columns
      join boards on boards.id = columns.board_id
      where columns.id = cards.column_id and boards.owner_id = auth.uid()
    )
  );
```

---

## Phase 1: Core App

### 1.1 Supabase Setup (Do This First)

**Steps:**

1. Create Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run the schema above
4. Go to Authentication → Settings → Enable email auth
5. Copy your Project URL and anon key from Settings → API

**What you'll learn:**

- Supabase dashboard navigation
- SQL and database design
- Row Level Security concepts

### 1.2 React Frontend

**Steps:**

1. Set up environment variables (`.env` file)
2. Create Supabase client (`src/lib/supabase.ts`)
3. Build auth flow:
  - Login page
  - Signup page
  - AuthProvider context
  - Protected routes
4. Build board features:
  - Board list page
  - Create board modal
  - Board detail page with columns
5. Build kanban features:
  - Column component
  - Card component
  - Add card form
  - Drag and drop (use `@dnd-kit/core`)

**What you'll learn:**

- React component architecture
- State management with hooks
- Supabase client SDK
- Drag and drop libraries

**Key files to create:**

```
src/lib/supabase.ts          # Supabase client
src/hooks/useAuth.ts         # Auth state hook
src/features/auth/AuthProvider.tsx
src/features/auth/LoginPage.tsx
src/features/auth/SignupPage.tsx
src/features/boards/BoardList.tsx
src/features/boards/BoardDetail.tsx
src/features/kanban/Column.tsx
src/features/kanban/Card.tsx
src/features/kanban/KanbanBoard.tsx
```

### 1.3 Real-time Sync

**Steps:**

1. Subscribe to card/column changes
2. Update UI when changes come from server
3. Handle optimistic updates

**Code pattern:**

```typescript
// Subscribe to changes on a board's cards
supabase
  .channel('board-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'cards' },
    (payload) => {
      // Update local state
    }
  )
  .subscribe()
```

**What you'll learn:**

- Real-time subscriptions
- Handling concurrent updates
- Optimistic UI patterns

---

## Phase 2: Polish

### 2.1 Error Handling

- Add error boundaries
- Toast notifications for errors
- Form validation

### 2.2 UX Improvements

- Loading skeletons
- Optimistic updates (instant feedback)
- Empty states
- Keyboard shortcuts

### 2.3 Testing

- Component tests with Vitest
- Integration tests for auth flow

---

## Phase 3: Backend (Only If Needed)

**Add FastAPI when you need:**


| Feature             | Why Backend Needed                            |
| ------------------- | --------------------------------------------- |
| Email notifications | Need to call SendGrid/Resend API with secrets |
| PDF/CSV export      | Heavy processing shouldn't block frontend     |
| Scheduled reminders | Need cron jobs or task scheduler              |
| Webhooks            | Receive callbacks from external services      |
| Complex workflows   | Multi-step business logic                     |


**If you add backend:**

- Connect FastAPI to Supabase using `supabase-py`
- Use Supabase service role key (server-side only)
- Keep frontend connected directly to Supabase for reads
- Use backend only for complex mutations

---

## Phase 4: Future Enhancements

Only pursue after Phase 2 is complete:

- **Team collaboration**: Board sharing, member roles
- **Redis caching**: If you have performance issues
- **Background jobs**: Celery for heavy processing
- **Mobile app**: React Native with shared types

---

## Tech Stack Summary


| Layer       | Technology            | Purpose                     |
| ----------- | --------------------- | --------------------------- |
| Frontend    | React 19 + TypeScript | UI framework                |
| Styling     | Tailwind CSS          | Utility-first CSS           |
| Build       | Vite                  | Fast dev server and bundler |
| Database    | Supabase (PostgreSQL) | Data storage                |
| Auth        | Supabase Auth         | User authentication         |
| Real-time   | Supabase Realtime     | Live updates                |
| Drag & Drop | @dnd-kit/core         | Kanban interactions         |
| Backend     | FastAPI (Phase 3+)    | Complex logic only          |


---

## Getting Started Checklist

- Create Supabase project
- Run database schema in SQL Editor
- Enable email authentication
- Add `.env` file with Supabase credentials
- Install dependencies: `npm install @supabase/supabase-js @dnd-kit/core @dnd-kit/sortable`
- Create `src/lib/supabase.ts`
- Build login/signup pages
- Build board list page
- Build kanban board with drag-and-drop
- Add real-time subscriptions
- Polish and test

---

## Key Differences from Original Plan


| Original                          | Simplified                        |
| --------------------------------- | --------------------------------- |
| FastAPI + SQLAlchemy in Phase 1   | No backend until Phase 3          |
| 10+ technologies to learn at once | Focus on React + Supabase first   |
| Complex Docker setup              | Simple local dev, Docker optional |
| SQLite + Supabase (confusing)     | Supabase only                     |
| 4 sub-phases in Phase 1           | 3 focused steps                   |


**Result:** Ship a working kanban board faster, learn core concepts deeply, add complexity only when needed.