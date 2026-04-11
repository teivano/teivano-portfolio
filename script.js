/* ═══════════════════════════════════════════════════════════
   CSS SHOWCASE · script.js — Liquid Glass v2
   1. Navigation slides (swipe / wheel / dots / clavier)
   2. Curseur custom (lerp)
   3. S1 Sphère — halo + gyro highlight
   4. S2 Onde  — feTurbulence + tap ripple + vibration
   5. S3 Strata — mouse/gyro parallax 3D
   6. S4 Prisme — gyro → rotation des rayons
   7. S5 Morphe — touch → accélère la mutation
   8. Gyroscope central (iOS 13+ + Android)
   9. Easter egg — triple-clic / triple-tap
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var isMobile = window.matchMedia('(pointer: coarse)').matches;

  /* ═══ Références DOM ═════════════════════════════════════ */
  var slides    = document.getElementById('slides');
  var dotBtns   = document.querySelectorAll('.dot');
  var scenes    = document.querySelectorAll('.scene');
  var sphere    = document.getElementById('sphere');
  var feTurb    = document.getElementById('feTurb');
  var feDisp    = document.getElementById('feDisp');
  var waveWrap  = document.getElementById('waveWrap');
  var strata    = document.getElementById('strata');
  var prismWrap = document.getElementById('prismWrap');
  var morphEl   = document.getElementById('morph');
  var TOTAL     = scenes.length; /* 5 */


  /* ═══════════════════════════════════════════════════════
     1. NAVIGATION SLIDES
  ═══════════════════════════════════════════════════════ */
  var current    = 0;
  var transitioning = false;

  function goTo(idx, instant) {
    if (idx < 0 || idx >= TOTAL) return;
    if (transitioning && !instant) return;
    transitioning = true;

    /* Retire .active de l'ancienne section */
    scenes[current].classList.remove('active');
    dotBtns[current].classList.remove('active');

    current = idx;
    slides.style.transition = instant
      ? 'none'
      : 'transform var(--nav-dur) var(--ease)';
    slides.style.transform = 'translateY(' + (-current * window.innerHeight) + 'px)';

    scenes[current].classList.add('active');
    dotBtns[current].classList.add('active');

    setTimeout(function () { transitioning = false; }, instant ? 0 : 820);
  }

  /* Init : active la première section */
  scenes[0].classList.add('active');

  /* Recompute position on resize (vh change) */
  window.addEventListener('resize', function () {
    goTo(current, true);
  });

  /* Dots */
  dotBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      goTo(parseInt(btn.dataset.to, 10));
    });
  });

  /* Clavier (desktop) */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goTo(current + 1); }
    if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); goTo(current - 1); }
  });

  /* Wheel (desktop) */
  var wheelLock = false;
  window.addEventListener('wheel', function (e) {
    if (wheelLock) return;
    wheelLock = true;
    goTo(e.deltaY > 0 ? current + 1 : current - 1);
    setTimeout(function () { wheelLock = false; }, 900);
  }, { passive: true });

  /* Swipe (mobile) */
  var touchY0 = 0, touchX0 = 0;
  document.addEventListener('touchstart', function (e) {
    touchY0 = e.touches[0].clientY;
    touchX0 = e.touches[0].clientX;
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    var dy = touchY0 - e.changedTouches[0].clientY;
    var dx = touchX0 - e.changedTouches[0].clientX;
    /* Swipe vertical uniquement, et plus grand que horizontal */
    if (Math.abs(dy) > 55 && Math.abs(dy) > Math.abs(dx) * 1.2) {
      goTo(dy > 0 ? current + 1 : current - 1);
    }
  }, { passive: true });


  /* ═══════════════════════════════════════════════════════
     2. CURSEUR CUSTOM (desktop)
  ═══════════════════════════════════════════════════════ */
  if (!isMobile) {
    var cursorEl = document.getElementById('cursor');
    var dot      = cursorEl.querySelector('.cur-dot');
    var ring     = cursorEl.querySelector('.cur-ring');
    var mx = innerWidth / 2, my = innerHeight / 2;
    var rx = mx, ry = my;

    document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });

    (function tickCursor() {
      rx += (mx - rx) * 0.11;
      ry += (my - ry) * 0.11;
      dot.style.transform  = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px) translate(-50%,-50%)';
      requestAnimationFrame(tickCursor);
    }());

    var hoverTargets = document.querySelectorAll('.sphere,.wave-wrap,.strata-scene,.prism-wrap,.morph-wrap');
    hoverTargets.forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add('hov'); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove('hov'); });
    });
  }


  /* ═══════════════════════════════════════════════════════
     3. S1 SPHÈRE — halo dynamique (souris / gyro)
  ═══════════════════════════════════════════════════════ */
  var sphereShine = sphere ? sphere.querySelector('.sphere-shine') : null;

  function setSphereLight(pxStr, pyStr) {
    if (!sphere) return;
    sphere.style.setProperty('--mx', pxStr);
    sphere.style.setProperty('--my', pyStr);
    /* Le reflet spéculaire se déplace aussi */
    if (sphereShine) {
      var px = parseFloat(pxStr);
      var py = parseFloat(pyStr);
      sphereShine.style.left = (px * 0.35 + 5) + '%';
      sphereShine.style.top  = (py * 0.35 + 5) + '%';
    }
  }

  if (sphere && !isMobile) {
    sphere.addEventListener('mousemove', function (e) {
      var r  = sphere.getBoundingClientRect();
      setSphereLight(
        ((e.clientX - r.left) / r.width  * 100).toFixed(1) + '%',
        ((e.clientY - r.top)  / r.height * 100).toFixed(1) + '%'
      );
    });
    sphere.addEventListener('mouseleave', function () {
      setSphereLight('50%', '50%');
    });
  }


  /* ═══════════════════════════════════════════════════════
     4. S2 ONDE — feTurbulence + tap + vibration
  ═══════════════════════════════════════════════════════ */
  var freq    = 0.014;
  var freqDir = 0.00018;
  var dispScale  = 38;
  var dispTarget = 38;
  var turbRaf = null;

  function animTurb() {
    freq += freqDir;
    if (freq > 0.024 || freq < 0.006) freqDir = -freqDir;
    feTurb.setAttribute('baseFrequency', freq.toFixed(4) + ' ' + (freq * 0.65).toFixed(4));

    /* Lerp du displacement scale (retour après tap) */
    dispScale += (dispTarget - dispScale) * 0.06;
    feDisp.setAttribute('scale', dispScale.toFixed(1));

    turbRaf = requestAnimationFrame(animTurb);
  }

  function startTurb() { if (!turbRaf) turbRaf = requestAnimationFrame(animTurb); }
  function stopTurb()  { if (turbRaf)  { cancelAnimationFrame(turbRaf); turbRaf = null; } }

  /* Tap / click sur la section Onde → spike + haptique */
  function onWaveTap(cx, cy) {
    /* Spike du displacement */
    dispTarget = 120;
    setTimeout(function () { dispTarget = 38; }, 380);

    /* Vibration haptique */
    if (navigator.vibrate) navigator.vibrate(40);

    /* Changement de seed → nouvelle forme */
    var s = parseInt(feTurb.getAttribute('seed') || '7', 10);
    feTurb.setAttribute('seed', ((s + 1) % 20) + 1);

    /* Ripple visuel centré sur le tap */
    var r     = waveWrap.getBoundingClientRect();
    var ripple = document.createElement('div');
    ripple.style.cssText = [
      'position:absolute',
      'pointer-events:none',
      'z-index:10',
      'width:60px', 'height:60px',
      'border-radius:50%',
      'border:2px solid rgba(16,185,129,.7)',
      'left:' + (cx - r.left)  + 'px',
      'top:'  + (cy - r.top)   + 'px',
      'animation:waveRipple .7s ease-out forwards',
    ].join(';');
    waveWrap.appendChild(ripple);
    setTimeout(function () { if (ripple.parentNode) ripple.parentNode.removeChild(ripple); }, 750);
  }

  if (waveWrap) {
    waveWrap.addEventListener('click', function (e) {
      if (current === 1) onWaveTap(e.clientX, e.clientY);
    });
    waveWrap.addEventListener('touchstart', function (e) {
      if (current === 1) {
        var t = e.touches[0];
        onWaveTap(t.clientX, t.clientY);
      }
    }, { passive: true });
  }

  /* Démarre/stoppe selon section active */
  /* (géré dans la boucle gyro/section ci-dessous) */


  /* ═══════════════════════════════════════════════════════
     5. S3 STRATA — parallax 3D souris / gyro
  ═══════════════════════════════════════════════════════ */
  function setStrata(rx, ry) {
    if (!strata) return;
    strata.classList.add('live');
    strata.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
  }

  if (strata && !isMobile) {
    document.addEventListener('mousemove', function (e) {
      if (current !== 2) return;
      var cx = innerWidth / 2, cy = innerHeight / 2;
      setStrata(-((e.clientY - cy) / cy) * 30, ((e.clientX - cx) / cx) * 40);
    });
  }


  /* ═══════════════════════════════════════════════════════
     6. S4 PRISME — gyro / souris → rotation des rayons
  ═══════════════════════════════════════════════════════ */
  var prismRays = prismWrap ? prismWrap.querySelectorAll('.prism-ray') : [];

  function setPrism(gamma, beta) {
    /* gamma : -1..1 (gauche/droite), beta : -1..1 (avant/arrière) */
    prismRays.forEach(function (r) { r.classList.add('live'); });
    var baseAngles = [-35, 35, 0];
    var baseY      = [-8, -8, 18];
    prismRays.forEach(function (r, i) {
      var angle = baseAngles[i] + gamma * 18;
      var ty    = baseY[i]     + beta  * 10;
      r.style.transform = 'rotate(' + angle.toFixed(1) + 'deg) translateY(' + ty.toFixed(1) + '%)';
    });
  }

  if (prismWrap && !isMobile) {
    document.addEventListener('mousemove', function (e) {
      if (current !== 3) return;
      var cx = innerWidth / 2, cy = innerHeight / 2;
      setPrism((e.clientX - cx) / cx, (e.clientY - cy) / cy);
    });
  }


  /* ═══════════════════════════════════════════════════════
     7. S5 MORPHE — touch/click → accélère la mutation
  ═══════════════════════════════════════════════════════ */
  var morphSpeed = 1;

  function boostMorph() {
    if (!morphEl) return;
    morphSpeed = 4;
    morphEl.style.animationDuration = '2s, 2s';
    if (navigator.vibrate) navigator.vibrate(25);
    setTimeout(function () {
      morphSpeed = 1;
      morphEl.style.animationDuration = '';
    }, 1800);
  }

  if (morphEl) {
    morphEl.addEventListener('click', boostMorph);
    morphEl.addEventListener('touchstart', boostMorph, { passive: true });
  }


  /* ═══════════════════════════════════════════════════════
     8. GYROSCOPE — central, dispatche vers chaque section
  ═══════════════════════════════════════════════════════ */
  var gyroActive = false;

  function onGyro(e) {
    gyroActive = true;
    /* Normalise beta (-40..40) → -1..1 ; gamma (-40..40) → -1..1 */
    var beta  = Math.max(-40, Math.min(40, (e.beta  || 0) - 40)) / 40;
    var gamma = Math.max(-40, Math.min(40,  e.gamma || 0))        / 40;

    /* S1 Sphère */
    if (current === 0) {
      setSphereLight(
        (((gamma + 1) / 2) * 100).toFixed(1) + '%',
        (((beta  + 1) / 2) * 100).toFixed(1) + '%'
      );
    }

    /* S3 Strata */
    if (current === 2) setStrata(-beta * 30, gamma * 40);

    /* S4 Prisme */
    if (current === 3) setPrism(gamma, beta);
  }

  if (isMobile) {
    var gyroBtn = document.getElementById('gyroBtn');

    function activateGyro() {
      window.addEventListener('deviceorientation', onGyro);
    }

    if (typeof DeviceOrientationEvent !== 'undefined') {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        /* iOS 13+ */
        gyroBtn.style.display = 'block';
        gyroBtn.addEventListener('click', function () {
          DeviceOrientationEvent.requestPermission().then(function (state) {
            gyroBtn.style.display = 'none';
            if (state === 'granted') activateGyro();
          }).catch(function () { gyroBtn.style.display = 'none'; });
        });
      } else {
        activateGyro(); /* Android : pas de permission */
      }
    }
  }


  /* ═══════════════════════════════════════════════════════
     Gestion démarrage/arrêt selon section active
  ═══════════════════════════════════════════════════════ */
  function onSectionChange(idx) {
    /* Strata : reset animation si on quitte */
    if (strata && idx !== 2) {
      strata.classList.remove('live');
    }
    /* Onde : turb actif seulement sur S2 */
    if (idx === 1) startTurb();
    else           stopTurb();
  }

  /* Patch goTo pour déclencher les callbacks */
  var _goTo = goTo;
  goTo = function (idx, instant) {
    _goTo(idx, instant);
    onSectionChange(idx);
  };

  /* S2 actif dès le début si c'est la section 0 ? Non — démarre seulement sur S2 */
  /* Initial : S1 active, turb off */


  /* ═══════════════════════════════════════════════════════
     Touch ripple global (mobile, hors S2)
  ═══════════════════════════════════════════════════════ */
  if (isMobile) {
    var rs = document.createElement('style');
    rs.textContent = '@keyframes rippleOut{from{transform:translate(-50%,-50%) scale(0);opacity:.65}to{transform:translate(-50%,-50%) scale(3);opacity:0}}';
    document.head.appendChild(rs);

    document.addEventListener('touchstart', function (e) {
      if (current === 1) return; /* S2 a son propre ripple */
      var t = e.touches[0];
      var r = document.createElement('div');
      r.style.cssText = [
        'position:fixed', 'pointer-events:none', 'z-index:9998',
        'width:60px', 'height:60px', 'border-radius:50%',
        'border:1px solid rgba(255,255,255,.4)',
        'left:' + t.clientX + 'px', 'top:' + t.clientY + 'px',
        'animation:rippleOut .55s ease-out forwards',
      ].join(';');
      document.body.appendChild(r);
      setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 600);
    }, { passive: true });
  }


  /* ═══════════════════════════════════════════════════════
     9. EASTER EGG — triple-clic (desktop) / triple-tap (mobile)
     sur le fond, hors objets
  ═══════════════════════════════════════════════════════ */
  var EG_IGNORE = '.sphere,.wave-wrap,.strata-scene,.prism-wrap,.morph-wrap,.scene-label,.gyro-btn,#cursor,.dots';
  var egCount = 0, egTimer = null;

  function triggerEasterEgg() {
    /* Flash */
    var flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;z-index:9990;background:#fff;opacity:0;pointer-events:none;transition:opacity .18s ease';
    document.body.appendChild(flash);
    requestAnimationFrame(function () {
      flash.style.opacity = '1';
      setTimeout(function () {
        flash.style.opacity = '0';
        setTimeout(function () { if (flash.parentNode) flash.parentNode.removeChild(flash); }, 220);
      }, 200);
    });

    /* Overlay */
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:9991;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .5s ease';
    ov.innerHTML = [
      '<div style="text-align:center;user-select:none">',
        '<div style="font-size:2.8rem;margin-bottom:1.1rem;',
          'background:linear-gradient(135deg,#8b5cf6,#06b6d4);',
          '-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;',
          'animation:egSpin 4s linear infinite">✦</div>',
        '<div style="font-family:Courier New,monospace;font-size:.82rem;letter-spacing:.42em;color:rgba(255,255,255,.4)">// found.</div>',
      '</div>',
    ].join('');

    if (!document.getElementById('egStyle')) {
      var es = document.createElement('style');
      es.id = 'egStyle';
      es.textContent = '@keyframes egSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}';
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
    if (e.target.closest(EG_IGNORE)) return;
    egCount++;
    if (egTimer) clearTimeout(egTimer);
    if (egCount >= 3) { egCount = 0; triggerEasterEgg(); return; }
    egTimer = setTimeout(function () { egCount = 0; }, 520);
  });

  if (isMobile) {
    var tCount = 0, tTimer = null;
    document.addEventListener('touchstart', function (e) {
      if (e.target.closest(EG_IGNORE)) return;
      tCount++;
      if (tTimer) clearTimeout(tTimer);
      if (tCount >= 3) { tCount = 0; triggerEasterEgg(); return; }
      tTimer = setTimeout(function () { tCount = 0; }, 600);
    }, { passive: true });
  }

}());
