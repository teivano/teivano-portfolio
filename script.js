/* ═══════════════════════════════════════════════════════════
   CSS SHOWCASE · script.js
   1. Curseur custom (lerp)
   2. Sphere halo dynamique
   3. Scene reveal (IntersectionObserver)
   4. Cube 3D — mouse parallax
   5. Blend circles — mouse parallax
   6. feTurbulence — animation baseFrequency
   7. Gyroscope (mobile, iOS 13+ avec permission)
   8. Touch ripple (mobile)
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* Détecte touch vs pointer */
  var isMobile = window.matchMedia('(pointer: coarse)').matches;


  /* ─────────────────────────────────────────────────────────
     1. CURSEUR CUSTOM
     Le point suit exactement la souris.
     L'anneau suit avec un lerp (interpolation) pour un effet
     de "traînée" fluide.
  ───────────────────────────────────────────────────────── */
  if (!isMobile) {
    var cursorEl = document.getElementById('cursor');
    var dot      = cursorEl.querySelector('.cur-dot');
    var ring     = cursorEl.querySelector('.cur-ring');

    var mx = window.innerWidth  / 2;
    var my = window.innerHeight / 2;
    var rx = mx, ry = my;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
    });

    /* Boucle lerp */
    function tickCursor() {
      rx += (mx - rx) * 0.11;
      ry += (my - ry) * 0.11;
      dot.style.transform  = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px) translate(-50%,-50%)';
      requestAnimationFrame(tickCursor);
    }
    tickCursor();

    /* Hover sur objets : agrandit l'anneau */
    var hoverTargets = document.querySelectorAll(
      '.sphere, .turb-wrap, .cube-scene, .blend-wrap, .bars-wrap'
    );
    hoverTargets.forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add('hov'); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove('hov'); });
    });
  }


  /* ─────────────────────────────────────────────────────────
     2. SPHERE — HALO DYNAMIQUE
     La pseudo-sphère a un ::after avec un radial-gradient
     centré sur --mx --my. On met à jour ces variables
     selon la position de la souris dans la sphère.
  ───────────────────────────────────────────────────────── */
  var sphere = document.getElementById('sphere');
  if (sphere && !isMobile) {
    sphere.addEventListener('mousemove', function (e) {
      var r  = sphere.getBoundingClientRect();
      var px = ((e.clientX - r.left) / r.width  * 100).toFixed(1) + '%';
      var py = ((e.clientY - r.top)  / r.height * 100).toFixed(1) + '%';
      sphere.style.setProperty('--mx', px);
      sphere.style.setProperty('--my', py);
    });
    sphere.addEventListener('mouseleave', function () {
      sphere.style.setProperty('--mx', '50%');
      sphere.style.setProperty('--my', '50%');
    });
  }


  /* ─────────────────────────────────────────────────────────
     3. SCENE REVEAL
     Ajoute .in quand la section est visible à > 50%,
     retire .in quand elle sort (pour re-animer à chaque fois).
  ───────────────────────────────────────────────────────── */
  var scenes = document.querySelectorAll('.scene');

  if (!scenes.length) { /* rien */ }
  else if (!window.IntersectionObserver) {
    scenes.forEach(function (s) { s.classList.add('in'); });
  } else {
    var sceneObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
        } else {
          /* Retire .in pour que les animations se rejouent */
          e.target.classList.remove('in');
        }
      });
    }, { threshold: 0.5 });
    scenes.forEach(function (s) { sceneObs.observe(s); });
  }


  /* ─────────────────────────────────────────────────────────
     4. CUBE 3D — MOUSE PARALLAX
     Quand la section S3 est visible, le cube suit la souris.
     Hors champ, l'animation idle CSS reprend.
  ───────────────────────────────────────────────────────── */
  var cube    = document.getElementById('cube');
  var s3      = document.getElementById('s3');
  var cubeActive = false;

  function onCubeMouse(e) {
    var cx = window.innerWidth  / 2;
    var cy = window.innerHeight / 2;
    var ry = ((e.clientX - cx) / cx) * 42;
    var rx = -((e.clientY - cy) / cy) * 32;
    cube.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
  }

  if (cube && s3 && !isMobile && window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        cube.classList.add('live');
        document.addEventListener('mousemove', onCubeMouse);
        cubeActive = true;
      } else {
        cube.classList.remove('live');
        document.removeEventListener('mousemove', onCubeMouse);
        cubeActive = false;
      }
    }, { threshold: 0.4 }).observe(s3);
  }


  /* ─────────────────────────────────────────────────────────
     5. BLEND CIRCLES — MOUSE PARALLAX
     Les 3 cercles bougent en parallax léger selon la souris.
     Amplitudes différentes pour chaque cercle.
  ───────────────────────────────────────────────────────── */
  var blendWrap = document.getElementById('blendWrap');
  var s4        = document.getElementById('s4');
  var circles   = blendWrap ? blendWrap.querySelectorAll('.bc') : [];

  function onBlendMouse(e) {
    var cx = window.innerWidth  / 2;
    var cy = window.innerHeight / 2;
    var dx = (e.clientX - cx) / cx;
    var dy = (e.clientY - cy) / cy;
    if (circles[0]) circles[0].style.transform = 'translate(' + (dx * 22).toFixed(1) + 'px,' + (dy * 16).toFixed(1) + 'px)';
    if (circles[1]) circles[1].style.transform = 'translate(' + (-dx * 16).toFixed(1) + 'px,' + (dy * 22).toFixed(1) + 'px)';
    if (circles[2]) circles[2].style.transform = 'translate(' + (dx * 12).toFixed(1) + 'px,' + (-dy * 20).toFixed(1) + 'px)';
  }

  if (blendWrap && s4 && !isMobile && window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        circles.forEach(function (c) { c.classList.add('live'); });
        document.addEventListener('mousemove', onBlendMouse);
      } else {
        circles.forEach(function (c) { c.classList.remove('live'); });
        document.removeEventListener('mousemove', onBlendMouse);
      }
    }, { threshold: 0.4 }).observe(s4);
  }


  /* ─────────────────────────────────────────────────────────
     6. FETURBULENCE — ANIMATION DE baseFrequency
     On fait onduler lentement la fréquence du filtre SVG
     pour un effet de matière vivante, organique.
  ───────────────────────────────────────────────────────── */
  var feTurb   = document.getElementById('feTurb');
  var s2       = document.getElementById('s2');
  var turbRaf  = null;
  var freq     = 0.012;
  var freqDir  = 0.00025;

  function animTurb() {
    freq += freqDir;
    if (freq > 0.022 || freq < 0.007) freqDir = -freqDir;
    feTurb.setAttribute('baseFrequency',
      freq.toFixed(4) + ' ' + (freq * 0.68).toFixed(4)
    );
    turbRaf = requestAnimationFrame(animTurb);
  }

  if (feTurb && s2 && window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        if (!turbRaf) turbRaf = requestAnimationFrame(animTurb);
      } else {
        if (turbRaf) { cancelAnimationFrame(turbRaf); turbRaf = null; }
      }
    }, { threshold: 0.2 }).observe(s2);
  }


  /* ─────────────────────────────────────────────────────────
     7. GYROSCOPE (MOBILE)
     Remplace le parallax souris par l'inclinaison du téléphone.
     iOS 13+ : DeviceOrientationEvent.requestPermission() requis.
     Android : aucune permission.
  ───────────────────────────────────────────────────────── */
  if (isMobile) {
    var gyroBtn = document.getElementById('gyroBtn');

    function onGyro(e) {
      /* beta  = inclinaison avant/arrière  -90..90 */
      /* gamma = inclinaison gauche/droite  -90..90 */
      var beta  = Math.max(-40, Math.min(40, (e.beta  || 0) - 40)) / 40;
      var gamma = Math.max(-40, Math.min(40,  e.gamma || 0))        / 40;

      /* Cube */
      if (cube) {
        cube.classList.add('live');
        cube.style.transform =
          'rotateX(' + (-beta * 32).toFixed(1) + 'deg) rotateY(' + (gamma * 42).toFixed(1) + 'deg)';
      }

      /* Blend circles */
      if (circles[0]) circles[0].style.transform = 'translate(' + (gamma * 22).toFixed(1) + 'px,' + (beta * 16).toFixed(1) + 'px)';
      if (circles[1]) circles[1].style.transform = 'translate(' + (-gamma * 16).toFixed(1) + 'px,' + (beta * 22).toFixed(1) + 'px)';
      if (circles[2]) circles[2].style.transform = 'translate(' + (gamma * 12).toFixed(1) + 'px,' + (-beta * 20).toFixed(1) + 'px)';

      /* Sphere halo */
      if (sphere) {
        var px = (((gamma + 1) / 2) * 100).toFixed(1) + '%';
        var py = (((beta  + 1) / 2) * 100).toFixed(1) + '%';
        sphere.style.setProperty('--mx', px);
        sphere.style.setProperty('--my', py);
      }
    }

    if (typeof DeviceOrientationEvent !== 'undefined') {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        /* iOS 13+ : permission requise */
        gyroBtn.style.display = 'block';
        gyroBtn.addEventListener('click', function () {
          DeviceOrientationEvent.requestPermission().then(function (state) {
            if (state === 'granted') {
              gyroBtn.style.display = 'none';
              window.addEventListener('deviceorientation', onGyro);
            }
          }).catch(function () {
            gyroBtn.style.display = 'none';
          });
        });
      } else {
        /* Android & autres : pas de permission nécessaire */
        window.addEventListener('deviceorientation', onGyro);
      }
    }
  }


  /* ─────────────────────────────────────────────────────────
     8. TOUCH RIPPLE (MOBILE)
     Chaque tap crée un cercle qui se dilate et disparaît,
     en remplacement de l'effet curseur.
  ───────────────────────────────────────────────────────── */
  if (isMobile) {
    /* Keyframe injecté une seule fois */
    var rs = document.createElement('style');
    rs.textContent = '@keyframes rippleOut{from{transform:translate(-50%,-50%) scale(0);opacity:.7}to{transform:translate(-50%,-50%) scale(2.8);opacity:0}}';
    document.head.appendChild(rs);

    document.addEventListener('touchstart', function (e) {
      var t = e.touches[0];
      var r = document.createElement('div');
      r.style.cssText = [
        'position:fixed',
        'pointer-events:none',
        'z-index:9998',
        'width:70px',
        'height:70px',
        'border-radius:50%',
        'border:1px solid rgba(255,255,255,.45)',
        'left:' + t.clientX + 'px',
        'top:'  + t.clientY + 'px',
        'animation:rippleOut .55s ease-out forwards',
      ].join(';');
      document.body.appendChild(r);
      setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 600);
    }, { passive: true });
  }

}());
