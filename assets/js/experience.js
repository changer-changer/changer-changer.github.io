(function () {
  'use strict';

  var root = document.documentElement;
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var motionStored = localStorage.getItem('cz-motion');
  var reduced = reduceQuery.matches || motionStored === 'reduced';
  if (reduced) root.classList.add('motion-reduced');
  var visualAudit = new URLSearchParams(window.location.search).has('visual-audit');
  if (visualAudit) root.classList.add('visual-audit');

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
      var t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var loaderStarted = false;
  if (visualAudit) {
    var auditLoader = document.querySelector('.site-loader');
    if (auditLoader) auditLoader.classList.add('is-done');
    loaderStarted = true;
  }
  function finishLoader() {
    var loader = document.querySelector('.site-loader');
    if (!loader || loaderStarted) return;
    loaderStarted = true;
    var count = loader.querySelector('.loader-counter span');
    var bar = loader.querySelector('.loader-line span');
    var start = performance.now();
    var duration = reduced ? 80 : 900;

    function tick(now) {
      var progress = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - progress, 3);
      if (count) count.textContent = String(Math.round(eased * 100)).padStart(2, '0');
      if (bar) bar.style.width = (eased * 100) + '%';
      if (progress < 1) requestAnimationFrame(tick);
      else setTimeout(function () { loader.classList.add('is-done'); }, reduced ? 0 : 180);
    }
    requestAnimationFrame(tick);
  }

  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(function (resolve) { setTimeout(resolve, 1200); })]).then(finishLoader);
  } else {
    window.addEventListener('load', finishLoader, { once: true });
  }
  setTimeout(finishLoader, 1800);

  function splitText() {
    document.querySelectorAll('[data-split]').forEach(function (element) {
      if (element.dataset.splitReady) return;
      var text = element.textContent;
      element.dataset.splitReady = 'true';
      element.setAttribute('aria-label', text.trim());
      element.textContent = '';
      Array.from(text).forEach(function (char) {
        var span = document.createElement('span');
        span.className = 'split-char';
        span.setAttribute('aria-hidden', 'true');
        span.innerHTML = char === ' ' ? '&nbsp;' : char;
        element.appendChild(span);
      });
    });
  }
  splitText();

  var motionToggle = document.querySelector('.motion-toggle');
  function syncMotionToggle() {
    if (!motionToggle) return;
    motionToggle.classList.toggle('is-off', reduced);
    motionToggle.setAttribute('aria-label', reduced ? '开启动态效果' : '关闭动态效果');
  }
  syncMotionToggle();
  if (motionToggle) {
    motionToggle.addEventListener('click', function () {
      reduced = !reduced;
      localStorage.setItem('cz-motion', reduced ? 'reduced' : 'full');
      root.classList.toggle('motion-reduced', reduced);
      syncMotionToggle();
      window.location.reload();
    });
  }

  var lenis = null;
  if (!reduced && !visualAudit && window.Lenis && window.innerWidth > 760) {
    lenis = new window.Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: .88, anchors: true, stopInertiaOnNavigate: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  var cursor = document.querySelector('.cursor-orbit');
  if (cursor && window.matchMedia('(pointer:fine)').matches && !reduced && !visualAudit) {
    var cursorX = -100;
    var cursorY = -100;
    var targetX = -100;
    var targetY = -100;
    window.addEventListener('pointermove', function (event) {
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.classList.add('is-visible');
    }, { passive: true });
    document.addEventListener('pointerover', function (event) {
      var target = event.target.closest('[data-cursor], a, button');
      if (!target) return;
      cursor.classList.add('is-active');
      var label = target.getAttribute('data-cursor') || '';
      cursor.querySelector('span').textContent = label;
    });
    document.addEventListener('pointerout', function (event) {
      if (!event.target.closest('[data-cursor], a, button')) return;
      cursor.classList.remove('is-active');
      cursor.querySelector('span').textContent = '';
    });
    (function moveCursor() {
      cursorX += (targetX - cursorX) * .18;
      cursorY += (targetY - cursorY) * .18;
      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
      requestAnimationFrame(moveCursor);
    })();
  }

  var transition = document.querySelector('.page-transition');
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href]');
    if (!link || !transition || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || link.target === '_blank' || link.hasAttribute('download') || url.hash && url.pathname === window.location.pathname) return;
    event.preventDefault();
    transition.classList.add('is-entering');
    setTimeout(function () { window.location.href = url.href; }, reduced ? 0 : 410);
  });

  function cssColor(name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }

  function renderFingerprints() {
    document.querySelectorAll('.fingerprint-canvas').forEach(function (canvas) {
      var box = canvas.getBoundingClientRect();
      if (!box.width || !box.height) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(box.width * dpr);
      canvas.height = Math.round(box.height * dpr);
      var ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      var random = seededRandom(hashString(canvas.dataset.artTitle || 'changer'));
      var ink = cssColor('--x-ink');
      var accent = cssColor('--x-accent');
      var background = cssColor('--x-bg');
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, box.width, box.height);

      var cx = box.width * (.35 + random() * .3);
      var cy = box.height * (.3 + random() * .4);
      var max = Math.max(box.width, box.height);
      ctx.lineCap = 'round';
      for (var ring = 0; ring < 42; ring += 1) {
        var radius = max * (.025 + ring * .014);
        var segments = 80;
        ctx.beginPath();
        for (var s = 0; s <= segments; s += 1) {
          var angle = (s / segments) * Math.PI * 2;
          var distortion = Math.sin(angle * (3 + Math.floor(random() * 4)) + ring * .33) * (4 + ring * .22);
          var x = cx + Math.cos(angle) * (radius + distortion);
          var y = cy + Math.sin(angle) * (radius * .72 + distortion);
          if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = ring % 9 === 0 ? accent : ink;
        ctx.globalAlpha = ring % 9 === 0 ? .85 : .2 + random() * .28;
        ctx.lineWidth = ring % 9 === 0 ? 1.5 : .65;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = accent;
      for (var dot = 0; dot < 12; dot += 1) {
        ctx.beginPath();
        ctx.arc(random() * box.width, random() * box.height, random() * 2.4 + .8, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
  renderFingerprints();
  new MutationObserver(renderFingerprints).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  var resizeTimer;
  window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(renderFingerprints, 160); });

  var fieldHost = document.getElementById('latent-field');
  if (fieldHost && window.p5) {
    new window.p5(function (p) {
      var particles = [];
      var pointer = { x: .5, y: .5 };
      var seed = hashString(window.location.pathname + 'latent-cartography');
      var palette = {};

      function refreshPalette() {
        palette.ink = p.color(cssColor('--x-ink'));
        palette.accent = p.color(cssColor('--x-accent'));
        palette.blue = p.color(cssColor('--x-blue'));
      }

      function makeParticle(index) {
        var angle = index * 2.399963229728653;
        var radial = Math.sqrt((index + 1) / 92);
        return {
          x: p.width * (.5 + Math.cos(angle) * radial * .42),
          y: p.height * (.48 + Math.sin(angle) * radial * .34),
          px: 0,
          py: 0,
          vx: 0,
          vy: 0,
          phase: p.random(p.TWO_PI),
          weight: p.random(.45, 1.35)
        };
      }

      function reset() {
        p.randomSeed(seed);
        p.noiseSeed(seed);
        particles = [];
        var count = p.width < 700 ? 54 : 92;
        for (var i = 0; i < count; i += 1) particles.push(makeParticle(i));
        refreshPalette();
      }

      p.setup = function () {
        var canvas = p.createCanvas(fieldHost.clientWidth, fieldHost.clientHeight);
        canvas.parent(fieldHost);
        p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
        p.frameRate(60);
        reset();
        if (reduced) { p.redraw(); p.noLoop(); }
      };

      p.windowResized = function () {
        p.resizeCanvas(fieldHost.clientWidth, fieldHost.clientHeight);
        reset();
      };

      p.mouseMoved = function () {
        pointer.x = p.constrain(p.mouseX / Math.max(1, p.width), 0, 1);
        pointer.y = p.constrain(p.mouseY / Math.max(1, p.height), 0, 1);
      };

      p.draw = function () {
        p.clear();
        var time = reduced ? 4.2 : p.frameCount * .0045;
        var scrollPhase = window.scrollY * .00045;
        p.noFill();

        p.push();
        p.translate(p.width * .5, p.height * .47);
        for (var ring = 0; ring < 5; ring += 1) {
          p.stroke(ring === 2 ? palette.accent : palette.ink);
          p.strokeWeight(ring === 2 ? 1.2 : .55);
          p.drawingContext.globalAlpha = ring === 2 ? .48 : .17;
          p.beginShape();
          var points = 160;
          for (var r = 0; r <= points; r += 1) {
            var a = (r / points) * p.TWO_PI;
            var wave = p.sin(a * (3 + ring) + time * (ring % 2 ? -1 : 1)) * (8 + ring * 2);
            var radius = Math.min(p.width, p.height) * (.12 + ring * .075) + wave;
            p.vertex(p.cos(a) * radius, p.sin(a) * radius * .66);
          }
          p.endShape();
        }
        p.pop();

        particles.forEach(function (particle, index) {
          particle.px = particle.x;
          particle.py = particle.y;
          var n = p.noise(particle.x * .0017, particle.y * .0017, time + scrollPhase);
          var angle = n * p.TWO_PI * 2.4 + p.sin(particle.phase + time) * .35;
          var pointerX = pointer.x * p.width;
          var pointerY = pointer.y * p.height;
          var dx = pointerX - particle.x;
          var dy = pointerY - particle.y;
          var distSq = dx * dx + dy * dy;
          var force = Math.min(0.055, 650 / Math.max(8000, distSq));
          particle.vx = particle.vx * .93 + p.cos(angle) * .06 + dx * force * .004;
          particle.vy = particle.vy * .93 + p.sin(angle) * .06 + dy * force * .004;
          particle.x += particle.vx * particle.weight;
          particle.y += particle.vy * particle.weight;
          if (particle.x < -20 || particle.x > p.width + 20 || particle.y < -20 || particle.y > p.height + 20) {
            Object.assign(particle, makeParticle(index));
          }
          var color = index % 13 === 0 ? palette.accent : index % 19 === 0 ? palette.blue : palette.ink;
          p.stroke(color);
          p.strokeWeight(index % 13 === 0 ? 1.6 : .65);
          p.drawingContext.globalAlpha = index % 13 === 0 ? .75 : .3;
          p.line(particle.px, particle.py, particle.x, particle.y);
          if (index % 11 === 0) {
            p.noStroke();
            p.fill(color);
            p.drawingContext.globalAlpha = .8;
            p.circle(particle.x, particle.y, index % 13 === 0 ? 5 : 2.4);
          }
        });
        p.drawingContext.globalAlpha = 1;
      };

      new MutationObserver(refreshPalette).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    }, fieldHost);
  }

  if (window.gsap && !reduced && !visualAudit) {
    var gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
    gsap.from('.experience-title .split-char', { yPercent: 115, rotate: 4, opacity: 0, duration: 1.05, stagger: .025, ease: 'expo.out', delay: .75 });
    gsap.from('.experience-kicker, .experience-intro, .hero-coordinate, .scroll-cue', { opacity: 0, y: 16, duration: .7, stagger: .08, ease: 'power2.out', delay: 1.05 });

    if (window.ScrollTrigger) {
      gsap.to('.manifesto-track', { xPercent: -32, ease: 'none', scrollTrigger: { trigger: '.manifesto-stage', start: 'top bottom', end: 'bottom top', scrub: .7 } });
      gsap.to('.latent-field', { scale: 1.13, opacity: .55, ease: 'none', scrollTrigger: { trigger: '.experience-hero', start: 'top top', end: 'bottom top', scrub: .7 } });
      document.querySelectorAll('.scene-header, .story-card, .spark-scene blockquote, .constellation-list a, .transmission-item').forEach(function (element) {
        gsap.from(element, { opacity: 0, y: 26, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 90%', once: true } });
      });
      gsap.to('.theory-field', { rotate: 22, scale: 1.12, ease: 'none', scrollTrigger: { trigger: '.theory-gateway', start: 'top bottom', end: 'bottom top', scrub: 1 } });
      document.querySelectorAll('.page-hero [data-split] .split-char, .page-shell [data-split] .split-char').forEach(function (element, index) {
        gsap.from(element, { yPercent: 110, opacity: 0, duration: .75, delay: index * .025, ease: 'expo.out' });
      });
    }
  }

  var articleContent = document.querySelector('.post-content');
  var tocLinks = Array.from(document.querySelectorAll('.article-toc a'));
  if (articleContent && tocLinks.length && 'IntersectionObserver' in window) {
    var activeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        tocLinks.forEach(function (link) { link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id); });
      });
    }, { rootMargin: '-20% 0px -65% 0px' });
    articleContent.querySelectorAll('h2[id],h3[id]').forEach(function (heading) { activeObserver.observe(heading); });
  }

  document.querySelectorAll('[data-reading-size]').forEach(function (button) {
    button.addEventListener('click', function () {
      var content = document.querySelector('.post-content');
      if (!content) return;
      var current = parseFloat(getComputedStyle(content).fontSize);
      var next = button.dataset.readingSize === 'up' ? Math.min(current + 1, 22) : Math.max(current - 1, 15);
      content.style.fontSize = next + 'px';
    });
  });
})();
