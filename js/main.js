/* ==========================================================================
   Q2 personal page - all of the behaviour lives in this one file.

   Two jobs:
     1. the usual page furniture (theme toggle, footer year, origin read-out)
     2. a live network measurement panel, because the Q2 brief asks for the page
        to be analysed from the network side and it is more convincing to measure
        it in the browser than to describe it.

   The panel reports the load breakdown from the Navigation Timing API and then
   issues repeated same-origin fetches with a cache-busting query string. Those
   requests cannot be served from cache, so each one costs a real DNS/TCP/TLS
   and HTTP round trip - which is exactly what we want to show in the report.
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------- theme --- */
  var root = document.documentElement;
  var STORE_KEY = "q2-theme";

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem(STORE_KEY, theme); } catch (e) { /* private mode */ }
  }

  var saved = null;
  try { saved = localStorage.getItem(STORE_KEY); } catch (e) { /* ignore */ }
  if (!saved) {
    saved = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark" : "light";
  }
  applyTheme(saved);

  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  /* ------------------------------------------------------------ footer --- */
  var yearEl = document.getElementById("year");
  if (yearEl) { yearEl.textContent = String(new Date().getFullYear()); }

  var protoEl = document.getElementById("proto");
  if (protoEl) {
    protoEl.textContent = location.protocol.replace(":", "").toUpperCase() +
      (location.port ? " on port " + location.port : "");
  }

  var originEl = document.getElementById("origin");
  if (originEl) { originEl.textContent = location.host || "file://"; }

  var hostFact = document.getElementById("host-fact");
  if (hostFact && /\.github\.io$/i.test(location.hostname)) {
    hostFact.textContent = "GitHub Pages";
  }

  /* ------------------------------------------------ navigation timing ---- */
  function readNavigationTiming() {
    var entries = performance.getEntriesByType && performance.getEntriesByType("navigation");
    if (!entries || !entries.length) { return null; }
    var n = entries[0];
    var tls = (n.secureConnectionStart > 0 && n.connectEnd > 0)
      ? n.connectEnd - n.secureConnectionStart : null;
    return {
      dns:  n.domainLookupEnd > 0 && n.domainLookupStart > 0
              ? n.domainLookupEnd - n.domainLookupStart : null,
      tcp:  n.connectEnd > 0 && n.connectStart > 0
              ? n.connectEnd - n.connectStart : null,
      tls:  tls,
      ttfb: n.responseStart > 0 && n.requestStart > 0
              ? n.responseStart - n.requestStart : null,
      dom:  n.domContentLoadedEventEnd || null,
      load: n.loadEventEnd || null
    };
  }

  function paintTimings() {
    var t = readNavigationTiming();
    if (!t) { return false; }
    Object.keys(t).forEach(function (key) {
      var cell = document.querySelector('[data-k="' + key + '"]');
      if (!cell) { return; }
      cell.textContent = t[key] === null ? "n/a" : t[key].toFixed(1);
    });
    return true;
  }

  // loadEventEnd is still 0 while the load event is running, so wait for it.
  if (!paintTimings()) {
    window.addEventListener("load", function () {
      setTimeout(paintTimings, 0);
    });
  }

  /* ------------------------------------------------------ latency probe -- */
  var samples = [];
  var MAX_BARS = 24;

  var elCount = document.getElementById("probe-count");
  var elLast = document.getElementById("probe-last");
  var elAvg = document.getElementById("probe-avg");
  var elMin = document.getElementById("probe-min");
  var elSpark = document.getElementById("spark");
  var btn = document.getElementById("probe-btn");

  function drawSpark() {
    if (!elSpark) { return; }
    var peak = Math.max.apply(null, samples.concat([1]));
    elSpark.innerHTML = samples.map(function (ms) {
      var h = Math.max(3, Math.round((ms / peak) * 46));
      return '<i style="height:' + h + 'px" title="' + ms.toFixed(1) + ' ms"></i>';
    }).join("");
  }

  function probeOnce() {
    var url = "assets/ping.json?t=" + Date.now() + "-" + Math.random();
    var started = performance.now();
    return fetch(url, { cache: "no-store" })
      .then(function (r) { return r.text(); })
      .then(function () {
        var ms = performance.now() - started;
        samples.push(ms);
        if (samples.length > MAX_BARS) { samples.shift(); }

        var avg = samples.reduce(function (a, b) { return a + b; }, 0) / samples.length;
        if (elCount) { elCount.textContent = String(samples.length); }
        if (elLast)  { elLast.textContent = ms.toFixed(1) + " ms"; }
        if (elAvg)   { elAvg.textContent = avg.toFixed(1) + " ms"; }
        if (elMin)   { elMin.textContent = Math.min.apply(null, samples).toFixed(1) + " ms"; }
        drawSpark();
        return ms;
      })
      .catch(function () {
        if (elLast) { elLast.textContent = "failed"; }
      });
  }

  function runProbeSeries(times) {
    if (!times) { return; }
    probeOnce().then(function () {
      setTimeout(function () { runProbeSeries(times - 1); }, 350);
    });
  }

  if (btn) {
    btn.addEventListener("click", function () {
      btn.disabled = true;
      runProbeSeries(5);
      setTimeout(function () { btn.disabled = false; }, 2600);
    });
    // one automatic probe so the panel is never empty on first view
    setTimeout(function () { probeOnce(); }, 600);
  }
})();
