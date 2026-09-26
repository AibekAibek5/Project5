/*!
 * Imagine Minds — scroll-driven video tour + button island.
 *
 * Drop-in for Squarespace (Page Header Code Injection or a Code Block) or any page:
 *
 *   <script>window.IMAGINE_SCROLL = { ...options... };</script>
 *   <script src="https://cdn.jsdelivr.net/gh/<user>/<repo>@<ref>/embed/imagine-scroll.js"></script>
 *
 * The script loads its own stylesheet and frames from the folder it was served from.
 * It mounts into #imagine-scroll if that element exists, otherwise at the top of the page.
 * Load it without `defer` in the page header so the intro loader covers the page from the start.
 */
(function () {
  'use strict';

  if (window.__imxBooted) return;
  window.__imxBooted = true;

  var startedAt = window.performance && performance.now ? performance.now() : Date.now();
  var script = document.currentScript;
  var user = window.IMAGINE_SCROLL || {};
  var BASE = user.base || (script && script.src ? script.src.replace(/embed\/[^/]*$/, '') : '');

  var DEFAULTS = {
    mount: '#imagine-scroll',
    video: true,
    island: true,
    hideSiteHeader: false,
    fullBleed: true,
    // Text overlays (chapter captions, progress line, edge label). Off: the video plays clean.
    captions: false,
    // Intro screen with the logo and a progress bar while the first frames download.
    loader: true,
    loaderSeconds: 3,

    logo: 'assets/logo.png',
    logoAlt: 'Imagine Minds play center',
    logoLink: '/',
    nav: [
      { label: 'Tickets', href: 'https://ecom.roller.app/imagineminds/checkout/en-us/home' },
      { label: 'Membership', href: 'https://www.imagine-minds.com/membership' },
      { label: 'Birthday Party', short: 'Party', href: 'https://www.imagine-minds.com/birthday-parties' }
    ],
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Imagine+Minds+Play+Center',
    mapLabel: 'Find us on Google Maps',
    sideLabel: 'Imagine Minds · Play Center',

    // How far the visitor scrolls (in screen heights × 100) to play the whole video.
    // Bigger = slower, more cinematic.
    scrollLength: 650,
    // 0–1: how quickly the video catches up with the scrollbar. Lower = floatier.
    smoothing: 0.14,

    frames: {
      path: 'frames/',
      count: 247,
      fps: 24,
      ext: 'webp',
      digits: 4,
      // Viewports narrower than this aspect ratio (width / height) get the portrait frames.
      mobileBelowAspect: 0.8
    },

    // The video is split into segments. `t` is [start, end] in seconds of the source
    // video, `w` is how much scroll the segment gets. A segment with t[0] === t[1]
    // holds a still frame. Segments with a caption show text while they play.
    timeline: [
      { t: [0, 0], w: 0.35, id: 'hero' },
      { t: [0, 1.15], w: 1.5, id: 'net' },
      { t: [1.15, 1.8], w: 0.8 },
      { t: [1.8, 3.0], w: 1.5, id: 'splash' },
      { t: [3.0, 3.45], w: 0.5 },
      { t: [3.45, 5.0], w: 1.5, id: 'party' },
      { t: [5.0, 5.25], w: 0.35 },
      { t: [5.25, 6.8], w: 1.4, id: 'gallery' },
      { t: [6.8, 7.25], w: 0.45 },
      { t: [7.25, 8.8], w: 1.6, id: 'glow' },
      { t: [8.8, 9.0], w: 0.3 },
      { t: [9.0, 10.25], w: 1.4, id: 'draw' },
      { t: [10.25, 10.25], w: 0.5, id: 'visit' }
    ],

    copy: {
      hero: {
        type: 'hero',
        label: 'Imagine Minds — Play Center',
        title: 'A playground for big imaginations',
        body: 'Climb, splash, glow and draw at a play center built for curious kids.',
        cue: 'Scroll to explore'
      },
      net: {
        num: '01',
        label: 'The Net',
        title: 'Climb above it all',
        body: 'A giant rainbow net to climb, bounce and crawl across, high above the floor.'
      },
      splash: {
        num: '02',
        label: 'Splash Zone',
        title: 'Pour, splash, discover',
        body: 'Water tables, pumps and bubbles turn cause and effect into the best kind of mess.'
      },
      party: {
        num: '03',
        label: 'Birthday Parties',
        title: 'Birthdays, beautifully done',
        body: 'Private party rooms styled around your child’s theme, so you can simply enjoy the day.'
      },
      gallery: {
        num: '04',
        label: 'The Gallery',
        title: 'Play through the ages',
        body: 'A hallway of classic controllers and framed art. A little nostalgia for the grown-ups.'
      },
      glow: {
        num: '05',
        label: 'Glow Room',
        title: 'Glow, push, wonder',
        color: '#ff7a2f',
        body: 'Giant glowing spheres under a sky of projected stars. Push them, hug them, chase them.'
      },
      draw: {
        num: '06',
        label: 'Draw & Clean',
        title: 'Draw on everything',
        body: 'Walls, tables, even the car. Doodle anywhere, wipe it clean, start again.'
      },
      visit: {
        type: 'cta',
        label: 'Plan your visit',
        title: 'Come play',
        body: 'Book a visit, become a member or plan the party of the year.',
        directions: 'Get directions'
      }
    }
  };

  var cfg = merge(DEFAULTS, user);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function merge(base, over) {
    var out = {};
    var k;
    for (k in base) out[k] = base[k];
    for (k in over) {
      if (!Object.prototype.hasOwnProperty.call(over, k)) continue;
      var b = base[k];
      var o = over[k];
      if (b && o && typeof b === 'object' && typeof o === 'object' && !Array.isArray(b) && !Array.isArray(o)) {
        out[k] = merge(b, o);
      } else {
        out[k] = o;
      }
    }
    return out;
  }

  function resolve(url) {
    if (!url) return url;
    if (/^([a-z]+:)?\/\//i.test(url) || url.charAt(0) === '/' || /^data:/.test(url)) return url;
    return BASE + url;
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (attrs[k] == null || attrs[k] === false) continue;
        if (k === 'text') node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      }
    }
    (children || []).forEach(function (c) {
      if (c) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  // Text with optional "\n" line breaks, inserted safely.
  function lines(node, text) {
    String(text || '').split('\n').forEach(function (part, i) {
      if (i) node.appendChild(document.createElement('br'));
      node.appendChild(document.createTextNode(part));
    });
    return node;
  }

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function smooth(a, b, x) {
    if (b <= a) return x >= b ? 1 : 0;
    var t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------------------
  // Styles + fonts
  // ---------------------------------------------------------------------------

  function ensureFonts() {
    if (document.querySelector('link[data-imx-font]')) return;
    var head = document.head;
    head.appendChild(el('link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }));
    head.appendChild(el('link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }));
    head.appendChild(el('link', {
      rel: 'stylesheet',
      'data-imx-font': '',
      href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&display=swap'
    }));
  }

  function loadCss(done) {
    var called = false;
    function once() {
      if (!called) {
        called = true;
        done();
      }
    }
    var link = document.querySelector('link[href*="imagine-scroll.css"]');
    if (!link) {
      link = el('link', { rel: 'stylesheet', href: BASE + 'embed/imagine-scroll.css' });
      document.head.appendChild(link);
    } else if (link.sheet) {
      return once();
    }
    link.addEventListener('load', once);
    link.addEventListener('error', once);
    setTimeout(once, 4000);
  }

  // ---------------------------------------------------------------------------
  // Intro loader
  // ---------------------------------------------------------------------------

  var RED = '#ff3434';
  var coverStyle = null; // hides the page until the loader is on screen
  var loaderStyle = null;
  var loaderEl = null;
  var stageReady = false;
  var revealed = false;

  function now() {
    return window.performance && performance.now ? performance.now() : Date.now();
  }

  // Runs as soon as the script executes (before <body> exists when loaded in the header),
  // so visitors never see the page flash before the loader.
  function coverPage() {
    coverStyle = el('style', { 'data-imx-cover': '' });
    coverStyle.textContent =
      'html{background:#100904!important;overflow:hidden!important}' +
      'body{visibility:hidden!important}';
    loaderStyle = el('style', { 'data-imx-loader': '' });
    loaderStyle.textContent =
      '.imx-loader{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;gap:32px;background:#100904;visibility:visible;' +
      'transition:opacity .6s ease}' +
      '.imx-loader.is-out{opacity:0;pointer-events:none}' +
      '.imx-loader img{display:block;width:clamp(220px,24vw,340px);height:auto}' +
      '.imx-loader__track{width:min(320px,64vw);height:4px;border-radius:4px;' +
      'background:rgba(255,237,215,.14);overflow:hidden}' +
      '.imx-loader__fill{height:100%;border-radius:4px;background:' + RED + ';' +
      'transform-origin:0 50%;transform:scaleX(0)}';
    document.head.appendChild(coverStyle);
    document.head.appendChild(loaderStyle);
    // Never leave the page hidden, whatever happens.
    setTimeout(reveal, (cfg.loaderSeconds + 4) * 1000);
  }

  function showLoader() {
    if (revealed) return;
    var fill = el('div', { class: 'imx-loader__fill' });
    loaderEl = el('div', {
      class: 'imx-loader',
      role: 'progressbar',
      'aria-label': 'Loading',
      'aria-valuemin': '0',
      'aria-valuemax': '100'
    }, [
      el('img', { src: resolve(cfg.logo), alt: cfg.logoAlt }),
      el('div', { class: 'imx-loader__track' }, [fill])
    ]);
    document.body.appendChild(loaderEl);

    var maxMs = cfg.loaderSeconds * 1000;
    var shown = 0;
    (function step() {
      if (revealed) return;
      var elapsed = now() - startedAt;
      var loaded = earlyFrames ? earlyFrames.loaded / earlyFrames.count : 0;
      // The bar fills over `loaderSeconds`, or sooner if every frame arrives first.
      var p = Math.min(1, Math.max(loaded, elapsed / maxMs));
      shown += (p - shown) * 0.25;
      fill.style.transform = 'scaleX(' + shown.toFixed(4) + ')';
      loaderEl.setAttribute('aria-valuenow', String(Math.round(shown * 100)));
      var timeUp = elapsed >= maxMs || (loaded >= 1 && elapsed >= 600);
      if (timeUp && stageReady) return reveal();
      requestAnimationFrame(step);
    })();
  }

  function reveal() {
    if (revealed) return;
    revealed = true;
    if (coverStyle) coverStyle.remove();
    if (!loaderEl) {
      if (loaderStyle) loaderStyle.remove();
      return;
    }
    loaderEl.setAttribute('aria-valuenow', '100');
    loaderEl.querySelector('.imx-loader__fill').style.transform = 'scaleX(1)';
    requestAnimationFrame(function () {
      loaderEl.classList.add('is-out');
      setTimeout(function () {
        loaderEl.remove();
        loaderStyle.remove();
      }, 700);
    });
  }

  // ---------------------------------------------------------------------------
  // Island
  // ---------------------------------------------------------------------------

  var PIN_SVG =
    '<svg viewBox="0 0 24 34" aria-hidden="true" focusable="false">' +
    '<defs><clipPath id="imx-pin-clip"><path d="M12 0C5.37 0 0 5.2 0 11.62 0 20.3 12 34 12 34s12-13.7 12-22.38C24 5.2 18.63 0 12 0z"/></clipPath></defs>' +
    '<g clip-path="url(#imx-pin-clip)">' +
    '<path fill="#34A853" d="M0 0h24v34H0z"/>' +
    '<path fill="#FBBC04" d="M0 15l12-3.4L4 26H0z"/>' +
    '<path fill="#EA4335" d="M0 0h5l7 11.6L0 15z"/>' +
    '<path fill="#4285F4" d="M5 0h19v15l-12-3.4z"/>' +
    '</g>' +
    '<circle cx="12" cy="11.6" r="4.3" fill="#fff"/>' +
    '</svg>';

  function buildIsland() {
    if (document.querySelector('[data-imx-island]')) return;

    var logoImg = el('img', { src: resolve(cfg.logo), alt: cfg.logoAlt, width: 393, height: 92, decoding: 'async' });
    var logo = el('a', { class: 'imx-island__logo', href: cfg.logoLink }, [logoImg]);

    var bar = el('nav', { class: 'imx-island__bar', 'aria-label': 'Quick links' });
    cfg.nav.forEach(function (item) {
      var a = el('a', { class: 'imx-pill', href: item.href });
      if (item.short) {
        a.setAttribute('aria-label', item.label);
        a.appendChild(el('span', { class: 'imx-pill__full', text: item.label }));
        a.appendChild(el('span', { class: 'imx-pill__short', text: item.short, 'aria-hidden': 'true' }));
      } else {
        a.textContent = item.label;
      }
      if (item.newTab) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
      bar.appendChild(a);
    });

    if (cfg.mapUrl) {
      var map = el('a', {
        class: 'imx-island__map',
        href: cfg.mapUrl,
        target: '_blank',
        rel: 'noopener',
        'aria-label': cfg.mapLabel,
        title: cfg.mapLabel
      });
      map.innerHTML = PIN_SVG;
      bar.appendChild(map);
    }

    var island = el('header', { class: 'imx-island', 'data-imx-island': '' }, [logo, bar]);
    document.body.appendChild(island);

    function measure() {
      island.style.setProperty('--imx-logo-h', logo.offsetHeight + 'px');
    }
    function onScroll() {
      island.classList.toggle('is-compact', (window.scrollY || window.pageYOffset) > 40);
    }

    logoImg.addEventListener('load', measure);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', onScroll, { passive: true });
    measure();
    onScroll();
  }

  // ---------------------------------------------------------------------------
  // Frame loading
  // ---------------------------------------------------------------------------

  // Frames start downloading at DOM ready, before the stylesheet and stage exist.
  var earlyFrames = null;

  function pickSet() {
    var w = window.innerWidth;
    var h = window.innerHeight || 1;
    return w / h < cfg.frames.mobileBelowAspect ? 'mobile' : 'desktop';
  }

  function Frames(set, onFrame) {
    var f = cfg.frames;
    this.set = set;
    this.count = f.count;
    this.imgs = new Array(f.count);
    this.ready = new Uint8Array(f.count);
    this.loaded = 0;
    this.stopped = false;
    this.onFrame = onFrame || function () {};

    // First frame, then progressively finer passes so the whole video is
    // scrubbable (coarsely) within a second or two.
    var seen = new Uint8Array(f.count);
    var order = [];
    [f.count, 32, 16, 8, 4, 2, 1].forEach(function (step) {
      for (var i = 0; i < f.count; i += step) {
        if (!seen[i]) {
          seen[i] = 1;
          order.push(i);
        }
      }
    });
    if (!seen[f.count - 1]) order.push(f.count - 1);
    this.queue = order;
    this.active = 0;
    this.pump();
  }

  Frames.prototype.url = function (i) {
    var f = cfg.frames;
    var n = String(i + 1);
    while (n.length < f.digits) n = '0' + n;
    return resolve(f.path) + this.set + '/' + n + '.' + f.ext;
  };

  Frames.prototype.pump = function () {
    var self = this;
    while (!self.stopped && self.active < 8 && self.queue.length) {
      (function (i) {
        self.active++;
        var img = new Image();
        img.decoding = 'async';
        var finish = function (ok) {
          self.active--;
          if (ok && !self.stopped) {
            self.imgs[i] = img;
            self.ready[i] = 1;
          }
          self.loaded++;
          self.onFrame(self, i, ok);
          self.pump();
        };
        img.onload = function () {
          if (img.decode) img.decode().then(function () { finish(true); }, function () { finish(true); });
          else finish(true);
        };
        img.onerror = function () { finish(false); };
        img.src = self.url(i);
      })(self.queue.shift());
    }
  };

  Frames.prototype.nearest = function (i) {
    if (this.ready[i]) return i;
    for (var d = 1; d < this.count; d++) {
      if (i - d >= 0 && this.ready[i - d]) return i - d;
      if (i + d < this.count && this.ready[i + d]) return i + d;
    }
    return -1;
  };

  // ---------------------------------------------------------------------------
  // Scroll stage
  // ---------------------------------------------------------------------------

  function findMount() {
    var node = cfg.mount && document.querySelector(cfg.mount);
    if (node) return node;
    node = el('div', { id: 'imagine-scroll' });
    var hosts = ['#sections', 'article.sections', 'main#page', 'main', '#page', '#canvas'];
    for (var i = 0; i < hosts.length; i++) {
      var host = document.querySelector(hosts[i]);
      if (host) {
        host.insertBefore(node, host.firstChild);
        return node;
      }
    }
    document.body.insertBefore(node, document.body.firstChild);
    return node;
  }

  function buildStage() {
    var root = findMount();
    if (root.__imx) return;
    root.__imx = true;
    root.innerHTML = '';
    root.classList.add('imx');
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', 'Video tour');
    root.style.height = 'calc(100vh + ' + cfg.scrollLength + 'vh)';

    // Squarespace: when mounted inside a Code Block, flatten the host section's padding.
    if (root.closest && root.closest('.sqs-block')) {
      var section = root.closest('.page-section, section');
      if (section) section.classList.add('imx-host-section');
    }

    var stage = el('div', { class: 'imx__stage' });
    var canvas = el('canvas', { class: 'imx__canvas', 'aria-hidden': 'true' });
    var ctx = canvas.getContext('2d', { alpha: false });
    var scrimTop = el('div', { class: 'imx__scrim imx__scrim--top' });
    stage.appendChild(canvas);
    stage.appendChild(scrimTop);
    if (cfg.captions && cfg.sideLabel) {
      stage.appendChild(el('div', { class: 'imx__side', 'aria-hidden': 'true', text: cfg.sideLabel }));
    }

    // Timeline → cumulative scroll weights
    var segs = [];
    var totalW = 0;
    cfg.timeline.forEach(function (s) {
      segs.push({ t0: s.t[0], t1: s.t[1], w: s.w, start: totalW, id: s.id });
      totalW += s.w;
    });

    // Captions
    var caps = [];
    var rail = el('div', { class: 'imx__rail', 'aria-hidden': 'true' });
    var railFills = [];
    segs.forEach(function (seg, idx) {
      var copy = cfg.captions && seg.id && cfg.copy[seg.id];
      if (!copy) return;
      var type = copy.type || 'chapter';
      var node = buildCaption(copy, type);
      stage.appendChild(node);
      caps.push({
        seg: seg,
        node: node,
        fadeIn: idx === 0 ? 0 : 0.2,
        fadeOut: idx === segs.length - 1 ? 1 : idx === 0 ? 0.35 : 0.8,
        interactive: !!node.querySelector('a')
      });
      if (type === 'chapter') {
        var fill = el('span', { class: 'imx__rail-fill' });
        rail.appendChild(el('span', { class: 'imx__rail-seg' }, [fill]));
        railFills.push({ seg: seg, node: fill });
      }
    });

    if (railFills.length) stage.appendChild(rail);
    root.appendChild(stage);

    // --- frames -------------------------------------------------------------

    var fps = cfg.frames.fps;
    var frameCount = cfg.frames.count;
    var frames = null;
    var prevFrames = null;
    var wantFrame = 0;
    var drawn = null; // { set, i }
    var dirty = true;

    function onFrame(owner, i) {
      if (owner !== frames) return;
      var cur = drawn && drawn.set === owner.set ? drawn.i : -1;
      if (cur < 0 || Math.abs(i - wantFrame) < Math.abs(cur - wantFrame)) {
        dirty = true;
        draw();
      }
    }

    function useSet(set) {
      if (frames && frames.set === set) return;
      if (!frames && earlyFrames && earlyFrames.set === set) {
        frames = earlyFrames;
        frames.onFrame = onFrame;
        dirty = true;
        return;
      }
      if (frames) {
        frames.stopped = true;
        prevFrames = frames;
      }
      frames = new Frames(set, onFrame);
    }

    function draw() {
      var src = frames;
      var i = src.nearest(wantFrame);
      if (i < 0 && prevFrames) {
        src = prevFrames;
        i = src.nearest(wantFrame);
      }
      if (i < 0) return;
      if (!dirty && drawn && drawn.set === src.set && drawn.i === i) return;
      var img = src.imgs[i];
      var cw = canvas.width;
      var ch = canvas.height;
      var iw = img.naturalWidth;
      var ih = img.naturalHeight;
      if (!cw || !ch || !iw || !ih) return;
      var s = Math.max(cw / iw, ch / ih);
      var dw = iw * s;
      var dh = ih * s;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      drawn = { set: src.set, i: i };
      dirty = false;
    }

    function sizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = stage.clientWidth;
      var h = stage.clientHeight;
      var bw = Math.round(w * dpr);
      var bh = Math.round(h * dpr);
      var cap = 4096 / Math.max(bw, bh, 1);
      if (cap < 1) {
        bw = Math.round(bw * cap);
        bh = Math.round(bh * cap);
      }
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        dirty = true;
      }
    }

    // --- layout: full-bleed + sticky safety ----------------------------------

    function breakout() {
      if (!cfg.fullBleed) return;
      root.style.width = '';
      root.style.marginLeft = '';
      var vw = document.documentElement.clientWidth;
      var r = root.getBoundingClientRect();
      if (Math.abs(r.left) > 0.5 || Math.abs(r.width - vw) > 0.5) {
        root.style.width = vw + 'px';
        root.style.marginLeft = -r.left + 'px';
      }
    }

    // position: sticky silently stops working when any parent has overflow set.
    // Squarespace wrappers often do, so relax them (clip still hides sideways overflow).
    function freeAncestors() {
      var vw = document.documentElement.clientWidth;
      var canClip = window.CSS && CSS.supports && CSS.supports('overflow-x', 'clip');
      for (var n = root.parentElement; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
        var cs = getComputedStyle(n);
        if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
        var wide = n.getBoundingClientRect().width >= vw - 1;
        n.style.setProperty('overflow-x', wide && canClip ? 'clip' : 'visible', 'important');
        n.style.setProperty('overflow-y', 'visible', 'important');
      }
    }

    // --- scroll → progress ---------------------------------------------------

    var target = 0;
    var current = 0;
    var raf = 0;
    var lastTs = 0;
    var jsPin = false;
    var scrollable = 1;
    var stageH = 1;

    function measure() {
      stageH = stage.offsetHeight || window.innerHeight;
      scrollable = Math.max(1, root.offsetHeight - stageH);
    }

    function readScroll() {
      var r = root.getBoundingClientRect();
      var offset = clamp(-r.top, 0, scrollable);
      target = offset / scrollable;

      if (!jsPin && r.top < -2 && r.bottom > stageH + 2) {
        var st = stage.getBoundingClientRect().top;
        if (Math.abs(st) > 2) {
          jsPin = true;
          root.classList.add('imx--js-pin');
        }
      }
      if (jsPin) stage.style.transform = 'translate3d(0,' + offset + 'px,0)';
    }

    function timeAt(x) {
      for (var i = 0; i < segs.length; i++) {
        var s = segs[i];
        if (x <= s.start + s.w || i === segs.length - 1) {
          var local = s.w ? clamp((x - s.start) / s.w, 0, 1) : 1;
          return s.t0 + (s.t1 - s.t0) * local;
        }
      }
      return 0;
    }

    function render(p) {
      var x = p * totalW;
      wantFrame = clamp(Math.round(timeAt(x) * fps), 0, frameCount - 1);
      draw();

      caps.forEach(function (c) {
        var lp = (x - c.seg.start) / c.seg.w;
        var op;
        if (lp < 0) op = c.fadeIn === 0 ? 1 : 0;
        else if (lp > 1) op = c.fadeOut >= 1 ? 1 : 0;
        else op = Math.min(smooth(0, c.fadeIn, lp), 1 - smooth(c.fadeOut, 1, lp));
        var shift = (1 - op) * (lp < 0.5 ? 26 : -26);
        c.node.style.opacity = op.toFixed(3);
        c.node.style.transform = 'translate3d(0,' + shift.toFixed(1) + 'px,0)';
        c.node.classList.toggle('is-live', op > 0.001);
        c.node.classList.toggle('is-interactive', c.interactive && op > 0.6);
      });

      railFills.forEach(function (r) {
        r.node.style.transform = 'scaleX(' + clamp((x - r.seg.start) / r.seg.w, 0, 1).toFixed(4) + ')';
      });
    }

    function tick(ts) {
      raf = 0;
      var dt = lastTs ? Math.min(64, ts - lastTs) : 16.7;
      lastTs = ts;
      var k = reducedMotion ? 1 : 1 - Math.pow(1 - cfg.smoothing, dt / 16.7);
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0002) current = target;
      render(current);
      if (current !== target) raf = requestAnimationFrame(tick);
      else lastTs = 0;
    }

    function kick() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function onScroll() {
      readScroll();
      kick();
    }

    function onResize() {
      useSet(pickSet());
      breakout();
      measure();
      sizeCanvas();
      readScroll();
      dirty = true;
      draw();
      kick();
    }

    // --- go -------------------------------------------------------------------

    freeAncestors();
    breakout();
    measure();
    sizeCanvas();
    useSet(pickSet());
    readScroll();
    current = target;
    render(current);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    if (window.ResizeObserver) {
      new ResizeObserver(function () {
        measure();
        sizeCanvas();
        dirty = true;
        draw();
      }).observe(stage);
    }
    // Squarespace sometimes settles its layout after load; re-check once.
    window.addEventListener('load', onResize);
  }

  function buildCaption(copy, type) {
    var head = el('div', { class: 'imx-cap__head' });
    var eyebrow = el('p', { class: 'imx-cap__eyebrow' });
    if (copy.num) eyebrow.appendChild(el('span', { class: 'imx-cap__num', text: copy.num }));
    if (copy.label) eyebrow.appendChild(el('span', { class: 'imx-cap__label', text: copy.label }));
    if (copy.num || copy.label) head.appendChild(eyebrow);
    head.appendChild(lines(el('h2', { class: 'imx-cap__title' }), copy.title));

    var side = el('div', { class: 'imx-cap__side' });
    if (copy.body) side.appendChild(lines(el('p', { class: 'imx-cap__body' }), copy.body));

    if (copy.cue) {
      side.appendChild(el('div', { class: 'imx__cue', 'aria-hidden': 'true' }, [
        el('span', { class: 'imx__cue-line' }),
        el('span', { text: copy.cue })
      ]));
    }

    if (type === 'cta') {
      var actions = el('div', { class: 'imx-cap__actions' });
      cfg.nav.forEach(function (item, i) {
        actions.appendChild(el('a', { class: 'imx-btn' + (i === 0 ? ' imx-btn--filled' : ''), href: item.href, text: item.label }));
      });
      if (cfg.mapUrl && copy.directions) {
        actions.appendChild(el('a', { class: 'imx-link', href: cfg.mapUrl, target: '_blank', rel: 'noopener', text: copy.directions }));
      }
      side.appendChild(actions);
    }

    var node = el('div', { class: 'imx-cap imx-cap--' + type }, [head, side]);
    // Optional per-caption text colour, e.g. a brighter orange over a dark scene.
    if (copy.color) node.style.setProperty('--imx-text', copy.color);
    return node;
  }

  // ---------------------------------------------------------------------------

  var useLoader = cfg.video && cfg.loader;
  if (useLoader) coverPage();
  else stageReady = true;
  ensureFonts();
  ready(function () {
    if (cfg.video) earlyFrames = new Frames(pickSet());
    if (useLoader) showLoader();
    loadCss(function () {
      if (cfg.hideSiteHeader) document.documentElement.classList.add('imx-hide-site-header');
      if (cfg.island) buildIsland();
      if (cfg.video) buildStage();
      stageReady = true;
    });
  });
})();
