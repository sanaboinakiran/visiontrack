// ── Vision Track configuration ──────────────────────────────────────────
// Fill these in with your own project's values before deploying.

window.VISIONTRACK_CONFIG = {
  // Supabase → Project Settings → API
  SUPABASE_URL: "https://gkocnnwdgoyxcypmzwdi.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrb2NubndkZ295eGN5cG16d2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNDcwMzksImV4cCI6MjEwNTYyMzAzOX0.mvubhBE0Xdw-r4Uf9gLXjK0BxIiV9bjYCal3I6fZBK0",

  // GitHub repo used to store task attachments (via the Contents API).
  // token needs "repo" scope (or fine-grained "contents: read & write" on this one repo).
  //
  // WARNING: this token lives in the browser and is visible to anyone who
  // opens dev tools on your deployed site. Use a token scoped to ONLY this
  // storage repo, never a repo with anything sensitive in it. For a real
  // production app, move the upload call behind a small server function
  // instead of calling GitHub directly from the browser.
  GITHUB_OWNER: "your-github-username",
  GITHUB_REPO: "visiontrack-storage",
  GITHUB_BRANCH: "main",
  GITHUB_TOKEN: "YOUR-GITHUB-TOKEN",
};
