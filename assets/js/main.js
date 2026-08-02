/* ============================================================
   CHANGER—CHANGER · 交互层
   观测站画布 / 指纹生成 / 光标 / 转场 / 揭示 / TOC
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var motionStored = null;
  try { motionStored = localStorage.getItem('cz-motion'); } catch (e) {}
  var reduced = reduceQuery.matches || motionStored === 'reduced';
  if (reduced) root.classList.add('motion-reduced');

  function hashString(value) {
    var hash = 2166136261;
    for (var i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
  function seededRandom(seed) {
    var state = seed >>> 0;
    return function () {
      state += 0x6D2B79F5;
      var t = Math.imul(state ^ (state >>> 15), state | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function cssColor(name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }

  /* ---------- 加载器 ---------- */
  var loaderDone = false;
  function finishLoader() {
    var loader = document.querySelector('.site-loader');
    if (!loader || loaderDone) return;
    loaderDone = true;
    var count = loader.querySelector('.loader-counter span');
    var bar = loader.querySelector('.loader-line span');
    var start = performance.now();
    var duration = reduced ? 60 : 850;
    function tick(now) {
      var p = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      if (count) count.textContent = String(Math.round(eased * 100)).padStart(2, '0');
      if (bar) bar.style.width = (eased * 100) + '%';
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(function () { loader.classList.add('is-done'); }, reduced ? 0 : 200);
    }
    requestAnimationFrame(tick);
  }
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1100); })]).then(finishLoader);
  } else {
    window.addEventListener('load', finishLoader, { once: true });
  }
  setTimeout(finishLoader, 1600);

  /* ---------- 逐字切分 ---------- */
  function splitText() {
    document.querySelectorAll('[data-split]').forEach(function (element) {
      if (element.dataset.splitReady) return;
      var text = element.textContent;
      element.dataset.splitReady = 'true';
      element.setAttribute('aria-label', text.trim());
      var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      var textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      textNodes.forEach(function (node) {
        var fragment = document.createDocumentFragment();
        Array.from(node.nodeValue).forEach(function (char) {
          var span = document.createElement('span');
          span.className = 'split-char';
          span.setAttribute('aria-hidden', 'true');
          span.textContent = char === ' ' ? ' ' : char;
          fragment.appendChild(span);
        });
        node.parentNode.replaceChild(fragment, node);
      });
    });
  }
  splitText();

  /* ---------- 平滑滚动（Lenis） ---------- */
  var lenis = null;
  if (!reduced && window.Lenis && window.innerWidth > 760) {
    lenis = new window.Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: .9, anchors: true });
    (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
    }
  }

  /* ---------- 导航 ---------- */
  var navbar = document.querySelector('.navbar');
  function onScrollNav() {
    if (navbar) navbar.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  var menuToggle = document.querySelector('.menu-toggle');
  var mobileMenu = document.getElementById('mobile-menu');
  function setMenu(open) {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.querySelector('span').textContent = open ? 'CLOSE' : 'MENU';
    document.body.classList.toggle('menu-open', open);
    if (lenis) { open ? lenis.stop() : lenis.start(); }
  }
  if (menuToggle) menuToggle.addEventListener('click', function () {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- 动效开关 ---------- */
  var motionToggle = document.querySelector('.motion-toggle');
  function syncMotionToggle() {
    if (!motionToggle) return;
    motionToggle.classList.toggle('is-off', reduced);
    motionToggle.setAttribute('aria-label', reduced ? '开启动态效果' : '关闭动态效果');
  }
  syncMotionToggle();
  if (motionToggle) {
    motionToggle.addEventListener('click', function () {
      try { localStorage.setItem('cz-motion', reduced ? 'full' : 'reduced'); } catch (e) {}
      window.location.reload();
    });
  }

  /* ---------- 自定义光标 ---------- */
  var cursor = document.querySelector('.cursor-orbit');
  if (cursor && window.matchMedia('(pointer:fine)').matches && !reduced) {
    var cx = -100, cy = -100, tx = -100, ty = -100;
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      cursor.classList.add('is-visible');
    }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var target = e.target.closest('[data-cursor], a, button');
      if (!target) return;
      cursor.classList.add('is-active');
      cursor.querySelector('span').textContent = target.getAttribute('data-cursor') || '';
    });
    document.addEventListener('pointerout', function (e) {
      if (!e.target.closest('[data-cursor], a, button')) return;
      cursor.classList.remove('is-active');
      cursor.querySelector('span').textContent = '';
    });
    (function move() {
      cx += (tx - cx) * .2; cy += (ty - cy) * .2;
      cursor.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      requestAnimationFrame(move);
    })();
  }

  /* ---------- 页面转场 ---------- */
  var transition = document.querySelector('.page-transition');
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link || !transition || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || link.target === '_blank' || link.hasAttribute('download')) return;
    if (url.hash && url.pathname === window.location.pathname) return;
    e.preventDefault();
    transition.classList.add('is-entering');
    setTimeout(function () { window.location.href = url.href; }, reduced ? 0 : 420);
  });

  /* ---------- 阅读进度 ---------- */
  var progressBar = document.getElementById('reading-progress-bar');
  function updateProgress() {
    if (!progressBar) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
    progressBar.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ---------- 思想星图（每篇文章一幅生成式星图，主题感知） ---------- */
  function drawStarMap(canvas) {
    var box = canvas.getBoundingClientRect();
    if (!box.width || !box.height) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(box.width * dpr);
    canvas.height = Math.round(box.height * dpr);
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    var random = seededRandom(hashString('starmap:' + (canvas.dataset.artTitle || 'changer')));
    var accent = '#FF5A1F';
    var W = box.width, H = box.height;
    var cx = W * (.4 + random() * .2), cy = H * (.44 + random() * .12);
    var spread = Math.min(W, H) * (.26 + random() * .08);

    /* 深空底片：径向渐变 + 暗角 */
    var bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * .9);
    bg.addColorStop(0, '#0D1428');
    bg.addColorStop(.55, '#080C1A');
    bg.addColorStop(1, '#04060D');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* 天球坐标网格（graticule） */
    ctx.lineWidth = .6;
    for (var g = 0; g < 3; g += 1) {
      ctx.strokeStyle = 'rgba(160, 185, 235, ' + (.045 + g * .015) + ')';
      ctx.beginPath();
      ctx.ellipse(cx, cy, spread * (1.1 + g * .55), spread * (.5 + g * .22), -.3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(160, 185, 235, .05)';
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();

    /* 星云：多层叠加 */
    var nebulae = [
      ['rgba(46, 107, 255, ', .14, 2.4],
      ['rgba(138, 92, 255, ', .1, 1.7],
      ['rgba(53, 224, 255, ', .07, 2.9]
    ];
    nebulae.forEach(function (nb, ni) {
      var nx = cx + (random() - .5) * spread * 1.6, ny = cy + (random() - .5) * spread * 1.2;
      var g2 = ctx.createRadialGradient(nx, ny, 0, nx, ny, spread * nb[2]);
      g2.addColorStop(0, nb[0] + nb[1] + ')');
      g2.addColorStop(.6, nb[0] + nb[1] * .35 + ')');
      g2.addColorStop(1, nb[0] + '0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);
    });

    /* 背景星尘（带色温） */
    var tints = ['#FFFFFF', '#CFE0FF', '#FFE9D2', '#DCE8FF'];
    for (var d = 0; d < 150; d += 1) {
      ctx.fillStyle = tints[(random() * tints.length) | 0];
      ctx.globalAlpha = .06 + random() * .4;
      var ds = random();
      ctx.fillRect(random() * W, random() * H, ds > .92 ? 1.6 : 1, ds > .92 ? 1.6 : 1);
    }
    ctx.globalAlpha = 1;

    /* 星位：一到两个星团 */
    var count = 13 + Math.floor(random() * 5);
    var twoClusters = random() < .5;
    var cx2 = cx + (random() - .5) * spread * 3.2, cy2 = cy + (random() - .5) * spread * 1.7;
    var stars = [];
    for (var i = 0; i < count; i += 1) {
      var inSecond = twoClusters && i > count * .55;
      var baseX = inSecond ? cx2 : cx, baseY = inSecond ? cy2 : cy;
      var a = i * 2.399963 + random() * .5;
      var r = Math.sqrt(((inSecond ? i - count * .55 : i) + .6) / count) * spread * (0.5 + random() * .55);
      stars.push({
        x: baseX + Math.cos(a) * r * 1.5,
        y: baseY + Math.sin(a) * r,
        s: .9 + random() * 1.8,
        tint: tints[(random() * tints.length) | 0]
      });
    }

    /* 星座连线：极细发线，若隐若现 */
    ctx.lineWidth = .5;
    var linked = {};
    for (var j = 0; j < stars.length; j += 1) {
      var best = -1, bestD = 1e9;
      for (var k = 0; k < stars.length; k += 1) {
        if (k === j) continue;
        var dx = stars[j].x - stars[k].x, dy = stars[j].y - stars[k].y;
        var dd = dx * dx + dy * dy;
        var key = Math.min(j, k) + '-' + Math.max(j, k);
        if (dd < bestD && !linked[key]) { bestD = dd; best = k; }
      }
      if (best >= 0) {
        linked[Math.min(j, best) + '-' + Math.max(j, best)] = true;
        ctx.strokeStyle = 'rgba(190, 208, 245, .13)';
        ctx.beginPath();
        ctx.moveTo(stars[j].x, stars[j].y);
        ctx.lineTo(stars[best].x, stars[best].y);
        ctx.stroke();
      }
    }

    /* 恒星：辉光核心 + 亮星衍射芒 */
    stars.forEach(function (st, idx) {
      var primary = idx === 0;
      var glowR = st.s * (primary ? 9 : 5.5);
      var glow = ctx.createRadialGradient(st.x, st.y, 0, st.x, st.y, glowR);
      if (primary) {
        glow.addColorStop(0, 'rgba(255, 240, 225, .95)');
        glow.addColorStop(.25, 'rgba(255, 90, 31, .5)');
        glow.addColorStop(1, 'rgba(255, 90, 31, 0)');
      } else {
        glow.addColorStop(0, 'rgba(255, 255, 255, .85)');
        glow.addColorStop(.3, 'rgba(200, 218, 250, .25)');
        glow.addColorStop(1, 'rgba(200, 218, 250, 0)');
      }
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(st.x, st.y, glowR, 0, Math.PI * 2); ctx.fill();

      /* 衍射芒 */
      if (primary || st.s > 2) {
        var sp = st.s * (primary ? 14 : 8);
        ctx.strokeStyle = primary ? 'rgba(255, 200, 170, .5)' : 'rgba(220, 232, 255, .35)';
        ctx.lineWidth = .6;
        ctx.beginPath();
        ctx.moveTo(st.x - sp, st.y); ctx.lineTo(st.x + sp, st.y);
        ctx.moveTo(st.x, st.y - sp); ctx.lineTo(st.x, st.y + sp);
        ctx.stroke();
      }

      /* 核心 */
      ctx.fillStyle = primary ? accent : st.tint;
      ctx.beginPath(); ctx.arc(st.x, st.y, primary ? st.s + .4 : st.s, 0, Math.PI * 2); ctx.fill();
      if (primary) {
        ctx.strokeStyle = 'rgba(255, 90, 31, .55)';
        ctx.lineWidth = .8;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.s + 5, 0, Math.PI * 2); ctx.stroke();
      }
    });

    /* 胶片颗粒 + 暗角 */
    for (var n = 0; n < 500; n += 1) {
      ctx.fillStyle = random() < .5 ? '#000' : '#FFF';
      ctx.globalAlpha = .022;
      ctx.fillRect(random() * W, random() * H, 1, 1);
    }
    ctx.globalAlpha = 1;
    var vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .42, W / 2, H / 2, Math.max(W, H) * .75);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(2,3,8,.5)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }
  function renderStarMaps() {
    document.querySelectorAll('.starmap-canvas').forEach(drawStarMap);
  }
  renderStarMaps();
  new MutationObserver(function () { renderStarMaps(); })
    .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { renderStarMaps(); renderResumeFields(); }, 180);
  });

  /* ---------- 履历页力场（data-resume-field） ---------- */
  function renderResumeFields() {
    document.querySelectorAll('[data-resume-field]').forEach(function (canvas) {
      var box = canvas.getBoundingClientRect();
      if (!box.width || !box.height) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(box.width * dpr);
      canvas.height = Math.round(box.height * dpr);
      var ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var random = seededRandom(hashString('resume-field-' + window.location.pathname));
      var paper = cssColor('--x-paper');
      var accent = cssColor('--accent');
      ctx.clearRect(0, 0, box.width, box.height);
      ctx.fillStyle = '#11120f';
      ctx.fillRect(0, 0, box.width, box.height);
      ctx.lineWidth = .7;
      ctx.strokeStyle = 'rgba(239,237,228,.14)';
      for (var grid = -box.height; grid < box.width + box.height; grid += 28) {
        ctx.beginPath();
        ctx.moveTo(grid, 0);
        ctx.lineTo(grid - box.height, box.height);
        ctx.stroke();
      }
      var ccx = box.width * .52;
      var ccy = box.height * .5;
      for (var ring = 0; ring < 26; ring += 1) {
        ctx.beginPath();
        var radius = (ring + 1) * Math.min(box.width, box.height) * .018;
        for (var step = 0; step <= 120; step += 1) {
          var angle = step / 120 * Math.PI * 2;
          var wobble = Math.sin(angle * (3 + ring % 4) + ring * .6) * (2 + ring * .14);
          var x = ccx + Math.cos(angle) * (radius * 1.48 + wobble);
          var y = ccy + Math.sin(angle) * (radius + wobble);
          step === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = ring % 5 === 0 ? accent : 'rgba(239,237,228,' + (.08 + random() * .18) + ')';
        ctx.lineWidth = ring % 5 === 0 ? 1.2 : .65;
        ctx.stroke();
      }
      ctx.fillStyle = accent;
      for (var node = 0; node < 18; node += 1) {
        ctx.beginPath();
        ctx.arc(random() * box.width, random() * box.height, random() * 2 + .7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = paper;
      ctx.globalAlpha = .75;
      ctx.font = '500 9px "DM Mono", monospace';
      ctx.fillText('FIELD / 01', 16, box.height - 18);
      ctx.globalAlpha = 1;
    });
  }
  renderResumeFields();
  new MutationObserver(renderResumeFields).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---------- HERO 观测站画布（vanilla，替代 p5） ---------- */
  var fieldHost = document.getElementById('latent-field');
  if (fieldHost) {
    var fc = document.createElement('canvas');
    fieldHost.appendChild(fc);
    var fx = fc.getContext('2d');
    var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var pointer = { x: .62, y: .42 };
    var seed = hashString(window.location.pathname + 'latent-cartography');
    var running = true;
    var frame = 0;

    function fieldResize() {
      W = fieldHost.clientWidth; H = fieldHost.clientHeight;
      fc.width = Math.round(W * DPR); fc.height = Math.round(H * DPR);
      fx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var rnd = seededRandom(seed);
      particles = [];
      var count = W < 700 ? 46 : 84;
      for (var i = 0; i < count; i += 1) {
        var a = i * 2.399963229728653;
        var r = Math.sqrt((i + 1) / count);
        particles.push({
          x: W * (.55 + Math.cos(a) * r * .4),
          y: H * (.44 + Math.sin(a) * r * .34),
          px: 0, py: 0, vx: 0, vy: 0,
          phase: rnd() * Math.PI * 2,
          weight: .45 + rnd() * .9
        });
      }
    }
    fieldResize();
    window.addEventListener('resize', fieldResize);

    fieldHost.parentElement.addEventListener('pointermove', function (e) {
      var rect = fieldHost.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left) / Math.max(1, rect.width);
      pointer.y = (e.clientY - rect.top) / Math.max(1, rect.height);
    }, { passive: true });

    /* 离屏时才暂停 */
    new IntersectionObserver(function (entries) {
      running = entries[0].isIntersecting;
    }, { threshold: 0 }).observe(fieldHost);

    var readoutX = document.querySelector('[data-readout-x]');
    var readoutY = document.querySelector('[data-readout-y]');
    var readoutT = document.querySelector('[data-readout-t]');
    var lastReadout = 0;

    function drawField() {
      requestAnimationFrame(drawField);
      if (!running) return;
      frame += 1;
      var t = reduced ? 4.2 : frame * .0045;
      var scrollPhase = window.scrollY * .0004;
      var ink = cssColor('--ink');
      var accent = cssColor('--accent');
      fx.clearRect(0, 0, W, H);

      /* 等值环 */
      fx.save();
      fx.translate(W * .55, H * .44);
      for (var ring = 0; ring < 6; ring += 1) {
        var isA = ring === 2;
        fx.strokeStyle = isA ? accent : ink;
        fx.globalAlpha = isA ? .5 : .14;
        fx.lineWidth = isA ? 1.1 : .55;
        fx.beginPath();
        var pts = 150;
        for (var i = 0; i <= pts; i += 1) {
          var a = (i / pts) * Math.PI * 2;
          var wave = Math.sin(a * (3 + ring) + t * (ring % 2 ? -1 : 1) * 1.6) * (7 + ring * 2.2)
                   + Math.sin(a * 7 - t * 2.1) * 2.5;
          var radius = Math.min(W, H) * (.1 + ring * .068) + wave;
          var x = Math.cos(a) * radius;
          var y = Math.sin(a) * radius * .64;
          i === 0 ? fx.moveTo(x, y) : fx.lineTo(x, y);
        }
        fx.stroke();
      }
      fx.restore();

      /* 流场粒子 */
      var px = pointer.x * W, py = pointer.y * H;
      for (var j = 0; j < particles.length; j += 1) {
        var p = particles[j];
        p.px = p.x; p.py = p.y;
        var n = Math.sin(p.x * .0016 + t + scrollPhase) * Math.cos(p.y * .0016 - t * .7);
        var angle = n * Math.PI * 2.4 + Math.sin(p.phase + t) * .4;
        var dx = px - p.x, dy = py - p.y;
        var distSq = dx * dx + dy * dy;
        var force = Math.min(.05, 620 / Math.max(9000, distSq));
        p.vx = p.vx * .93 + Math.cos(angle) * .055 + dx * force * .004;
        p.vy = p.vy * .93 + Math.sin(angle) * .055 + dy * force * .004;
        p.x += p.vx * p.weight;
        p.y += p.vy * p.weight;
        if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
          var rnd2 = seededRandom(seed + j + frame);
          p.x = rnd2() * W; p.y = rnd2() * H; p.vx = p.vy = 0; p.px = p.x; p.py = p.y;
        }
        var isA2 = j % 13 === 0;
        fx.strokeStyle = isA2 ? accent : ink;
        fx.globalAlpha = isA2 ? .7 : .26;
        fx.lineWidth = isA2 ? 1.5 : .6;
        fx.beginPath(); fx.moveTo(p.px, p.py); fx.lineTo(p.x, p.y); fx.stroke();
        if (j % 11 === 0) {
          fx.fillStyle = isA2 ? accent : ink;
          fx.globalAlpha = .8;
          fx.beginPath(); fx.arc(p.x, p.y, isA2 ? 2.4 : 1.2, 0, Math.PI * 2); fx.fill();
        }
      }

      /* 指针十字丝 */
      fx.globalAlpha = .55;
      fx.strokeStyle = ink;
      fx.lineWidth = .7;
      fx.beginPath();
      fx.moveTo(px - 14, py); fx.lineTo(px + 14, py);
      fx.moveTo(px, py - 14); fx.lineTo(px, py + 14);
      fx.stroke();
      fx.globalAlpha = .9;
      fx.strokeStyle = accent;
      fx.beginPath(); fx.arc(px, py, 26, 0, Math.PI * 2); fx.stroke();
      fx.globalAlpha = 1;

      /* 坐标读数（10fps 足够） */
      if (frame - lastReadout > 6) {
        lastReadout = frame;
        if (readoutX) readoutX.textContent = pointer.x.toFixed(3);
        if (readoutY) readoutY.textContent = pointer.y.toFixed(3);
        if (readoutT) {
          var d = new Date();
          readoutT.textContent = String(d.getHours()).padStart(2, '0') + ':' +
            String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
        }
      }
    }
    drawField();
  }

  /* ---------- GSAP 揭示 ---------- */
  function startHeroIntro(gsap) {
    gsap.to('.experience-title .title-line .split-char', {
      y: 0, yPercent: 0, duration: 1.1, stagger: .022, ease: 'expo.out', delay: .15,
      startAt: { yPercent: 115 }
    });
    gsap.from('.experience-kicker, .experience-intro, .hero-coordinate, .hero-ruler, .hero-readout', {
      opacity: 0, y: 14, duration: .8, stagger: .07, ease: 'power2.out', delay: .55
    });
  }

  if (window.gsap && !reduced) {
    var gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    var introEl = document.getElementById('intro');
    var introWillPlay = introEl && !introEl.classList.contains('is-gone');
    if (introWillPlay) {
      document.addEventListener('cz:intro:done', function () { startHeroIntro(gsap); }, { once: true });
    } else {
      startHeroIntro(gsap);
    }

    if (window.ScrollTrigger) {
      gsap.to('.manifesto-track', {
        xPercent: -30, ease: 'none',
        scrollTrigger: { trigger: '.manifesto-stage', start: 'top bottom', end: 'bottom top', scrub: .6 }
      });
      gsap.to('.latent-field', {
        scale: 1.12, opacity: .5, ease: 'none',
        scrollTrigger: { trigger: '.experience-hero', start: 'top top', end: 'bottom top', scrub: .6 }
      });
      gsap.to('.theory-field', {
        rotate: 30, ease: 'none',
        scrollTrigger: { trigger: '.theory-gateway', start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
      document.querySelectorAll('[data-reveal]').forEach(function (el) {
        gsap.fromTo(el, { opacity: 0, y: 28 }, {
          opacity: 1, y: 0, duration: .85, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
      });
      document.querySelectorAll('.page-hero [data-split] .split-char, .post-title[data-split] .split-char, .page-hero.compact [data-split] .split-char').forEach(function (el, i) {
        gsap.from(el, { yPercent: 110, opacity: 0, duration: .7, delay: .1 + i * .02, ease: 'expo.out' });
      });
    }
    root.classList.add('anim-nojs-clear');
  } else {
    root.classList.remove('anim');
    root.classList.add('anim-nojs');
  }

  /* ---------- 文章 TOC ---------- */
  var toc = document.getElementById('article-toc');
  var articleContent = document.querySelector('.post-content');
  if (toc && articleContent) {
    var headings = articleContent.querySelectorAll('h2, h3');
    headings.forEach(function (heading, index) {
      if (!heading.id) heading.id = 'section-' + (index + 1);
      var link = document.createElement('a');
      link.href = '#' + heading.id;
      link.textContent = heading.textContent;
      if (heading.tagName.toLowerCase() === 'h3') link.className = 'is-sub';
      toc.appendChild(link);
    });
    var tocLinks = Array.from(toc.querySelectorAll('a'));
    if (tocLinks.length && 'IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          tocLinks.forEach(function (l) {
            l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id);
          });
        });
      }, { rootMargin: '-15% 0px -70% 0px' });
      articleContent.querySelectorAll('h2[id], h3[id]').forEach(function (h) { spy.observe(h); });
    }
  }

  /* ---------- 阅读字号 ---------- */
  document.querySelectorAll('[data-reading-size]').forEach(function (button) {
    button.addEventListener('click', function () {
      var content = document.querySelector('.post-content');
      if (!content) return;
      var current = parseFloat(getComputedStyle(content).fontSize);
      var next = button.dataset.readingSize === 'up' ? Math.min(current + 1, 22) : Math.max(current - 1, 15);
      content.style.fontSize = next + 'px';
    });
  });

  /* ---------- 复制链接 ---------- */
  var copyButton = document.getElementById('copy-link');
  if (copyButton && navigator.clipboard) {
    copyButton.addEventListener('click', function () {
      navigator.clipboard.writeText(window.location.href).then(function () {
        copyButton.textContent = '已复制';
        setTimeout(function () { copyButton.textContent = '复制链接'; }, 1600);
      });
    });
  }

  /* ---------- 命令面板 ---------- */
  var palette = document.getElementById('command-palette');
  var input = document.getElementById('command-input');
  var results = document.getElementById('command-results');
  var posts = window.CZ_POSTS || [];

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[ch];
    });
  }
  function renderResults(query) {
    if (!results) return;
    var normalized = query.trim().toLowerCase();
    var matches = posts;
    if (normalized.length) {
      var keywords = normalized.split(/\s+/);
      matches = posts.filter(function (post) {
        var text = [post.title, post.excerpt, post.date, (post.tags || []).join(' '), (post.categories || []).join(' ')].join(' ').toLowerCase();
        return keywords.every(function (k) { return text.indexOf(k) !== -1; });
      });
    }
    matches = matches.slice(0, 8);
    if (!matches.length) {
      results.innerHTML = '<p class="command-empty">没有匹配文章。试试「AI」「认知」「思考图谱」。</p>';
      return;
    }
    results.innerHTML = matches.map(function (post) {
      var meta = [post.date].concat(post.categories || []).join(' · ');
      return '<a class="command-result" href="' + post.url + '">' +
        '<span class="command-result-title">' + escapeHtml(post.title) + '</span>' +
        '<span class="command-result-meta">' + escapeHtml(meta) + '</span>' +
        '<span class="command-result-excerpt">' + escapeHtml(post.excerpt) + '</span></a>';
    }).join('');
  }
  function openPalette(seed) {
    if (!palette || !input) return;
    palette.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    if (lenis) lenis.stop();
    input.value = seed || '';
    renderResults(input.value);
    setTimeout(function () { input.focus(); }, 40);
  }
  function closePalette() {
    if (!palette) return;
    palette.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    if (lenis) lenis.start();
  }
  document.querySelectorAll('.search-open').forEach(function (b) {
    b.addEventListener('click', function () { openPalette(''); });
  });
  document.querySelectorAll('[data-command-close]').forEach(function (el) {
    el.addEventListener('click', closePalette);
  });
  if (input) input.addEventListener('input', function () { renderResults(input.value); });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault(); openPalette('');
    }
    if (e.key === 'Escape') closePalette();
  });
})();
