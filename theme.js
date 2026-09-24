// Applied as the very first <script> in <head> on every page so the
// correct theme is set before the browser paints (no flash of the
// wrong theme). The click-wiring runs once the DOM is ready.
(function () {
  function getStored() {
    try { return localStorage.getItem("vt-theme") || "dark"; } catch (e) { return "dark"; }
  }
  document.documentElement.setAttribute("data-theme", getStored());

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("theme-toggle-btn");
    if (!btn) return;
    function refresh() {
      btn.textContent = document.documentElement.getAttribute("data-theme") === "light" ? "☀️" : "🌙";
    }
    refresh();
    btn.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("vt-theme", next); } catch (e) {}
      refresh();
    });
  });
})();
