/* konduite-day.js — Animations "conduite" pour meteo.html
 * Actif en "mode conduite" : mercredi toute la journée + samedi 0h-12h.
 * - Bandeau route en bas avec koala qui roule
 * - Passages random de koalas (6-12s) — direction/altitude/vitesse variées
 * - Confettis au load (à chaque reload)
 * - Fumée d'échappement au scroll rapide + trainée derrière chaque koala
 * Overlay pointer-events:none : n'intercepte AUCUNE interaction (scrubbers, cards, bandeau pluie).
 */
(function () {

  /* getDay() : 0=dim, 1=lun, 2=mar, 3=mer, 4=jeu, 5=ven, 6=sam */
  function isConduiteMode() {
    var d = new Date();
    var day = d.getDay();
    if (day === 3) return true;                              // mercredi toute la journée
    if (day === 6 && d.getHours() < 12) return true;         // samedi jusqu'à midi
    return false;
  }

  if (!isConduiteMode()) return;

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  var KOALA_SRC = '/koala-drive.svg';

  /* ── Styles ── */
  var styleEl = document.createElement('style');
  styleEl.id = 'kdd-styles';
  styleEl.textContent = [
    '#kdd-layer{position:fixed;inset:0;z-index:100;pointer-events:none;overflow:hidden;}',
    '#kdd-road{position:fixed;left:0;right:0;bottom:0;height:54px;pointer-events:none;z-index:100;background:linear-gradient(to top,rgba(30,20,10,.12),transparent);overflow:hidden;}',
    '.kdd-road-line{position:absolute;left:-60px;right:-60px;bottom:14px;height:3px;background-image:repeating-linear-gradient(to right,#c9b689 0 22px,transparent 22px 42px);animation:kdd-scroll 1.1s linear infinite;opacity:.72;}',
    '@keyframes kdd-scroll{from{transform:translateX(0)}to{transform:translateX(-42px)}}',
    '.kdd-road-koala{position:absolute;bottom:6px;left:-80px;width:72px;height:auto;animation:kdd-cruise 22s ease-in-out infinite;}',
    '@keyframes kdd-cruise{0%{left:-80px;transform:scaleX(1)}45%{left:calc(100% - 10px);transform:scaleX(1)}50%{left:calc(100% - 10px);transform:scaleX(-1)}95%{left:-80px;transform:scaleX(-1)}100%{left:-80px;transform:scaleX(1)}}',
    '.kdd-koala{position:absolute;pointer-events:none;will-change:transform,left;height:auto;}',
    '.kdd-smoke{position:absolute;pointer-events:none;user-select:none;line-height:1;animation:kdd-smoke-fade 1.6s ease-out forwards;}',
    '@keyframes kdd-smoke-fade{0%{opacity:.75;transform:translate(0,0) scale(.55)}100%{opacity:0;transform:translate(-14px,-46px) scale(1.5)}}',
    '.kdd-confetti{position:absolute;pointer-events:none;user-select:none;line-height:1;will-change:transform,opacity;animation:kdd-conf 3.4s cubic-bezier(.15,.75,.4,1) forwards;}',
    '@keyframes kdd-conf{0%{transform:translate(0,0) rotate(0deg);opacity:1}70%{opacity:1}100%{transform:translate(var(--dx),var(--dy)) rotate(var(--rot));opacity:0}}'
  ].join('');
  document.head.appendChild(styleEl);

  /* ── Layer ── */
  var layer = document.createElement('div');
  layer.id = 'kdd-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  /* ── Bandeau route persistent ── */
  var road = document.createElement('div');
  road.id = 'kdd-road';
  road.setAttribute('aria-hidden', 'true');
  road.innerHTML = '<div class="kdd-road-line"></div><img class="kdd-road-koala" src="' + KOALA_SRC + '" alt="">';
  document.body.appendChild(road);

  /* ── Passages random ── */
  function spawnKoala() {
    if (document.hidden) return;
    var img = document.createElement('img');
    img.src = KOALA_SRC;
    img.className = 'kdd-koala';
    img.alt = '';

    var size = 55 + Math.random() * 70; // 55-125px
    img.style.width = size + 'px';

    var vh = window.innerHeight;
    var y = 70 + Math.random() * Math.max(vh - size - 200, 100);
    img.style.top = y + 'px';

    var duration = 3200 + Math.random() * 3800; // 3.2-7s
    var dir = Math.random() < 0.5 ? 1 : -1;
    var vw = window.innerWidth;
    var startX = dir === 1 ? -size - 30 : vw + 30;
    var endX   = dir === 1 ? vw + 30 : -size - 30;

    img.style.left = startX + 'px';
    img.style.transform = 'scaleX(' + dir + ')';
    img.style.transition = 'left ' + duration + 'ms linear';
    layer.appendChild(img);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        img.style.left = endX + 'px';
      });
    });

    var smokeInterval = setInterval(function () {
      if (!img.isConnected) { clearInterval(smokeInterval); return; }
      var rect = img.getBoundingClientRect();
      var s = document.createElement('div');
      s.className = 'kdd-smoke';
      s.textContent = '💨';
      var sx = dir === 1 ? rect.left + 4 : rect.right - 22;
      s.style.left = sx + 'px';
      s.style.top = (rect.top + rect.height * 0.55) + 'px';
      s.style.fontSize = (14 + Math.random() * 8) + 'px';
      layer.appendChild(s);
      setTimeout(function () { s.remove(); }, 1700);
    }, 220);

    setTimeout(function () {
      img.remove();
      clearInterval(smokeInterval);
    }, duration + 200);
  }

  function scheduleNext() {
    var delay = 6000 + Math.random() * 6000; // 6-12s
    setTimeout(function () {
      spawnKoala();
      scheduleNext();
    }, delay);
  }
  // Premier koala rapide pour montrer que ça vit
  setTimeout(spawnKoala, 1200);
  scheduleNext();

  /* ── Confettis au load ── */
  function fireConfetti() {
    var emojis = ['🎉', '🎊', '🐨', '🚗', '🚦', '⭐', '🎈', '🚘'];
    var vw = window.innerWidth, vh = window.innerHeight;
    var cx = vw / 2;
    var cy = vh - 50;
    var count = Math.min(70, Math.max(40, Math.floor(vw / 20)));

    for (var i = 0; i < count; i++) {
      (function (idx) {
        setTimeout(function () {
          var el = document.createElement('div');
          el.className = 'kdd-confetti';
          el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
          el.style.left = cx + 'px';
          el.style.top = cy + 'px';
          el.style.fontSize = (18 + Math.random() * 18) + 'px';
          var dx = (Math.random() - 0.5) * vw * 0.95;
          var dy = -(vh * 0.55 + Math.random() * vh * 0.35);
          var rot = (Math.random() - 0.5) * 720;
          el.style.setProperty('--dx', dx + 'px');
          el.style.setProperty('--dy', dy + 'px');
          el.style.setProperty('--rot', rot + 'deg');
          layer.appendChild(el);
          setTimeout(function () { el.remove(); }, 3500);
        }, idx * 12);
      })(i);
    }
  }
  setTimeout(fireConfetti, 500);

  /* ── Fumée au scroll rapide ── */
  var lastY = window.scrollY;
  var lastTime = 0;
  window.addEventListener('scroll', function () {
    var now = Date.now();
    if (now - lastTime < 180) return;
    var d = Math.abs(window.scrollY - lastY);
    if (d < 40) return;
    lastTime = now;
    lastY = window.scrollY;
    var vw = window.innerWidth, vh = window.innerHeight;
    var n = 2 + Math.floor(Math.random() * 3);
    for (var i = 0; i < n; i++) {
      (function (idx) {
        setTimeout(function () {
          var s = document.createElement('div');
          s.className = 'kdd-smoke';
          s.textContent = '💨';
          s.style.left = (Math.random() * vw) + 'px';
          s.style.top = (vh - 30 + Math.random() * 15) + 'px';
          s.style.fontSize = (18 + Math.random() * 12) + 'px';
          layer.appendChild(s);
          setTimeout(function () { s.remove(); }, 1700);
        }, idx * 70);
      })(i);
    }
  }, { passive: true });

})();
