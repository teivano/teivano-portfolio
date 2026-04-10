/* ═══════════════════════════════════════════════════════════════════
   MOOREA · script.js
   Sections :
     1. Micro-étoiles du Hero
     2. Bulles du Lagon
     3. Scroll Reveal (IntersectionObserver)
     4. Canvas étoiles — Te Pō
     5. Easter egg — le lézard caché
═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ───────────────────────────────────────────────────────────────
     1. MICRO-ÉTOILES HERO
     Crée 45 petits points flottants dans la section hero.
     Chacun a une taille, position, couleur et durée aléatoires.
  ─────────────────────────────────────────────────────────────── */
  var heroStars = document.getElementById('heroStars');
  if (heroStars) {
    /* Keyframe injecté une seule fois dans le <head> */
    var starStyle = document.createElement('style');
    starStyle.textContent = [
      '@keyframes starDrift{',
      'from{opacity:.1;transform:translate(0,0)}',
      'to{opacity:.6;transform:translate(var(--tx),var(--ty))}',
      '}'
    ].join('');
    document.head.appendChild(starStyle);

    for (var si = 0; si < 45; si++) {
      var s   = document.createElement('span');
      var sz  = Math.random() * 2.5 + 0.5;
      var tx  = (Math.random() - 0.5) * 60;
      var ty  = (Math.random() - 0.5) * 40;
      var col = Math.random() > 0.5 ? '0,180,216' : '144,224,239';
      var al  = (Math.random() * 0.45 + 0.12).toFixed(2);
      var dur = (6 + Math.random() * 10).toFixed(1);
      var del = (Math.random() * 4).toFixed(1);

      s.style.cssText = [
        'position:absolute',
        'border-radius:50%',
        'pointer-events:none',
        'left:'   + (Math.random() * 100).toFixed(1) + '%',
        'top:'    + (Math.random() * 100).toFixed(1) + '%',
        'width:'  + sz.toFixed(1) + 'px',
        'height:' + sz.toFixed(1) + 'px',
        'background:rgba(' + col + ',' + al + ')',
        '--tx:'   + tx.toFixed(0) + 'px',
        '--ty:'   + ty.toFixed(0) + 'px',
        'animation:starDrift ' + dur + 's ease-in-out ' + del + 's infinite alternate',
      ].join(';');

      heroStars.appendChild(s);
    }
  }


  /* ───────────────────────────────────────────────────────────────
     2. BULLES DU LAGON
     Génère des bulles qui montent depuis le bas de la section lagon.
     Chaque bulle est supprimée du DOM après son animation.
  ─────────────────────────────────────────────────────────────── */
  var bubblesContainer = document.getElementById('bubbles');
  if (bubblesContainer) {
    var bubStyle = document.createElement('style');
    bubStyle.textContent = [
      '@keyframes rise{',
      '0%  {transform:translateX(0) scale(1);opacity:0}',
      '10% {opacity:.7}',
      '85% {opacity:.25}',
      '100%{transform:translateX(var(--bx)) translateY(-105vh) scale(.4);opacity:0}',
      '}'
    ].join('');
    document.head.appendChild(bubStyle);

    function spawnBubble() {
      var b    = document.createElement('span');
      var size = (Math.random() * 14 + 5).toFixed(1);
      var bx   = ((Math.random() - 0.5) * 80).toFixed(0);
      var dur  = (6 + Math.random() * 9).toFixed(1);
      var al   = (Math.random() * 0.16 + 0.04).toFixed(2);

      b.style.cssText = [
        'position:absolute',
        'border-radius:50%',
        'pointer-events:none',
        'bottom:-20px',
        'left:'   + (Math.random() * 100).toFixed(1) + '%',
        'width:'  + size + 'px',
        'height:' + size + 'px',
        'background:rgba(144,224,239,' + al + ')',
        'border:1px solid rgba(144,224,239,.18)',
        '--bx:' + bx + 'px',
        'animation:rise ' + dur + 's ease-in forwards',
      ].join(';');

      bubblesContainer.appendChild(b);
      /* Nettoyage DOM après la fin de l'animation */
      setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 15000);
    }

    /* Salve initiale puis intervalles réguliers */
    for (var bi = 0; bi < 8; bi++) {
      (function (i) { setTimeout(spawnBubble, i * 280); })(bi);
    }
    setInterval(spawnBubble, 750);
  }


  /* ───────────────────────────────────────────────────────────────
     3. SCROLL REVEAL
     Observe chaque section .reveal avec IntersectionObserver.
     Quand elle entre dans le viewport, ajoute la classe .in
     qui déclenche les transitions CSS des .reveal-item.
  ─────────────────────────────────────────────────────────────── */
  var revealSections = document.querySelectorAll('.reveal');

  if (revealSections.length) {
    if (!window.IntersectionObserver) {
      /* Fallback : tout visible immédiatement */
      for (var ri = 0; ri < revealSections.length; ri++) {
        revealSections[ri].classList.add('in');
      }
    } else {
      var revealObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            revealObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });

      for (var ri2 = 0; ri2 < revealSections.length; ri2++) {
        revealObs.observe(revealSections[ri2]);
      }
    }
  }


  /* ───────────────────────────────────────────────────────────────
     4. CANVAS ÉTOILES — TE PŌ
     Dessine un ciel étoilé scintillant sur la section nuit.
     N'anime que lorsque la section est visible (perf mobile).
  ─────────────────────────────────────────────────────────────── */
  var starsCanvas = document.getElementById('starsCanvas');
  if (starsCanvas) {
    var sCtx   = starsCanvas.getContext('2d');
    var sStars = [];
    var sRaf   = null;

    function buildStarField() {
      sStars = [];
      /* Densité adaptée à la surface du canvas */
      var count = Math.floor((starsCanvas.width * starsCanvas.height) / 3800);
      for (var i = 0; i < count; i++) {
        sStars.push({
          x:     Math.random() * starsCanvas.width,
          y:     Math.random() * starsCanvas.height,
          r:     Math.random() * 1.4 + 0.2,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.007 + 0.002,
        });
      }
    }

    function resizeStars() {
      starsCanvas.width  = starsCanvas.clientWidth  || starsCanvas.parentElement.clientWidth;
      starsCanvas.height = starsCanvas.clientHeight || starsCanvas.parentElement.clientHeight;
      buildStarField();
    }

    function drawStars(ts) {
      var t = ts * 0.001;
      sCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
      for (var i = 0; i < sStars.length; i++) {
        var st = sStars[i];
        /* Scintillement via sinus déphasé par étoile */
        var a  = 0.2 + 0.8 * (Math.sin(st.phase + t * st.speed * 60) * 0.5 + 0.5);
        sCtx.beginPath();
        sCtx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        sCtx.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
        sCtx.fill();
      }
      sRaf = requestAnimationFrame(drawStars);
    }

    /* Observer : anime seulement quand la section est visible */
    if (window.IntersectionObserver) {
      var starsObs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          resizeStars();
          sRaf = requestAnimationFrame(drawStars);
        } else {
          if (sRaf) { cancelAnimationFrame(sRaf); sRaf = null; }
        }
      }, { threshold: 0.05 });
      starsObs.observe(starsCanvas.parentElement);
    } else {
      resizeStars();
      sRaf = requestAnimationFrame(drawStars);
    }

    window.addEventListener('resize', function () {
      if (sRaf) resizeStars();
    });
  }


  /* ───────────────────────────────────────────────────────────────
     5. EASTER EGG — LE LÉZARD CACHÉ

     Moorea = "Te Fenua Āihere" = "La terre du lézard jaune".
     Un petit lézard 🦎 est caché dans le footer (opacity .04,
     quasi invisible). Le cliquer déclenche un overlay avec
     des particules bioluminescentes et un message en tahitien.

     Pour fermer : bouton ✕, touche Échap, ou clic hors du cadre.
  ─────────────────────────────────────────────────────────────── */
  var lizardBtn = document.getElementById('lizardBtn');
  var easterEl  = document.getElementById('easterEgg');
  var closeBtn  = document.getElementById('easterClose');
  var bioCanvas = document.getElementById('bioCanvas');

  if (lizardBtn && easterEl && closeBtn && bioCanvas) {
    var bioCtx       = bioCanvas.getContext('2d');
    var bioRaf       = null;
    var bioParticles = [];

    /* Couleurs bioluminescentes */
    var BIO_COLORS = [
      '0,180,216',
      '144,224,239',
      '255,107,107',
      '0,119,182',
      '255,200,80',
    ];

    function buildParticles() {
      bioParticles = [];
      for (var i = 0; i < 140; i++) {
        bioParticles.push({
          x:     Math.random() * bioCanvas.width,
          y:     Math.random() * bioCanvas.height,
          vx:    (Math.random() - 0.5) * 1.8,
          vy:    (Math.random() - 0.5) * 1.8,
          r:     Math.random() * 4 + 1,
          c:     BIO_COLORS[Math.floor(Math.random() * BIO_COLORS.length)],
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.03 + 0.008,
        });
      }
    }

    function drawBio(ts) {
      var t = ts * 0.001;
      bioCtx.clearRect(0, 0, bioCanvas.width, bioCanvas.height);
      for (var i = 0; i < bioParticles.length; i++) {
        var p = bioParticles[i];
        /* Mouvement rebondissant */
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > bioCanvas.width)  p.vx = -p.vx;
        if (p.y < 0 || p.y > bioCanvas.height)  p.vy = -p.vy;
        /* Opacité pulsée */
        var a = 0.15 + 0.65 * (Math.sin(p.phase + t * p.speed * 60) * 0.5 + 0.5);
        /* Halo lumineux */
        bioCtx.save();
        bioCtx.shadowBlur  = 18;
        bioCtx.shadowColor = 'rgba(' + p.c + ',' + a.toFixed(2) + ')';
        bioCtx.beginPath();
        bioCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        bioCtx.fillStyle = 'rgba(' + p.c + ',' + a.toFixed(2) + ')';
        bioCtx.fill();
        bioCtx.restore();
      }
      bioRaf = requestAnimationFrame(drawBio);
    }

    function openEaster() {
      bioCanvas.width  = window.innerWidth;
      bioCanvas.height = window.innerHeight;
      buildParticles();
      easterEl.classList.add('open');
      easterEl.removeAttribute('aria-hidden');
      document.body.style.overflow = 'hidden';
      bioRaf = requestAnimationFrame(drawBio);
    }

    function closeEaster() {
      easterEl.classList.remove('open');
      easterEl.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (bioRaf) { cancelAnimationFrame(bioRaf); bioRaf = null; }
    }

    lizardBtn.addEventListener('click', openEaster);
    closeBtn.addEventListener('click', closeEaster);

    /* Clic sur le fond de l'overlay pour fermer */
    easterEl.addEventListener('click', function (e) {
      if (e.target === easterEl) closeEaster();
    });

    /* Touche Échap */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && easterEl.classList.contains('open')) {
        closeEaster();
      }
    });
  }

}());
