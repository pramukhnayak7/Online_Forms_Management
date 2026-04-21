# FormFlow

FormFlow is a full-stack form builder built with Next.js, React, TypeScript, Tailwind CSS, and Supabase.

It allows users to:

- Register and sign in
- Create forms with auto-generated 6-character share codes
- Add/edit/delete questions (short answer, paragraph, multiple choice)
- Share forms via code or direct URL
- Collect one response per user per form
- Review submitted responses (form owner)
- View personal response history (form participant)

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase JS + @supabase/ssr

## Prerequisites

- Node.js 20+ (recommended)
- npm 10+ (or compatible package manager)
- A Supabase project

## Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These are required by `utils/supabase.ts`.

## Database Setup

1. Open your Supabase project.
2. Go to SQL Editor.
3. Run the SQL in `schema.sql`.

This creates the core tables:

- `users`
- `forms`
- `questions`
- `responses`
- `answers`

And supporting indexes for query performance.

## Install and Run

```bash
npm install
npm run dev
```

App runs at:

- http://localhost:3000

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Create production build
- `npm run start`: Run production server
- `npm run lint`: Run ESLint

## Main Routes

- `/`: Landing page
- `/login`: Login page
- `/login/register`: Registration page
- `/dashboard`: User dashboard (owned forms + stats)
- `/dashboard/history`: Attempted forms history
- `/dashboard/forms/[code]/edit`: Form builder/editor (owner only)
- `/dashboard/forms/[code]/responses`: View form responses (owner only)
- `/forms/[code]`: Public form answer page (requires login)

## Authentication and Access Model

Current authentication/session model is custom and app-level:

- User data is stored in the `users` table
- Login writes local storage entry `formdb_user`
- Session/identity cookies are used:
	- `formdb_session`
	- `formdb_user_id`
- Route protection for dashboard/auth pages is handled in `proxy.ts`

## Project Structure (Key Files)

- `app/page.tsx`: Landing page
- `app/login/*`: Sign in/sign up UI and flows
- `app/dashboard/*`: Dashboard, history, owner workflows
- `app/components/FormBuilderClient.tsx`: Form editor client
- `app/components/CreateFormModal.tsx`: Form creation modal
- `app/forms/[code]/page.tsx`: Form submission flow
- `utils/supabase.ts`: Supabase client factory
- `utils/generateCode.ts`: 6-character form code generator
- `schema.sql`: Database schema

## Notes and Limitations

- Passwords are currently compared/stored directly from app logic (no hashing layer in this codebase yet).
- Authorization is cookie/local-storage based; it is not using Supabase Auth.
- Form code generation is random 6-character uppercase alphanumeric and does not currently include collision retry logic.

## Suggested Next Improvements

1. Migrate auth to Supabase Auth (or another managed auth provider).
2. Hash passwords with a strong algorithm (Argon2/bcrypt) if custom auth is retained.
3. Add form code collision checks before insert.
4. Add automated tests for critical flows (auth, creation, submission).
5. Add DB-level RLS policies and tighten data access guarantees.
