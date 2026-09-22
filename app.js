const cfg = window.VISIONTRACK_CONFIG;
const supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

let currentUser = null;
let projects = [];
let activeProjectId = null;
let tasks = [];
let editingTaskId = null; // null = creating
let editingProjectId = null; // null = creating

// ── Auth guard ─────────────────────────────────────────────────────
async function guardAndInit() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
    return;
  }
  currentUser = data.session.user;
  document.getElementById("user-email").textContent = currentUser.email;
  await loadProjects();
}

document.getElementById("signout-btn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
});

// ── Projects ───────────────────────────────────────────────────────
async function loadProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) { console.error(error); return; }
  projects = data || [];
  renderProjectList();
  if (!activeProjectId && projects.length) {
    selectProject(projects[0].id);
  } else if (!projects.length) {
    document.getElementById("new-task-btn").disabled = true;
  }
}

function renderProjectList() {
  const el = document.getElementById("project-list");
  el.innerHTML = "";
  projects.forEach((p) => {
    const row = document.createElement("div");
    row.className = "rail-item" + (p.id === activeProjectId ? " active" : "");
    row.innerHTML = `<span>${escapeHtml(p.name)}</span><span class="count">${statusAbbrev(p.status)}</span>`;
    row.addEventListener("click", () => selectProject(p.id));
    el.appendChild(row);
  });
}

function statusAbbrev(s) {
  return { active: "ACT", on_hold: "HLD", completed: "DONE" }[s] || s;
}

async function selectProject(id) {
  activeProjectId = id;
  renderProjectList();
  const project = projects.find((p) => p.id === id);
  document.getElementById("project-title").textContent = project ? project.name : "Select a project";
  document.getElementById("project-meta").textContent = project
    ? `${project.status.replace("_", " ")}${project.description ? " · " + project.description : ""}`
    : "";
  document.getElementById("new-task-btn").disabled = !project;
  await loadTasks();
}

document.getElementById("new-project-btn").addEventListener("click", () => openProjectModal(null));
document.getElementById("project-cancel-btn").addEventListener("click", closeProjectModal);
document.getElementById("project-title").addEventListener("dblclick", () => {
  if (activeProjectId) openProjectModal(activeProjectId);
});

function openProjectModal(id) {
  editingProjectId = id;
  document.getElementById("project-error").style.display = "none";
  const backdrop = document.getElementById("project-modal-backdrop");
  const del = document.getElementById("delete-project-btn");
  if (id) {
    const p = projects.find((x) => x.id === id);
    document.getElementById("project-modal-title").textContent = "Edit project";
    document.getElementById("project-name").value = p.name;
    document.getElementById("project-desc").value = p.description || "";
    document.getElementById("project-status").value = p.status;
    del.classList.remove("hidden");
  } else {
    document.getElementById("project-modal-title").textContent = "New project";
    document.getElementById("project-name").value = "";
    document.getElementById("project-desc").value = "";
    document.getElementById("project-status").value = "active";
    del.classList.add("hidden");
  }
  backdrop.classList.remove("hidden");
}
function closeProjectModal() {
  document.getElementById("project-modal-backdrop").classList.add("hidden");
}

document.getElementById("project-save-btn").addEventListener("click", async () => {
  const name = document.getElementById("project-name").value.trim();
  const description = document.getElementById("project-desc").value.trim();
  const status = document.getElementById("project-status").value;
  const errBox = document.getElementById("project-error");
  if (!name) {
    errBox.textContent = "Name your project before saving.";
    errBox.style.display = "block";
    return;
  }
  try {
    if (editingProjectId) {
      const { error } = await supabase
        .from("projects")
        .update({ name, description, status })
        .eq("id", editingProjectId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from("projects")
        .insert({ name, description, status, owner_id: currentUser.id })
        .select()
        .single();
      if (error) throw error;
      activeProjectId = data.id;
    }
    closeProjectModal();
    await loadProjects();
    await selectProject(activeProjectId);
  } catch (err) {
    errBox.textContent = err.message;
    errBox.style.display = "block";
  }
});

document.getElementById("delete-project-btn").addEventListener("click", async () => {
  if (!editingProjectId) return;
  if (!confirm("Delete this project and all its tasks? This can't be undone.")) return;
  const { error } = await supabase.from("projects").delete().eq("id", editingProjectId);
  if (error) { alert(error.message); return; }
  closeProjectModal();
  activeProjectId = null;
  await loadProjects();
});

// ── Tasks ──────────────────────────────────────────────────────────
async function loadTasks() {
  if (!activeProjectId) { tasks = []; renderBoard(); return; }
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", activeProjectId)
    .order("created_at", { ascending: true });
  if (error) { console.error(error); return; }
  tasks = data || [];
  renderBoard();
}

function renderBoard() {
  ["backlog", "in_progress", "done"].forEach((status) => {
    const col = document.getElementById("col-" + status);
    col.innerHTML = "";
    const items = tasks.filter((t) => t.status === status);
    document.getElementById("count-" + status).textContent = items.length;
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = status === "backlog" ? "Nothing queued yet." : "Nothing here yet.";
      col.appendChild(empty);
      return;
    }
    items.forEach((t) => col.appendChild(taskCard(t)));
  });
}

function taskCard(t) {
  const card = document.createElement("div");
  card.className = "task-card";
  card.innerHTML = `
    <div class="id">TASK-${t.id.slice(0, 8)}</div>
    <div class="title">${escapeHtml(t.title)}</div>
    <div class="row">
      <span class="priority-pill ${t.priority}">${t.priority}</span>
      ${t.attachment_url ? '<span class="attach-flag">📎</span>' : ""}
    </div>
  `;
  card.addEventListener("click", () => openTaskModal(t.id));
  return card;
}

document.getElementById("new-task-btn").addEventListener("click", () => openTaskModal(null));
document.getElementById("task-cancel-btn").addEventListener("click", closeTaskModal);

function openTaskModal(id) {
  editingTaskId = id;
  document.getElementById("task-error").style.display = "none";
  document.getElementById("existing-attachment").textContent = "";
  document.getElementById("task-file").value = "";
  const del = document.getElementById("delete-task-btn");
  if (id) {
    const t = tasks.find((x) => x.id === id);
    document.getElementById("task-modal-title").textContent = "Edit task";
    document.getElementById("task-title").value = t.title;
    document.getElementById("task-detail").value = t.detail || "";
    document.getElementById("task-status").value = t.status;
    document.getElementById("task-priority").value = t.priority;
    if (t.attachment_url) {
      document.getElementById("existing-attachment").innerHTML =
        `Current: <a href="${t.attachment_url}" target="_blank" rel="noopener">${escapeHtml(t.attachment_name || "attachment")}</a>`;
    }
    del.classList.remove("hidden");
  } else {
    document.getElementById("task-modal-title").textContent = "New task";
    document.getElementById("task-title").value = "";
    document.getElementById("task-detail").value = "";
    document.getElementById("task-status").value = "backlog";
    document.getElementById("task-priority").value = "medium";
    del.classList.add("hidden");
  }
  document.getElementById("task-modal-backdrop").classList.remove("hidden");
}
function closeTaskModal() {
  document.getElementById("task-modal-backdrop").classList.add("hidden");
}

document.getElementById("task-save-btn").addEventListener("click", async () => {
  const title = document.getElementById("task-title").value.trim();
  const detail = document.getElementById("task-detail").value.trim();
  const status = document.getElementById("task-status").value;
  const priority = document.getElementById("task-priority").value;
  const fileInput = document.getElementById("task-file");
  const errBox = document.getElementById("task-error");
  const saveBtn = document.getElementById("task-save-btn");

  if (!title) {
    errBox.textContent = "Give the task a title before saving.";
    errBox.style.display = "block";
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    let attachment_url, attachment_name;
    if (fileInput.files && fileInput.files[0]) {
      const uploaded = await uploadToGitHub(fileInput.files[0]);
      attachment_url = uploaded.url;
      attachment_name = uploaded.name;
    }

    const payload = { title, detail, status, priority };
    if (attachment_url) {
      payload.attachment_url = attachment_url;
      payload.attachment_name = attachment_name;
    }

    if (editingTaskId) {
      const { error } = await supabase.from("tasks").update(payload).eq("id", editingTaskId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("tasks").insert({
        ...payload,
        project_id: activeProjectId,
        owner_id: currentUser.id,
      });
      if (error) throw error;
    }
    closeTaskModal();
    await loadTasks();
  } catch (err) {
    errBox.textContent = err.message;
    errBox.style.display = "block";
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save";
  }
});

document.getElementById("delete-task-btn").addEventListener("click", async () => {
  if (!editingTaskId) return;
  if (!confirm("Delete this task?")) return;
  const { error } = await supabase.from("tasks").delete().eq("id", editingTaskId);
  if (error) { alert(error.message); return; }
  closeTaskModal();
  await loadTasks();
});

// ── GitHub attachment storage ──────────────────────────────────────
// Uploads a file to the configured GitHub repo via the Contents API and
// returns its public raw URL. Requires GITHUB_TOKEN in config.js.
async function uploadToGitHub(file) {
  const base64 = await fileToBase64(file);
  const path = `attachments/${Date.now()}-${sanitizeFilename(file.name)}`;
  const url = `https://api.github.com/repos/${cfg.GITHUB_OWNER}/${cfg.GITHUB_REPO}/contents/${path}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${cfg.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({
      message: `Add attachment ${path}`,
      content: base64,
      branch: cfg.GITHUB_BRANCH,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`GitHub upload failed: ${body.message || res.status}`);
  }

  const data = await res.json();
  return {
    url: data.content.download_url,
    name: file.name,
  };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

guardAndInit();
