# Todo

Next.js App Router starter with Supabase email authentication.

## Run locally

Install dependencies and start the development server:

~~~bash
pnpm install
pnpm dev
~~~

Open http://localhost:3000.

## Supabase setup

This project uses Supabase Auth for email/password registration and login. User identities are stored by Supabase Auth; no application users table is needed for authentication.

In the Supabase Dashboard:

1. Enable email signups and email confirmation under Authentication settings.
2. Set the Site URL to http://localhost:3000.
3. Add http://localhost:3000/** to the allowed redirect URLs.

The project environment values are in .env.example. Copy it to .env.local and set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to the project's publishable key. .env.local is ignored by Git.

The email link returns to /auth/callback, which exchanges the one-time code for a session. The callback page displays the confirmation result and signals the original signup tab when both tabs are open in the same browser.

## Next steps

Add guest-mode Todo storage and the authenticated Todo database flow in a later step.
