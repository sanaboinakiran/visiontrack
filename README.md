# Vision Track

A small project & task tracking board: sign in, create projects, track tasks
across Backlog / In Progress / Done, and attach files to tasks.

- **Database + auth**: Supabase (Postgres + email/password auth)
- **Attachment storage**: GitHub (via the repo Contents API)
- **Hosting**: Render (static site)

It's plain HTML/CSS/JS — no build step, no framework.

## Files

| File            | Purpose                                      |
|-----------------|-----------------------------------------------|
| `index.html`    | Sign in / sign up screen                      |
| `dashboard.html`| Main board UI                                 |
| `app.js`        | Dashboard logic (auth guard, CRUD, uploads)   |
| `styles.css`    | Shared styling                                |
| `config.js`     | Your Supabase + GitHub credentials            |
| `schema.sql`    | Database tables + row-level security policies |

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor → New query**, paste the contents of `schema.sql`, and run it.
   This creates `projects` and `tasks` tables with row-level security, so each
   user only ever sees their own data.
3. Go to **Authentication → Providers** and make sure **Email** is enabled.
   For quick testing, turn off "Confirm email" under **Authentication → Settings**
   so you can sign up and sign in immediately.
4. Go to **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`

## 2. Set up GitHub storage

1. Create a plain repo to hold attachments, e.g. `visiontrack-storage`.
   It can be private — attachments are served through the Contents API's
   `download_url`, which works for both public and private repos as long as
   the token has access.
2. Create a token with access to **only this repo**:
   - Fine-grained token (recommended): **Settings → Developer settings → Personal access tokens → Fine-grained tokens**, scope it to the one repo, with **Contents: Read and write** permission.
3. Fill in `config.js`:
   ```js
   GITHUB_OWNER: "your-username",
   GITHUB_REPO: "visiontrack-storage",
   GITHUB_BRANCH: "main",
   GITHUB_TOKEN: "the token you just created",
   ```

**Important security note:** this token is embedded in client-side JavaScript,
so anyone who opens dev tools on your deployed site can read it. That's fine
for a personal project or an internal tool behind its own login, but for
anything public-facing, move the `uploadToGitHub` call in `app.js` behind a
small server-side function (a Render web service, a Supabase Edge Function,
or similar) so the token never reaches the browser.

## 3. Fill in `config.js`

Open `config.js` and replace the placeholder values with your real
Supabase and GitHub details from steps 1–2.

## 4. Deploy to Render

1. Push this folder to a GitHub repo (a separate one from your storage repo,
   or a different folder in the same one — your choice).
2. In Render, click **New → Static Site**, connect that repo.
3. Build command: leave blank (nothing to build).
4. Publish directory: `.` (the repo root, or wherever these files live).
5. Deploy. Render will serve `index.html` as your entry point.

## Using it

- Visit your Render URL, create an account, sign in.
- Create a project from the sidebar.
- Add tasks, drag them mentally between statuses via the task's status
  dropdown (no drag-and-drop yet — see "Next steps").
- Attach a file to a task — it uploads to your GitHub repo and the task
  shows a 📎 marker with a link to it.

## Next steps (not built yet)

- Drag-and-drop between board columns
- Team members / sharing a project with another user
- Comments or activity history on tasks
- Moving the GitHub upload behind a server function for public deployments
