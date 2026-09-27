/*!
 * Imagine Minds Play Center — scroll-scrubbed video tour + button island.
 * Plain JS, no build step: drop into Squarespace with the snippet in /squarespace.
 * Uses Motion (window.Motion, https://motion.dev) for entrance/caption animation
 * when it is on the page, and falls back to CSS transitions when it is not.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  var BASE = script && script.src ? script.src.replace(/[^\/?#]*([?#].*)?$/, "") : "./";

  var DEFAULTS = {
    frameCount: 304,          // frames/{desktop,mobile}/f0001.webp … f0304.webp
    scrollLength: 6.9,        // height of the tour in screens (5.9 screens of scrolling)
    hideSquarespaceHeader: true,
    homeUrl: "/",
    // The tour only runs on these pages, so the snippet is safe even in the
    // site-wide header injection. A page with <div id="imm-mount"> always gets it.
    tourPaths: ["/"],
    newTab: { tickets: true },
    links: {
      tickets: "https://ecom.roller.app/imagineminds/checkout/en-us/home",
      membership: "https://www.imagine-minds.com/membership",
      party: "https://www.imagine-minds.com/birthday-parties"
    },
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Imagine+Minds+Play+Center",
    tourLabel: "A walk through Imagine Minds Play Center: a rainbow climbing net, play stations, a birthday party room, a gallery, a glow room and a drawing studio.",
    // from/to are fractions of the tour (0 = top, 1 = end of video)
    captions: [
      { from: 0.02, to: 0.11, kicker: "Climb", title: "Climb into the rainbow", text: "A giant rainbow net to climb, bounce and explore." },
      { from: 0.15, to: 0.29, kicker: "Explore", title: "Curiosity everywhere", text: "Hands-on play stations for little explorers." },
      { from: 0.35, to: 0.49, kicker: "Celebrate", title: "Birthday parties, sorted", text: "Themed party rooms they will talk about all year." },
      { from: 0.53, to: 0.64, kicker: "Discover", title: "A gallery of play", text: "Art, toys and surprises around every corner." },
      { from: 0.69, to: 0.85, kicker: "Glow", title: "Light up the room", text: "Giant glowing spheres in a sea of sparkling light." },
      { from: 0.89, to: 0.985, kicker: "Create", title: "Draw & clean", text: "Draw it, wipe it, draw it again." }
    ]
  };

  var user = window.IMM_CONFIG || {};
  var cfg = Object.assign({}, DEFAULTS, user);
  cfg.links = Object.assign({}, DEFAULTS.links, user.links || {});
  cfg.newTab = Object.assign({}, DEFAULTS.newTab, user.newTab || {});

  var M = window.Motion || null;
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var EASE = [0.22, 1, 0.36, 1];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pad4(n) { return ("000" + n).slice(-4); }
  function reduced() { return reduceMQ.matches; }

  var PIN_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<defs><clipPath id="imm-pin-clip"><path d="M12 1.5c-4.3 0-7.5 3.2-7.5 7.4 0 5.5 7.5 13.6 7.5 13.6s7.5-8.1 7.5-13.6c0-4.2-3.2-7.4-7.5-7.4z"/></clipPath></defs>' +
    '<g clip-path="url(#imm-pin-clip)">' +
    '<rect x="0" y="0" width="24" height="24" fill="#34A853"/>' +
    '<polygon points="3,8 12,9 8.2,17 3,17" fill="#FBBC04"/>' +
    '<polygon points="3,0 15.6,0 12,9 3,9" fill="#EA4335"/>' +
    '<polygon points="15.6,0 21,0 21,13.5 12,9" fill="#4285F4"/>' +
    "</g>" +
    '<circle cx="12" cy="9" r="2.7" fill="#fff"/>' +
    "</svg>";

  var CHEVRON_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  function button(key, label) {
    var ext = cfg.newTab[key];
    return (
      '<a class="imm-btn" href="' + esc(cfg.links[key]) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" +
      label + (ext ? '<span class="imm-sr"> (opens in a new tab)</span>' : "") +
      "</a>"
    );
  }

  function buttons() {
    return (
      button("tickets", "Tickets") +
      button("membership", "Membership") +
      button("party", '<span class="imm-long">Birthday Party</span><span class="imm-short">Birthdays</span>')
    );
  }

  function normPath(p) {
    p = String(p || "/").toLowerCase().replace(/\/+$/, "");
    return p || "/";
  }

  function isTourPage() {
    if (document.getElementById("imm-mount")) return true;
    if (cfg.tourPaths === "*") return true;
    var here = normPath(location.pathname);
    return [].concat(cfg.tourPaths).some(function (p) { return normPath(p) === here; });
  }

  function template() {
    var caps = cfg.captions
      .map(function (c, i) {
        return (
          '<div class="imm-cap" data-i="' + i + '">' +
          '<p class="imm-cap-kicker">' + esc(c.kicker) + "</p>" +
          "<h2>" + esc(c.title) + "</h2>" +
          "<p>" + esc(c.text) + "</p>" +
          "</div>"
        );
      })
      .join("");

    return (
      '<a class="imm-sr imm-skip" href="#imm-end">Skip the tour</a>' +
      '<header class="imm-header">' +
      '<a class="imm-logo" href="' + esc(cfg.homeUrl) + '"><img src="' + BASE + 'assets/logo-sticker.webp" alt="Imagine Minds Play Center" width="1200" height="250" decoding="async" fetchpriority="high"></a>' +
      '<div class="imm-island-wrap"><nav class="imm-island" aria-label="Main">' +
      buttons() +
      '<a class="imm-map" href="' + esc(cfg.mapsUrl) + '" target="_blank" rel="noopener" aria-label="Get directions on Google Maps">' + PIN_SVG + "</a>" +
      "</nav></div>" +
      "</header>" +
      '<section class="imm-scrub" aria-label="Virtual tour">' +
      '<div class="imm-stage">' +
      '<canvas class="imm-canvas" role="img" aria-label="' + esc(cfg.tourLabel) + '"></canvas>' +
      '<div class="imm-bottom">' +
      '<div class="imm-captions">' + caps + "</div>" +
      '<div class="imm-hint" aria-hidden="true">Scroll to explore' + CHEVRON_SVG + "</div>" +
      '<div class="imm-loading" role="status" aria-live="polite">Loading tour…</div>' +
      '<div class="imm-progress" aria-hidden="true"><span></span></div>' +
      "</div>" +
      "</div>" +
      "</section>" +
      '<div id="imm-end" tabindex="-1"></div>'
    );
  }

  /* Put the app where the #imm-mount placeholder is. Inside Squarespace the
     placeholder sits in a Code Block, deep inside a section that may clip or
     transform its content, so the app is lifted out to sit next to that section. */
  function mount(app) {
    var anchor = document.getElementById("imm-mount");
    if (!anchor) {
      document.body.insertBefore(app, document.body.firstChild);
      return;
    }
    var section = anchor.closest(".page-section, section[data-section-id]");
    if (section && section.parentNode) {
      section.parentNode.insertBefore(app, section);
      if (section.querySelectorAll(".sqs-block, .fe-block").length <= 2) section.style.display = "none";
      anchor.remove();
    } else {
      anchor.parentNode.replaceChild(app, anchor);
    }
  }

  function init() {
    if (document.getElementById("imm-app") || !isTourPage()) return;

    var app = document.createElement("div");
    app.id = "imm-app";
    app.className = "imm";
    app.style.setProperty("--imm-len", String(cfg.scrollLength));
    app.innerHTML = template();
    if (M && !reduced()) app.classList.add("has-motion");
    mount(app);
    if (cfg.hideSquarespaceHeader) document.documentElement.classList.add("imm-on");

    var header = app.querySelector(".imm-header");
    var logo = app.querySelector(".imm-logo");
    var island = app.querySelector(".imm-island");
    var scrub = app.querySelector(".imm-scrub");
    var stage = app.querySelector(".imm-stage");
    var canvas = app.querySelector(".imm-canvas");
    var ctx = canvas.getContext("2d");
    var caps = Array.prototype.slice.call(app.querySelectorAll(".imm-cap"));
    var hint = app.querySelector(".imm-hint");
    var bar = app.querySelector(".imm-progress span");
    var loadingEl = app.querySelector(".imm-loading");

    /* ---------- entrance ---------- */
    if (M && !reduced()) {
      M.animate(logo.querySelector("img"), { opacity: [0, 1], y: [-14, 0] }, { duration: 0.7, ease: EASE });
      M.animate(island, { opacity: [0, 1], y: [-18, 0], scale: [0.9, 1] }, { type: "spring", stiffness: 320, damping: 24, delay: 0.12 });
      // opacity only: the buttons' own hover/press transforms live in CSS
      M.animate(island.children, { opacity: [0, 1] }, { duration: 0.45, ease: EASE, delay: M.stagger(0.06, { startDelay: 0.22 }) });
    }

    /* ---------- frames ---------- */
    var N = cfg.frameCount;
    var frames, loadedCount, set, gen = 0;
    var saveData = !!(navigator.connection && navigator.connection.saveData);

    function pickSet() {
      return window.matchMedia("(orientation: portrait) and (max-width: 1024px)").matches ? "mobile" : "desktop";
    }

    function loadOrder() {
      var seen = new Uint8Array(N), order = [];
      var strides = saveData ? [16, 8, 4, 2] : [16, 8, 4, 2, 1];
      order.push(0); seen[0] = 1;
      strides.forEach(function (s) {
        for (var i = 0; i < N; i += s) if (!seen[i]) { seen[i] = 1; order.push(i); }
      });
      if (!seen[N - 1]) order.splice(1, 0, N - 1);
      return order;
    }

    function startLoading() {
      var myGen = ++gen;
      set = pickSet();
      frames = new Array(N);
      loadedCount = 0;
      var order = loadOrder(), total = order.length, next = 0, inflight = 0;
      var firstPass = Math.ceil(N / 16) + 1;
      loadingEl.classList.remove("is-done");

      function pump() {
        while (inflight < 6 && next < order.length) {
          (function (i) {
            inflight++;
            var img = new Image();
            var done = function (ok) {
              if (myGen !== gen) return;
              inflight--;
              if (ok) {
                frames[i] = img;
                loadedCount++;
                if (Math.abs(i - Math.round(cur)) < 16 || loadedCount === 1) kick();
              }
              var pct = Math.round((loadedCount / total) * 100);
              if (loadedCount >= firstPass && pct >= 35) loadingEl.classList.add("is-done");
              else loadingEl.textContent = "Loading tour… " + pct + "%";
              pump();
            };
            img.onload = function () {
              // decode off the main thread so the first draw of this frame doesn't jank
              (img.decode ? img.decode() : Promise.resolve()).then(
                function () { done(true); },
                function () { done(true); }
              );
            };
            img.onerror = function () { done(false); };
            img.src = BASE + "frames/" + set + "/f" + pad4(i + 1) + ".webp";
          })(order[next++]);
        }
      }
      pump();
    }

    function nearest(i) {
      if (frames[i]) return frames[i];
      for (var d = 1; d < N; d++) {
        if (i - d >= 0 && frames[i - d]) return frames[i - d];
        if (i + d < N && frames[i + d]) return frames[i + d];
      }
      return null;
    }

    /* ---------- canvas ---------- */
    var cw = 0, ch = 0, drawn = -1, drawnImg = null, needsDraw = true;

    function resizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr);
      if (w !== cw || h !== ch) {
        cw = canvas.width = w;
        ch = canvas.height = h;
        needsDraw = true;
      }
    }

    function draw(i) {
      var img = nearest(i);
      if (!img || (!needsDraw && i === drawn && img === drawnImg)) return;
      var iw = img.naturalWidth, ih = img.naturalHeight;
      var s = Math.max(cw / iw, ch / ih), dw = iw * s, dh = ih * s;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      drawn = i; drawnImg = img; needsDraw = false;
    }

    /* ---------- scroll ---------- */
    var progress = 0, target = 0, cur = 0, pin = "", activeCap = -1, compact = null, raf = 0;

    function measure() {
      var r = scrub.getBoundingClientRect();
      var vh = stage.offsetHeight;
      var dist = Math.max(1, r.height - vh);
      progress = clamp(-r.top / dist, 0, 1);
      target = progress * (N - 1);

      var state = r.top > 0 ? "" : r.bottom <= vh ? "is-after" : "is-pinned";
      if (state !== pin) {
        stage.classList.remove("is-pinned", "is-after");
        if (state) stage.classList.add(state);
        pin = state;
      }

      var isCompact = window.scrollY > 40;
      if (isCompact !== compact) {
        compact = isCompact;
        header.classList.toggle("is-compact", isCompact);
      }

      hint.classList.toggle("is-hidden", progress > 0.012);
      bar.style.transform = "scaleX(" + progress.toFixed(4) + ")";
      updateCaption();
    }

    function updateCaption() {
      var idx = -1;
      for (var i = 0; i < cfg.captions.length; i++) {
        if (progress >= cfg.captions[i].from && progress <= cfg.captions[i].to) { idx = i; break; }
      }
      if (idx === activeCap) return;
      if (activeCap > -1) hideCap(caps[activeCap]);
      if (idx > -1) showCap(caps[idx]);
      activeCap = idx;
    }

    function showCap(el) {
      el.classList.add("is-active");
      if (M && !reduced()) {
        el.style.visibility = "visible";
        M.animate(el, { opacity: 1 }, { duration: 0.2 });
        M.animate(el.children, { opacity: [0, 1], y: [26, 0] }, { duration: 0.65, ease: EASE, delay: M.stagger(0.07) });
      }
    }

    function hideCap(el) {
      el.classList.remove("is-active");
      if (M && !reduced()) {
        var a = M.animate(el, { opacity: 0 }, { duration: 0.22, ease: "easeIn" });
        Promise.resolve(a && a.finished ? a.finished : a).then(function () {
          if (!el.classList.contains("is-active")) el.style.visibility = "hidden";
        });
      }
    }

    function tick() {
      raf = 0;
      var diff = target - cur;
      cur = reduced() || Math.abs(diff) < 0.02 ? target : cur + diff * 0.2;
      draw(Math.round(cur));
      if (cur !== target || needsDraw) kick();
    }
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }

    function onScroll() { measure(); kick(); }
    var resizeRaf = 0;
    function onResize() {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(function () {
        resizeRaf = 0;
        if (pickSet() !== set) startLoading();
        resizeCanvas();
        measure();
        kick();
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    // Coming back from Membership/Party etc.: return to the same spot in the tour
    var scrollKey = "imm-scroll:" + location.pathname;
    window.addEventListener("pagehide", function () {
      try { sessionStorage.setItem(scrollKey, String(Math.round(window.scrollY))); } catch (e) {}
    });
    var navEntry = performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
    if (navEntry && navEntry.type === "back_forward") {
      var savedY = 0;
      try { savedY = parseInt(sessionStorage.getItem(scrollKey), 10) || 0; } catch (e) {}
      if (savedY > 0) window.scrollTo(0, savedY);
    }

    resizeCanvas();
    startLoading();
    measure();
    cur = target;
    kick();

    // header height drives how far the island lifts in the compact state
    var setLogoH = function () { app.style.setProperty("--imm-logo-h", logo.offsetHeight + "px"); };
    setLogoH();
    logo.querySelector("img").addEventListener("load", setLogoH);
    window.addEventListener("resize", setLogoH);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
