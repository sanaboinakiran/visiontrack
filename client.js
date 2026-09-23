// Shared Supabase client + auth guard, used by every authenticated page.
(function () {
  const cfg = window.VISIONTRACK_CONFIG;
  window.sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
})();

// Redirects to the sign-in page if there's no session; otherwise resolves
// with the current user.
window.requireUser = async function () {
  const { data } = await window.sb.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
    return null;
  }
  return data.session.user;
};

window.escapeHtmlShared = function (str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
};
