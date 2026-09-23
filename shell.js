// Populates the shared #project-list rail on every standalone page
// (My Tasks, Daily To-Do, Projects, Trackers, Sites, Calendar, Reports).
// Clicking a project navigates to its board on dashboard.html.
async function initShell(user) {
  const emailEl = document.getElementById("user-email");
  if (emailEl) emailEl.textContent = user.email;

  const signoutBtn = document.getElementById("signout-btn");
  if (signoutBtn) {
    signoutBtn.addEventListener("click", async () => {
      await window.sb.auth.signOut();
      window.location.href = "index.html";
    });
  }

  const listEl = document.getElementById("project-list");
  if (!listEl) return;
  const { data, error } = await window.sb.from("projects").select("*").order("created_at");
  if (error) { console.error(error); return; }
  listEl.innerHTML = "";
  (data || []).forEach((p) => {
    const row = document.createElement("a");
    row.href = `dashboard.html?project=${p.id}`;
    row.className = "rail-item";
    const abbrev = { active: "ACT", on_hold: "HLD", completed: "DONE" }[p.status] || p.status;
    row.innerHTML = `<span>${window.escapeHtmlShared(p.name)}</span><span class="count">${abbrev}</span>`;
    listEl.appendChild(row);
  });
}
