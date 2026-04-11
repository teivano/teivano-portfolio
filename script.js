/* ═══════════════════════════════════════════════════════════
   CSS SHOWCASE · script.js — Liquid Glass v3
   1. Navigation (swipe / wheel / dots / clavier)
   2. Curseur custom (lerp)
   3. S1 Verre  — specular highlight + glitch au clic
   4. S2 Liquide — SVG physics liquid + gyro
   5. S3 Prisme  — rayons gyro/souris
   6. S4 Bulle   — specular + glitch
   7. S5 Onde    — ripples touch + Vibration API
   8. Gyroscope central
   9. Easter egg
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var isMobile = window.matchMedia('(pointer: coarse)').matches;


  /* ═══ DOM ════════════════════════════════════════════════ */
  var slides     = document.getElementById('slides');
  var dotBtns    = document.querySelectorAll('.dot');
  var scenes     = document.querySelectorAll('.scene');
  var TOTAL      = scenes.length;

  var glassCard  = document.getElementById('glassCard');
  var gcSpec     = document.getElementById('gcSpec');

  var liqPath    = document.getElementById('liqPath');
  var surfPath   = document.getElementById('surfPath');

  var prismBody  = document.getElementById('prismBody');
  var prRays     = document.querySelectorAll('.p-ray');

  var bubble     = document.getElementById('bubble');
  var bSpec      = document.getElementById('bSpec');

  var pond       = document.getElementById('pond');


  /* ═══════════════════════════════════════════════════════
     1. NAVIGATION
  ═══════════════════════════════════════════════════════ */
  var current = 0;
  var busy    = false;

  /* Sections dark (pour changer le style des dots) */
  var darkSections = [1, 2]; /* Liquide, Prisme */

  function goTo(idx, instant) {
    if (idx < 0 || idx >= TOTAL || (busy && !instant)) return;
    busy = true;

    scenes[current].classList.remove('active');
    dotBtns[current].classList.remove('active');

    current = idx;

    slides.style.transition = instant
      ? 'none'
      : 'transform var(--nav-dur) var(--ease)';
    slides.style.transform = 'translateY(' + (-current * window.innerHeight) + 'px)';

    scenes[current].classList.add('active');
    dotBtns[current].classList.add('active');

    /* Dots clairs/foncés selon fond section */
    var dotsNav = document.getElementById('dotsNav');
    if (darkSections.indexOf(current) !== -1) {
      dotsNav.classList.add('slide-dark');
    } else {
      dotsNav.classList.remove('slide-dark');
    }
    /* Curseur */
    if (darkSections.indexOf(current) !== -1) {
      document.body.classList.add('dark-cur');
    } else {
      document.body.classList.remove('dark-cur');
    }

    /* Callbacks section */
    onSectionEnter(current);

    setTimeout(function () { busy = false; }, instant ? 0 : 840);
  }

  window.addEventListener('resize', function () { goTo(current, true); });
  scenes[0].classList.add('active');

  dotBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      goTo(parseInt(btn.dataset.to, 10));
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goTo(current + 1); }
    if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); goTo(current - 1); }
  });

  var wheelLock = false;
  window.addEventListener('wheel', function (e) {
    if (wheelLock) return;
    wheelLock = true;
    goTo(e.deltaY > 0 ? current + 1 : current - 1);
    setTimeout(function () { wheelLock = false; }, 920);
  }, { passive: true });

  var ty0 = 0, tx0 = 0;
  document.addEventListener('touchstart', function (e) {
    ty0 = e.touches[0].clientY;
    tx0 = e.touches[0].clientX;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    var dy = ty0 - e.changedTouches[0].clientY;
    var dx = tx0 - e.changedTouches[0].clientX;
    if (Math.abs(dy) > 55 && Math.abs(dy) > Math.abs(dx) * 1.2) {
      goTo(dy > 0 ? current + 1 : current - 1);
    }
  }, { passive: true });


  /* ═══════════════════════════════════════════════════════
     2. CURSEUR CUSTOM (desktop)
  ═══════════════════════════════════════════════════════ */
  if (!isMobile) {
    var cursorEl = document.getElementById('cursor');
    var cdot     = cursorEl.querySelector('.cur-dot');
    var cring    = cursorEl.querySelector('.cur-ring');
    var mx = innerWidth/2, my = innerHeight/2, rx = mx, ry = my;

    document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });

    (function tickC() {
      rx += (mx - rx) * 0.11;
      ry += (my - ry) * 0.11;
      cdot.style.transform  = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      cring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px) translate(-50%,-50%)';
      requestAnimationFrame(tickC);
    }());

    var hov = document.querySelectorAll('.glass-card,.bubble,.pond,.prism-body');
    hov.forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add('hov'); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove('hov'); });
    });
  }


  /* ═══════════════════════════════════════════════════════
     3. S1 VERRE — specular highlight + glitch
  ═══════════════════════════════════════════════════════ */
  function setGlassSpec(nx, ny) {
    /* nx, ny : -1..1 normalisés */
    if (!gcSpec) return;
    var tx = nx * 28;
    var ty = ny * 20;
    gcSpec.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)';
  }

  if (!isMobile && glassCard) {
    glassCard.addEventListener('mousemove', function (e) {
      var r = glassCard.getBoundingClientRect();
      setGlassSpec(
        ((e.clientX - r.left) / r.width  - 0.5) * 2,
        ((e.clientY - r.top)  / r.height - 0.5) * 2
      );
    });
    glassCard.addEventListener('mouseleave', function () { setGlassSpec(0, 0); });
  }

  /* Glitch au clic */
  function triggerGlitch(el) {
    if (!el) return;
    el.classList.remove('glitch');
    void el.offsetWidth;
    el.classList.add('glitch');
    if (navigator.vibrate) navigator.vibrate([40, 10, 40]);
    el.addEventListener('animationend', function cb() {
      el.classList.remove('glitch');
      el.removeEventListener('animationend', cb);
    });
  }

  if (glassCard) {
    glassCard.addEventListener('click', function () { if (current === 0) triggerGlitch(glassCard); });
    glassCard.addEventListener('touchstart', function () {
      if (current === 0) triggerGlitch(glassCard);
    }, { passive: true });
  }


  /* ═══════════════════════════════════════════════════════
     4. S2 LIQUIDE — physique SVG
  ═══════════════════════════════════════════════════════ */
  var LIQ_W = 260, LIQ_H = 360;
  var liqX = 0, liqY = 0;         /* tilt normalisé -1..1 */
  var liqVX = 0, liqVY = 0;       /* vitesse */
  var liqTargetX = 0, liqTargetY = 0; /* cible (gyro/souris) */
  var waveT = 0;
  var liqRaf = null;

  function buildLiqPath(lx, ly, t) {
    /* lx -1..1 tilt horizontal, ly -1..1 vertical, t temps */
    var baseY = LIQ_H * 0.5 + ly * 35;
    var amp   = 4 + Math.abs(liqVX) * 80;
    amp = Math.min(amp, 20);

    var pts = [];
    for (var x = 0; x <= LIQ_W; x += 8) {
      var tilt = lx * (x - LIQ_W/2) / LIQ_W * 70;
      var wave = Math.sin(x / LIQ_W * Math.PI * 3.5 + t * 2.8) * amp * 0.55
               + Math.sin(x / LIQ_W * Math.PI * 6   + t * 2.1) * amp * 0.25;
      var y = baseY + tilt + wave;
      if (x === 0) pts.push('M0,' + y.toFixed(1));
      else         pts.push('L' + x + ',' + y.toFixed(1));
    }
    pts.push('L' + LIQ_W + ',' + LIQ_H + ' L0,' + LIQ_H + ' Z');
    return pts.join(' ');
  }

  function buildSurfPath(lx, ly, t) {
    /* Bande lumineuse à la surface (5-8px) */
    var baseY = LIQ_H * 0.5 + ly * 35;
    var amp   = 4 + Math.abs(liqVX) * 80;
    amp = Math.min(amp, 20);

    var top = [], bot = [];
    for (var x = 0; x <= LIQ_W; x += 8) {
      var tilt = lx * (x - LIQ_W/2) / LIQ_W * 70;
      var wave = Math.sin(x / LIQ_W * Math.PI * 3.5 + t * 2.8) * amp * 0.55
               + Math.sin(x / LIQ_W * Math.PI * 6   + t * 2.1) * amp * 0.25;
      var y = baseY + tilt + wave;
      if (x === 0) top.push('M0,' + y.toFixed(1));
      else         top.push('L' + x + ',' + y.toFixed(1));
      bot.unshift('L' + x + ',' + (y + 6).toFixed(1));
    }
    return top.join(' ') + ' ' + bot.join(' ') + ' Z';
  }

  function tickLiquid(ts) {
    waveT = ts / 1000;

    /* Spring vers cible */
    var ax = (liqTargetX - liqX) * 0.042;
    var ay = (liqTargetY - liqY) * 0.038;
    liqVX = (liqVX + ax) * 0.91;
    liqVY = (liqVY + ay) * 0.91;
    liqX  = Math.max(-1, Math.min(1, liqX + liqVX));
    liqY  = Math.max(-1, Math.min(1, liqY + liqVY));

    if (liqPath)  liqPath.setAttribute('d',  buildLiqPath(liqX, liqY, waveT));
    if (surfPath) surfPath.setAttribute('d', buildSurfPath(liqX, liqY, waveT));

    liqRaf = requestAnimationFrame(tickLiquid);
  }

  function startLiquid() { if (!liqRaf) liqRaf = requestAnimationFrame(tickLiquid); }
  function stopLiquid()  { if (liqRaf) { cancelAnimationFrame(liqRaf); liqRaf = null; } }

  /* Souris → liquide (desktop) */
  if (!isMobile) {
    document.addEventListener('mousemove', function (e) {
      if (current !== 1) return;
      liqTargetX = (e.clientX / innerWidth  - 0.5) * 2;
      liqTargetY = (e.clientY / innerHeight - 0.5) * 2;
    });
  }


  /* ═══════════════════════════════════════════════════════
     5. S3 PRISME — rayons réagissent souris/gyro
  ═══════════════════════════════════════════════════════ */
  var baseAngles = [-22, -6, 10];

  function setPrism(nx) {
    /* nx : -1..1 */
    prRays.forEach(function (r) { r.classList.add('live'); });
    if (prRays[0]) prRays[0].style.transform = 'rotate(' + (-22 + nx*14).toFixed(1) + 'deg) translateY(-8%)';
    if (prRays[1]) prRays[1].style.transform = 'rotate(' + ( -6 + nx*12).toFixed(1) + 'deg) translateY(-8%)';
    if (prRays[2]) prRays[2].style.transform = 'rotate(' + ( 10 + nx*10).toFixed(1) + 'deg) translateY(-8%)';
    if (prismBody) prismBody.style.transform  = 'rotate(' + (nx * 4).toFixed(1) + 'deg)';
  }

  if (!isMobile) {
    document.addEventListener('mousemove', function (e) {
      if (current !== 2) return;
      setPrism((e.clientX / innerWidth - 0.5) * 2);
    });
  }


  /* ═══════════════════════════════════════════════════════
     6. S4 BULLE — specular + glitch
  ═══════════════════════════════════════════════════════ */
  function setBubbleSpec(nx, ny) {
    if (!bSpec) return;
    var tx = nx * 35;
    var ty = ny * 28;
    bSpec.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)';
  }

  if (!isMobile && bubble) {
    bubble.addEventListener('mousemove', function (e) {
      var r = bubble.getBoundingClientRect();
      setBubbleSpec(
        ((e.clientX - r.left) / r.width  - 0.5) * 2,
        ((e.clientY - r.top)  / r.height - 0.5) * 2
      );
    });
    bubble.addEventListener('mouseleave', function () { setBubbleSpec(0, 0); });
  }

  if (bubble) {
    bubble.addEventListener('click', function () { if (current === 3) triggerGlitch(bubble); });
    bubble.addEventListener('touchstart', function () {
      if (current === 3) triggerGlitch(bubble);
    }, { passive: true });
  }


  /* ═══════════════════════════════════════════════════════
     7. S5 ONDE — ripples + Vibration API
  ═══════════════════════════════════════════════════════ */
  var pondTurb    = document.getElementById('pondTurb');
  var pondFreq    = 0.018;
  var pondFreqDir = 0.00012;
  var pondRaf     = null;

  function tickPond() {
    pondFreq += pondFreqDir;
    if (pondFreq > 0.028 || pondFreq < 0.009) pondFreqDir = -pondFreqDir;
    if (pondTurb) pondTurb.setAttribute('baseFrequency',
      pondFreq.toFixed(4) + ' ' + (pondFreq * 0.7).toFixed(4));
    pondRaf = requestAnimationFrame(tickPond);
  }
  function startPond() { if (!pondRaf) pondRaf = requestAnimationFrame(tickPond); }
  function stopPond()  { if (pondRaf) { cancelAnimationFrame(pondRaf); pondRaf = null; } }

  function addRipple(cx, cy) {
    if (!pond) return;
    var r = pond.getBoundingClientRect();
    var x = cx - r.left, y = cy - r.top;

    /* Plusieurs anneaux décalés */
    [0, 180, 360].forEach(function (delay) {
      var ripple = document.createElement('div');
      ripple.className = 'pond-ripple';
      ripple.style.left = x + 'px';
      ripple.style.top  = y + 'px';
      ripple.style.animationDelay = delay + 'ms';
      ripple.style.opacity = (1 - delay / 600).toString();
      pond.appendChild(ripple);
      setTimeout(function () {
        if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
      }, 2000 + delay);
    });

    if (navigator.vibrate) navigator.vibrate(20);
  }

  if (pond) {
    pond.addEventListener('click', function (e) {
      if (current === 4) addRipple(e.clientX, e.clientY);
    });
    pond.addEventListener('touchstart', function (e) {
      if (current === 4) {
        var t = e.touches[0];
        addRipple(t.clientX, t.clientY);
      }
    }, { passive: true });
  }


  /* ═══════════════════════════════════════════════════════
     Callbacks entrée section
  ═══════════════════════════════════════════════════════ */
  function onSectionEnter(idx) {
    if (idx === 1) startLiquid(); else stopLiquid();
    if (idx === 4) startPond();   else stopPond();
    /* Réinitialise prisme si on quitte */
    if (idx !== 2) {
      prRays.forEach(function (r) { r.classList.remove('live'); });
      if (prismBody) prismBody.style.transform = '';
    }
  }


  /* ═══════════════════════════════════════════════════════
     8. GYROSCOPE
  ═══════════════════════════════════════════════════════ */
  function onGyro(e) {
    /* beta: -90..90 (avant/arrière), gamma: -90..90 (gauche/droite) */
    var beta  = Math.max(-40, Math.min(40, (e.beta  || 0) - 40)) / 40;
    var gamma = Math.max(-40, Math.min(40,  e.gamma || 0))        / 40;

    if (current === 0) setGlassSpec(gamma,  beta);
    if (current === 1) { liqTargetX = gamma; liqTargetY = beta; }
    if (current === 2) setPrism(gamma);
    if (current === 3) setBubbleSpec(gamma,  beta);
  }

  if (isMobile) {
    var gyroBtn = document.getElementById('gyroBtn');

    function activateGyro() { window.addEventListener('deviceorientation', onGyro); }

    if (typeof DeviceOrientationEvent !== 'undefined') {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        gyroBtn.style.display = 'block';
        gyroBtn.addEventListener('click', function () {
          DeviceOrientationEvent.requestPermission().then(function (s) {
            gyroBtn.style.display = 'none';
            if (s === 'granted') activateGyro();
          }).catch(function () { gyroBtn.style.display = 'none'; });
        });
      } else {
        activateGyro();
      }
    }
  }


  /* Touch ripple global mobile (hors Onde) */
  if (isMobile) {
    var ripStyle = document.createElement('style');
    ripStyle.textContent = '@keyframes rippleOut{from{transform:translate(-50%,-50%) scale(0);opacity:.6}to{transform:translate(-50%,-50%) scale(3.2);opacity:0}}';
    document.head.appendChild(ripStyle);

    document.addEventListener('touchstart', function (e) {
      if (current === 4) return;
      var t = e.touches[0];
      var r = document.createElement('div');
      r.style.cssText = [
        'position:fixed','pointer-events:none','z-index:9998',
        'width:54px','height:54px','border-radius:50%',
        'border:1px solid rgba(100,100,120,.35)',
        'left:' + t.clientX + 'px','top:' + t.clientY + 'px',
        'animation:rippleOut .55s ease-out forwards',
      ].join(';');
      document.body.appendChild(r);
      setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 600);
    }, { passive: true });
  }


  /* ═══════════════════════════════════════════════════════
     9. EASTER EGG — triple-clic / triple-tap sur le fond
  ═══════════════════════════════════════════════════════ */
  var EG = '.glass-card,.bubble,.pond,.prism-body,.scene-label,.gyro-btn,#cursor,.dots';
  var egN = 0, egT = null;

  function showEasterEgg() {
    var flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;z-index:9990;background:#fff;opacity:0;pointer-events:none;transition:opacity .18s ease';
    document.body.appendChild(flash);
    requestAnimationFrame(function () {
      flash.style.opacity = '.9';
      setTimeout(function () {
        flash.style.opacity = '0';
        setTimeout(function () { if (flash.parentNode) flash.parentNode.removeChild(flash); }, 220);
      }, 200);
    });

    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:9991;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .5s ease';
    ov.innerHTML = '<div style="text-align:center;user-select:none">'
      + '<div style="font-size:2.8rem;margin-bottom:1rem;background:linear-gradient(135deg,#8b5cf6,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:egSpin 4s linear infinite">✦</div>'
      + '<div style="font-family:Courier New,monospace;font-size:.8rem;letter-spacing:.42em;color:rgba(100,100,120,.7)">// found.</div>'
      + '</div>';

    if (!document.getElementById('egStyle')) {
      var es = document.createElement('style');
      es.id = 'egStyle';
      es.textContent = '@keyframes egSpin{to{transform:rotate(360deg)}}';
      document.head.appendChild(es);
    }
    document.body.appendChild(ov);
    setTimeout(function () { ov.style.opacity = '1'; }, 350);
    var close = function () {
      ov.style.opacity = '0';
      setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 550);
      ov.removeEventListener('click', close);
    };
    setTimeout(close, 2800);
    ov.addEventListener('click', close);
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest(EG)) return;
    egN++;
    if (egT) clearTimeout(egT);
    if (egN >= 3) { egN = 0; showEasterEgg(); return; }
    egT = setTimeout(function () { egN = 0; }, 520);
  });

  if (isMobile) {
    var tN = 0, tT = null;
    document.addEventListener('touchstart', function (e) {
      if (e.target.closest(EG)) return;
      tN++;
      if (tT) clearTimeout(tT);
      if (tN >= 3) { tN = 0; showEasterEgg(); return; }
      tT = setTimeout(function () { tN = 0; }, 600);
    }, { passive: true });
  }

}());
