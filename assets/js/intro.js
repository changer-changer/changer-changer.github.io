/* ============================================================
   CHANGER—CHANGER · 入场四幕
   01 像素星月 → 02 霓虹机械臂 → 03 结构光域 → 04 落地纸世界
   （three.js 动态加载：看过的访客零成本）
   ============================================================ */

(function () {
  'use strict';

  var intro = document.getElementById('intro');
  if (!intro) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = false;
  try { seen = sessionStorage.getItem('cz-intro-seen') === '1'; } catch (e) {}
  var force = new URLSearchParams(window.location.search).has('intro');

  function teardown(fast) {
    intro.classList.add('is-gone');
    document.body.classList.remove('no-scroll');
    document.dispatchEvent(new CustomEvent('cz:intro:done'));
    setTimeout(function () { intro.remove(); }, fast ? 60 : 900);
  }

  if ((seen && !force) || reduced) { teardown(true); return; }

  try { sessionStorage.setItem('cz-intro-seen', '1'); } catch (e) {}
  document.body.classList.add('no-scroll');

  var canvas2d = document.getElementById('intro-2d');
  var ctx2d = canvas2d.getContext('2d');
  var glWrap = document.getElementById('intro-gl');
  var sceneNo = document.getElementById('intro-scene-no');
  var sceneName = document.getElementById('intro-scene-name');
  var bar = document.getElementById('intro-bar');
  var W = 0, H = 0;

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas2d.width = W; canvas2d.height = H;
  }
  resize();
  window.addEventListener('resize', resize);

  /* 场景时间表（秒） */
  var MOBILE = W < 700;
  var T1 = MOBILE ? 3.0 : 3.6;   /* 像素星月 */
  var T2 = MOBILE ? 3.4 : 4.2;   /* 霓虹机械臂 */
  var T3 = MOBILE ? 2.2 : 2.6;   /* 结构光域 */
  var TOTAL = T1 + T2 + T3;

  var SCENES = [
    { no: 'SCENE 01', name: 'PIXEL COSMOS' },
    { no: 'SCENE 02', name: 'NEON ACTUATOR' },
    { no: 'SCENE 03', name: 'STRUCTURED LIGHT' },
    { no: 'SCENE 04', name: 'LANDING' }
  ];

  /* ============================================================
     SCENE 01 — 像素星月（384×216 缓冲，硬边上采样）
     ============================================================ */
  var PW = 384, PH = 216;
  var buf = document.createElement('canvas');
  buf.width = PW; buf.height = PH;
  var bx = buf.getContext('2d');

  function rnd(seed) {
    var s = seed >>> 0;
    return function () {
      s += 0x6D2B79F5;
      var t = Math.imul(s ^ (s >>> 15), s | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

  var R1 = rnd(20260802);
  var stars = [];
  for (var i = 0; i < 150; i += 1) {
    stars.push({
      x: R1() * PW, y: R1() * PH, z: .35 + R1() * .65,
      tw: R1() * Math.PI * 2, pull: R1() < .55,
      ox: 0, oy: 0
    });
  }
  var shooters = [];
  var nextShoot = 40;
  var moon = { x: 250, y: 66, r: 34 };
  var groundH = [];
  for (var gx = 0; gx <= PW; gx += 4) groundH.push(Math.sin(gx * .07) * 2.5 + Math.sin(gx * .023 + 2) * 4);

  var arm = { bx: 168, by: 172 };

  function px(x, y, c, a) {
    bx.globalAlpha = a == null ? 1 : a;
    bx.fillStyle = c;
    bx.fillRect(x | 0, y | 0, 1, 1);
  }
  function thickLine(x0, y0, x1, y1, c, w) {
    var dx = x1 - x0, dy = y1 - y0;
    var steps = Math.max(Math.abs(dx), Math.abs(dy)) * 1.5;
    for (var s = 0; s <= steps; s += 1) {
      var x = x0 + dx * s / steps, y = y0 + dy * s / steps;
      for (var wx = 0; wx < w; wx += 1) for (var wy = 0; wy < w; wy += 1) px(x + wx - w / 2, y + wy - w / 2, c, 1);
    }
  }

  function drawPixelScene(t) {
    bx.globalAlpha = 1;
    bx.fillStyle = '#000';
    bx.fillRect(0, 0, PW, PH);

    var pMoon = Math.min(1, Math.max(0, (t - 1.0) / 1.1));       /* 月成形 */
    var pDesc = Math.min(1, Math.max(0, (t - 2.15) / .85));      /* 镜头下降 */
    var pArm = Math.min(1, Math.max(0, (t - 2.55) / .6));        /* 机械臂 */
    var eMoon = 1 - Math.pow(1 - pMoon, 3);
    var eDesc = pDesc * pDesc * (3 - 2 * pDesc);

    /* 星 */
    for (var i = 0; i < stars.length; i += 1) {
      var st = stars[i];
      st.x -= st.z * .05;
      if (st.x < 0) st.x += PW;
      var sx = st.x, sy = st.y, alpha = .35 + .65 * Math.abs(Math.sin(t * 2.2 + st.tw));
      if (st.pull && pMoon > 0) {
        var k = eMoon * .92;
        sx += (moon.x - sx) * k;
        sy += (moon.y - sy) * k;
        alpha *= 1 - eMoon * .8;
      }
      if (pDesc > 0) { /* 下降时星星淡出 */
        alpha *= 1 - eDesc;
      }
      if (alpha <= .02) continue;
      var c = st.z > .82 ? '#fff' : '#9a9a9a';
      px(sx, sy, c, alpha);
      if (st.z > .9) { px(sx + 1, sy, c, alpha * .8); px(sx, sy + 1, c, alpha * .8); }
    }

    /* 流星 */
    if (--nextShoot <= 0) {
      nextShoot = 70 + Math.floor(R1() * 80);
      shooters.push({ x: R1() * PW, y: R1() * 70, vx: 2.2 + R1() * 1.6, vy: .9, life: 26 });
    }
    shooters = shooters.filter(function (sh) {
      sh.x += sh.vx; sh.y += sh.vy; sh.life -= 1;
      for (var t2 = 0; t2 < 6; t2 += 1) px(sh.x - sh.vx * t2 * 1.6, sh.y - sh.vy * t2 * 1.6, '#fff', (1 - t2 / 6) * (sh.life / 26) * (1 - eDesc));
      return sh.life > 0;
    });

    /* 像素月（抖动月牙） */
    if (pMoon > 0) {
      var r = moon.r;
      for (var my = -r; my <= r; my += 1) {
        for (var mx = -r; mx <= r; mx += 1) {
          var d = Math.sqrt(mx * mx + my * my);
          if (d > r) continue;
          var cd = Math.sqrt((mx + 13) * (mx + 13) + (my + 7) * (my + 7));
          if (cd < r * .94) continue;                      /* 挖掉暗面成月牙 */
          var shade = .55 + .45 * (my / r) + (R1() - .5) * .25;
          var th = BAYER[(mx & 3 + 4) & 3][(my & 3 + 4) & 3] / 16;
          if (shade > th) px(moon.x + mx, moon.y + my, shade > .88 ? '#fff' : '#cfcfcf', eMoon);
        }
      }
      /* 月晕像素环 */
      for (var ha = 0; ha < 64; ha += 1) {
        var hx = moon.x + Math.cos(ha / 64 * Math.PI * 2) * (r + 3);
        var hy = moon.y + Math.sin(ha / 64 * Math.PI * 2) * (r + 3);
        px(hx, hy, '#666', eMoon * .6);
      }
    }

    /* 月面 + 机械臂 */
    if (pDesc > 0) {
      var gy0 = 156;
      for (var x = 0; x < PW; x += 1) {
        var gh = groundH[(x / 4) | 0] || 0;
        for (var y = gy0 + gh; y < PH; y += 1) {
          var gth = BAYER[x & 3][y & 3] / 16;
          var gsh = .22 + .5 * ((y - gy0 - gh) / (PH - gy0)) ;
          if (gsh > gth) px(x, y, y < gy0 + gh + 2 ? '#e8e8e8' : '#7d7d7d', eDesc);
        }
      }
      /* 环形山 */
      for (var cr = 0; cr < 3; cr += 1) {
        var crx = 60 + cr * 110, cry = gy0 + 14 + cr * 6;
        for (var ca = 0; ca < 20; ca += 1) {
          px(crx + Math.cos(ca / 20 * Math.PI) * 10, cry + Math.sin(ca / 20 * Math.PI) * 3, '#b9b9b9', eDesc * .8);
        }
      }
    }

    if (pArm > 0) {
      var at = t * 2.0;
      var a1 = -1.15 + Math.sin(at) * .38;
      var a2 = 1.35 + Math.sin(at * 1.0 + 1.4) * .55;
      var g = (Math.sin(at * 2.0) + 1) / 2;             /* 钳口开合 */
      var L1 = 26, L2 = 22;
      var jx = arm.bx + Math.cos(a1) * L1, jy = arm.by + Math.sin(a1) * L1;
      var a3 = a1 + a2 - Math.PI;
      var tx = jx + Math.cos(a3) * L2, ty = jy + Math.sin(a3) * L2;

      /* 基座 */
      bx.globalAlpha = pArm;
      bx.fillStyle = '#dcdcdc';
      bx.fillRect(arm.bx - 8, arm.by + 2, 16, 3);
      bx.fillRect(arm.bx - 3, arm.by - 3, 6, 6);
      thickLine(arm.bx, arm.by - 2, jx, jy, '#fff', 2);
      thickLine(jx, jy, tx, ty, '#e6e6e6', 2);
      /* 关节 */
      bx.fillStyle = '#fff';
      bx.fillRect(jx - 1, jy - 1, 3, 3);
      bx.fillRect(arm.bx - 1, arm.by - 3, 3, 3);
      /* 钳口 */
      thickLine(tx, ty, tx + Math.cos(a3 + .5 + g * .4) * 6, ty + Math.sin(a3 + .5 + g * .4) * 6, '#fff', 1);
      thickLine(tx, ty, tx + Math.cos(a3 - .5 - g * .4) * 6, ty + Math.sin(a3 - .5 - g * .4) * 6, '#fff', 1);
      /* 焊接火花（钳口接近月面时） */
      if (ty > 158 && (R1() < .5)) {
        for (var sp = 0; sp < 7; sp += 1) {
          px(tx + (R1() - .5) * 12, ty + (R1() - .3) * 9, '#fff', .4 + R1() * .6);
        }
      }
      /* 信标闪烁 */
      if (Math.floor(t * 3) % 2 === 0) px(arm.bx + 6, arm.by - 6, '#fff', 1);
      bx.globalAlpha = 1;
    }

    /* 镜头：下降到月面 */
    var zoom = 1 + eDesc * .7;
    ctx2d.imageSmoothingEnabled = false;
    ctx2d.clearRect(0, 0, W, H);
    ctx2d.fillStyle = '#000';
    ctx2d.fillRect(0, 0, W, H);
    var scale = Math.max(W / PW, H / PH) * zoom;
    var drawY = -eDesc * (130 * scale - H / 2);
    var drawX = (W - PW * scale) / 2;
    ctx2d.drawImage(buf, drawX, drawY, PW * scale, PH * scale);
  }

  /* ============================================================
     SCENE 02 — 霓虹机械臂（Three.js + UnrealBloom，动态加载）
     ============================================================ */
  var gl = null;
  var glReady = false;
  var glLoadPromise = null;

  function loadGLModules() {
    if (glLoadPromise) return glLoadPromise;
    glLoadPromise = Promise.all([
      import('three'),
      import('three/addons/postprocessing/EffectComposer.js'),
      import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js')
    ]).then(function (mods) {
      buildGL(mods[0], mods[1].EffectComposer, mods[2].RenderPass, mods[3].UnrealBloomPass);
      glReady = true;
    }).catch(function () { gl = null; glReady = false; });
    return glLoadPromise;
  }

  function buildGL(THREE, EffectComposer, RenderPass, UnrealBloomPass) {
    try {
      var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(W, H);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      glWrap.appendChild(renderer.domElement);

      var scene = new THREE.Scene();
      scene.background = new THREE.Color(0x04050e);
      scene.fog = new THREE.FogExp2(0x04050e, .02);

      var camera = new THREE.PerspectiveCamera(50, W / H, .1, 200);

      /* 地面 */
      var floor = new THREE.Mesh(
        new THREE.PlaneGeometry(240, 240),
        new THREE.MeshStandardMaterial({ color: 0x05060f, roughness: .9, metalness: .1 })
      );
      floor.rotation.x = -Math.PI / 2; floor.position.y = -.03;
      scene.add(floor);
      var grid1 = new THREE.GridHelper(160, 160, 0x35e0ff, 0x10245c);
      grid1.material.transparent = true; grid1.material.opacity = .58;
      scene.add(grid1);
      var grid2 = new THREE.GridHelper(160, 20, 0x8a5cff, 0x241554);
      grid2.position.y = .01;
      grid2.material.transparent = true; grid2.material.opacity = .7;
      scene.add(grid2);

      /* 机械臂 */
      var metal = new THREE.MeshStandardMaterial({ color: 0x12152e, metalness: .92, roughness: .28 });
      var NEON_C = 0x35e0ff, NEON_P = 0x8a5cff, NEON_B = 0x2e6bff;
      function part(geo, mat, edgeColor) {
        var m = new THREE.Mesh(geo, mat);
        var e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 24), new THREE.LineBasicMaterial({ color: edgeColor }));
        m.add(e);
        return m;
      }
      function glowSphere(r, color, intensity) {
        return new THREE.Mesh(
          new THREE.SphereGeometry(r, 24, 18),
          new THREE.MeshStandardMaterial({ color: 0x0a0c18, emissive: color, emissiveIntensity: intensity, roughness: .4 })
        );
      }

      var rootG = new THREE.Group();
      var base = part(new THREE.CylinderGeometry(1.05, 1.3, .42, 36), metal, NEON_B);
      base.position.y = .21; rootG.add(base);
      var pedestal = part(new THREE.CylinderGeometry(.5, .72, .62, 24), metal, NEON_C);
      pedestal.position.y = .72; rootG.add(pedestal);

      var turret = new THREE.Group(); turret.position.y = 1.14; rootG.add(turret);
      turret.add(glowSphere(.46, NEON_P, 1.6));
      var upper = new THREE.Group(); turret.add(upper);
      var upperArm = part(new THREE.BoxGeometry(.52, 2.5, .52), metal, NEON_C);
      upperArm.position.y = 1.25; upper.add(upperArm);
      var elbow = new THREE.Group(); elbow.position.y = 2.5; upper.add(elbow);
      elbow.add(glowSphere(.36, NEON_C, 1.8));
      var fore = new THREE.Group(); elbow.add(fore);
      var foreArm = part(new THREE.BoxGeometry(.4, 2.1, .4), metal, NEON_P);
      foreArm.position.y = 1.05; fore.add(foreArm);
      var wrist = new THREE.Group(); wrist.position.y = 2.1; fore.add(wrist);
      wrist.add(glowSphere(.24, NEON_B, 2.0));
      var gripL = part(new THREE.BoxGeometry(.09, .56, .2), metal, NEON_C);
      var gripR = gripL.clone();
      gripL.position.set(.2, .42, 0); gripR.position.set(-.2, .42, 0);
      wrist.add(gripL); wrist.add(gripR);
      scene.add(rootG);

      /* 灯光 */
      scene.add(new THREE.AmbientLight(0x1a2040, 1.4));
      var pC = new THREE.PointLight(NEON_C, 90, 40); pC.position.set(-7, 5, 5); scene.add(pC);
      var pP = new THREE.PointLight(NEON_P, 110, 44); pP.position.set(7, 6, -4); scene.add(pP);
      var pB = new THREE.PointLight(NEON_B, 50, 30); pB.position.set(0, 2, 8); scene.add(pB);

      var composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      var bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 1.25, .62, .12);
      composer.addPass(bloom);

      gl = { renderer: renderer, scene: scene, camera: camera, composer: composer,
             turret: turret, upper: upper, fore: fore, wrist: wrist, gripL: gripL, gripR: gripR };
      window.addEventListener('resize', function () {
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      });
    } catch (err) {
      gl = null;
    }
  }
  loadGLModules();

  function renderGL(t) {
    if (!gl) return;
    gl.turret.rotation.y = Math.sin(t * .32) * .55;
    gl.upper.rotation.z = -0.42 + Math.sin(t * 1.05) * .5;
    gl.fore.rotation.z = 1.05 + Math.sin(t * 1.05 + 1.35) * .6;
    gl.wrist.rotation.z = Math.sin(t * 2.1) * .45;
    var open = (Math.sin(t * 2.1) + 1) / 2;
    gl.gripL.position.x = .12 + open * .14;
    gl.gripR.position.x = -.12 - open * .14;
    var ang = t * .2 + 2.2;
    gl.camera.position.set(Math.cos(ang) * 8.8, 3.1 + Math.sin(t * .45) * .7, Math.sin(ang) * 8.8);
    gl.camera.lookAt(0, 2.3, 0);
    gl.composer.render();
  }

  /* ============================================================
     SCENE 03 — 结构光点 → 霓虹光域
     ============================================================ */
  var R3 = rnd(77031);
  var lights3 = [];
  var PALETTE = ['#8a5cff', '#35e0ff', '#2e6bff', '#b46bff', '#5cd6ff'];
  (function buildParticles() {
    /* 沿一条机械臂轮廓撒点 */
    var bx3 = .5, by3 = .82;
    var a1 = -.9, a2 = 1.2, L1 = .22, L2 = .19;
    function armPoint(u) {
      if (u < .5) {
        var k = u / .5;
        return [bx3 + Math.cos(a1) * L1 * k * W / H, by3 + Math.sin(a1) * L1 * k];
      }
      var jx = bx3 + Math.cos(a1) * L1 * W / H, jy = by3 + Math.sin(a1) * L1;
      var k2 = (u - .5) / .5, a3 = a1 + a2 - Math.PI;
      return [jx + Math.cos(a3) * L2 * k2 * W / H, jy + Math.sin(a3) * L2 * k2];
    }
    for (var i = 0; i < 900; i += 1) {
      var u = R3();
      var p = armPoint(u);
      lights3.push({
        x: p[0] * W + (R3() - .5) * 9, y: p[1] * H + (R3() - .5) * 9,
        vx: 0, vy: 0, c: PALETTE[(R3() * PALETTE.length) | 0],
        tw: R3() * Math.PI * 2, arm: true
      });
    }
    for (var d = 0; d < 500; d += 1) {
      lights3.push({
        x: R3() * W, y: R3() * H, vx: 0, vy: 0,
        c: PALETTE[(R3() * PALETTE.length) | 0],
        tw: R3() * Math.PI * 2, arm: false
      });
    }
  })();

  function drawScene3(t) {
    var pA = Math.min(1, t / .7);                 /* 光点成形 */
    var pB = Math.max(0, (t - .7) / (T3 - .7));   /* 流散 */
    ctx2d.globalCompositeOperation = 'source-over';
    if (pB <= 0) {
      ctx2d.fillStyle = '#04050e';
      ctx2d.fillRect(0, 0, W, H);
    } else {
      ctx2d.fillStyle = 'rgba(4,5,14,0.07)';   /* 拖尾 */
      ctx2d.fillRect(0, 0, W, H);
    }
    /* 玻璃光晕背景 */
    if (pB > 0) {
      ctx2d.globalCompositeOperation = 'lighter';
      var g1 = ctx2d.createRadialGradient(W * .22, H * .2, 0, W * .22, H * .2, W * .5);
      g1.addColorStop(0, 'rgba(138,92,255,' + .17 * pB + ')');
      g1.addColorStop(1, 'rgba(138,92,255,0)');
      ctx2d.fillStyle = g1; ctx2d.fillRect(0, 0, W, H);
      var g2 = ctx2d.createRadialGradient(W * .8, H * .85, 0, W * .8, H * .85, W * .55);
      g2.addColorStop(0, 'rgba(53,224,255,' + .15 * pB + ')');
      g2.addColorStop(1, 'rgba(53,224,255,0)');
      ctx2d.fillStyle = g2; ctx2d.fillRect(0, 0, W, H);
    }

    for (var i = 0; i < lights3.length; i += 1) {
      var p = lights3[i];
      if (pB > 0) {
        var n = Math.sin(p.x * .004 + t * 2.1) * Math.cos(p.y * .004 - t * 1.4) + Math.sin((p.x + p.y) * .002 + t);
        var ang = n * Math.PI * 1.6;
        p.vx = p.vx * .9 + Math.cos(ang) * .85;
        p.vy = p.vy * .9 + Math.sin(ang) * .85 - .16;
        p.x += p.vx; p.y += p.vy;
        ctx2d.globalCompositeOperation = 'lighter';
        ctx2d.globalAlpha = Math.min(1, pB * 1.6) * .95;
        ctx2d.strokeStyle = p.c;
        ctx2d.lineWidth = 1.5;
        ctx2d.beginPath();
        ctx2d.moveTo(p.x - p.vx * 2.4, p.y - p.vy * 2.4);
        ctx2d.lineTo(p.x, p.y);
        ctx2d.stroke();
      } else {
        ctx2d.globalCompositeOperation = 'source-over';
        ctx2d.globalAlpha = pA * (p.arm ? .95 : .35) * (.5 + .5 * Math.sin(t * 5 + p.tw));
        ctx2d.fillStyle = p.arm ? '#fff' : p.c;
        ctx2d.fillRect(p.x, p.y, p.arm ? 2.6 : 1.6, p.arm ? 2.6 : 1.6);
      }
    }
    ctx2d.globalAlpha = 1;
    ctx2d.globalCompositeOperation = 'source-over';
  }

  /* ============================================================
     主时钟与调度
     ============================================================ */
  var skipped = false;
  function skip() {
    if (skipped) return;
    skipped = true;
    land();
  }
  document.getElementById('intro-skip').addEventListener('click', skip);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') skip(); });

  var landed = false;
  function land() {
    if (landed) return;
    landed = true;
    setScene(3);
    bar.style.width = '100%';
    intro.classList.add('is-leaving');
    setTimeout(function () {
      document.body.classList.remove('no-scroll');
      document.dispatchEvent(new CustomEvent('cz:intro:done'));
    }, 500);
    setTimeout(function () { intro.remove(); }, 1500);
  }

  var curScene = -1;
  function setScene(i) {
    if (i === curScene) return;
    curScene = i;
    sceneNo.textContent = SCENES[i].no;
    sceneName.textContent = SCENES[i].name;
    intro.dataset.scene = String(i + 1);
  }

  canvas2d.style.opacity = '1';
  glWrap.style.opacity = '0';

  var t0 = performance.now() + 900;
  function frame(now) {
    if (landed) return;
    var t = Math.max(0, (now - t0) / 1000);
    bar.style.width = Math.min(100, t / TOTAL * 100) + '%';

    if (t < T1) {
      setScene(0);
      drawPixelScene(t);
    } else if (t < T1 + T2) {
      setScene(1);
      var tIn = t - T1;
      if (tIn < .1) { ctx2d.clearRect(0, 0, W, H); }
      canvas2d.style.opacity = String(Math.max(0, 1 - tIn / .6));
      glWrap.style.opacity = String(Math.min(1, tIn / .6));
      if (gl) renderGL(tIn);
      else { /* WebGL 不可用则提前进入场景 3 */
        drawScene3(Math.min(T3, tIn / (T2 / T3)));
      }
      if (tIn > T2 - .5) glWrap.style.opacity = String(Math.max(0, (T2 - tIn) / .5));
    } else if (t < TOTAL) {
      setScene(2);
      canvas2d.style.opacity = '1';
      glWrap.style.opacity = '0';
      drawScene3(t - T1 - T2);
    } else {
      land();
      return;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
