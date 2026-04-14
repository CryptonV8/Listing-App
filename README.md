# Listings App

A production-style listings platform built with React, TypeScript, Tailwind CSS, React Router, and Supabase.

This application includes:

- Email/password authentication (register, login, logout)
- Public listing discovery with search and pagination
- Listing details with seller contacts and image slider
- Protected dashboard workflows for create, edit, and delete
- Multi-file image uploads to Supabase Storage
- Row Level Security-aware data access patterns

## Tech Stack

- React 18
- TypeScript 5
- Vite 5
- Tailwind CSS 3
- Supabase (Auth, Postgres, Storage)

## Project Structure

```text
src/
   components/
      layout/             # App shell, navbar, footer
      listings/           # Listing card UI
      routing/            # Protected route guard
   context/              # Authentication context
   lib/                  # Supabase client + listing data APIs
   pages/                # Route pages
   types/                # Shared domain types
supabase/
   migrations/           # SQL migration files
scripts/
   seed-supabase.js      # Optional JavaScript seeding script
```

## Prerequisites

- Node.js 20+
- npm 10+
- A Supabase project

## Environment Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

3. Fill in `.env`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

## Database and Storage Requirements

The app expects the following Supabase resources:

- `public.user_profiles`
- `public.listings`
- `public.listing_photos`
- Storage bucket: `listing-photos`

These are created by migration:

- `supabase/migrations/20260414_000001_initial_schema.sql`

If this migration has not been applied yet, apply it to your Supabase project before running the app.

## Run Locally

Start development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Available Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Type-check and build production bundle
- `npm run preview` - Preview built app locally
- `npm run seed:supabase` - Run JavaScript seeding script (requires Node + valid `.env`)

## Application Routes

### Public

- `/` - Home (welcome + latest 6 listings)
- `/listings` - Browse listings (search + pagination)
- `/listing/:id` - Listing details (photos slider + seller contact)
- `/login` - Login page
- `/register` - Register page

### Protected

- `/my-listings` - My listings (with pagination and actions)
- `/dashboard/create` - Create listing + upload photos
- `/dashboard/edit/:id` - Edit listing + add/remove photos
- `/dashboard/delete/:id` - Confirm deletion of listing and its photos

Compatibility aliases are also supported:

- `/create`
- `/edit/:id`
- `/delete/:id`

## Deployment Notes

1. Ensure all required environment variables are configured in your hosting provider.
2. Run `npm run build` in CI to validate TypeScript and production output.
3. Confirm Supabase URL/key point to the intended project.
4. Confirm migration has been applied in the target Supabase environment.

## Troubleshooting

### Build fails with TypeScript errors

- Ensure dependencies are installed: `npm install`
- Ensure CI uses Node.js 20+ and npm 10+

### Supabase module cannot be resolved

- Verify `@supabase/supabase-js` is present in `package.json`
- Reinstall dependencies and restart the editor TypeScript server if needed

### Auth actions fail

- Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Verify email/password auth is enabled in Supabase Auth providers

### Uploads fail

- Verify bucket `listing-photos` exists
- Verify storage RLS policies allow authenticated insert/update/delete

## Security Notes

- Never commit service role keys to frontend code or `.env` files used by the client app.
- Keep RLS enabled for all application tables.
- Use publishable/anon keys only in frontend runtime.

## License

This project is intended as an educational and portfolio-ready full-stack example.