/* nav.js — Menu overlay commun à toutes les pages
 * S'injecte automatiquement : hamburger + overlay + styles de secours
 */
(function () {

  /* ── CSS de secours pour les pages sans style.css ── */
  var css = [
    '.ham{position:fixed;top:1.5rem;right:1.8rem;z-index:1001;width:26px;height:17px;cursor:pointer;border:none;background:none;padding:0;display:flex;flex-direction:column;justify-content:space-between;}',
    '.ham-line{display:block;width:100%;height:1.5px;background:var(--ink,#6B1A1A);transform-origin:center;transition:background .3s ease,transform .3s cubic-bezier(.16,1,.3,1),opacity .25s ease;}',
    '.ham.open .ham-line{background:var(--overlay-fg,var(--bg,#F5F0E8));}',
    '.ham.open .ham-line:nth-child(1){transform:translateY(7.25px) rotate(45deg);}',
    '.ham.open .ham-line:nth-child(2){opacity:0;transform:scaleX(0);}',
    '.ham.open .ham-line:nth-child(3){transform:translateY(-8.25px) rotate(-45deg);}',
    '.tlb-overlay{position:fixed;inset:0;background:var(--overlay-bg,var(--ink,#6B1A1A));z-index:1000;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:clamp(5rem,12vh,8rem) clamp(2rem,8vw,8rem) clamp(3rem,8vh,6rem);opacity:0;pointer-events:none;transition:opacity .35s ease;}',
    '.tlb-overlay.open{opacity:1;pointer-events:all;}',
    '.tlb-overlay::after{content:"";position:fixed;left:0;right:0;bottom:0;height:90px;background:linear-gradient(to top,var(--overlay-bg,var(--ink,#6B1A1A)) 20%,transparent);pointer-events:none;opacity:0;transition:opacity .3s ease;z-index:1;}',
    '.tlb-overlay.open.scrollable::after{opacity:1;}',
    '.tlb-overlay.at-bottom::after{opacity:0;}',
    '.tlb-scroll-cue{position:fixed;left:50%;bottom:1.4rem;transform:translateX(-50%);width:18px;height:18px;border-right:1.5px solid rgba(255,255,255,.55);border-bottom:1.5px solid rgba(255,255,255,.55);transform-origin:center;pointer-events:none;opacity:0;transition:opacity .3s ease;z-index:2;animation:tlb-scroll-bounce 1.8s ease-in-out infinite;}',
    '.tlb-overlay.open.scrollable .tlb-scroll-cue{opacity:.7;}',
    '.tlb-overlay.at-bottom .tlb-scroll-cue{opacity:0;}',
    '@keyframes tlb-scroll-bounce{0%,100%{transform:translateX(-50%) translateY(0) rotate(45deg);}50%{transform:translateX(-50%) translateY(5px) rotate(45deg);}}',
    '.tlb-nav{width:100%;max-width:680px;margin:0 auto;}',
    '.tlb-nav-item{display:flex;flex-direction:column;gap:.45rem;padding:1.8rem 0;border-top:1px solid rgba(255,255,255,.12);text-decoration:none;transition:opacity .2s;}',
    '.tlb-nav-item:last-child{border-bottom:1px solid rgba(255,255,255,.12);}',
    '.tlb-nav-item:hover{opacity:.65;}',
    '.tlb-nav-item.current{opacity:.35;pointer-events:none;}',
    '.tlb-nav-title{font-family:"Cormorant Garamond",Georgia,serif;font-size:clamp(2rem,5.5vw,3.8rem);font-weight:300;color:var(--overlay-fg,var(--bg,#F5F0E8));letter-spacing:-.02em;line-height:1;}',
    '.tlb-nav-emoji{display:inline-block;margin-right:.25em;font-style:normal;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;}',
    '.tlb-nav-desc{font-family:"Space Grotesk",sans-serif;font-size:.65rem;font-weight:300;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.38);}',
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.id  = 'tlb-nav-styles';
  document.head.appendChild(styleEl);
  styleEl.textContent = css;

  /* ── Liens du menu ── */
  var currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  var LINKS = [
    { href:'/',                url:'/',                title:'Accueil',        desc:'TLB · Page principale' },
    { href:'/transports.html', url:'/transports.html', title:'Métros',         desc:'Lignes A & B · temps réel' },
    { href:'/demo-api.html',   url:'/demo-api.html',   title:'Tests API',      desc:'APIs ouvertes — transports, carburant, satellites' },
    { href:'/evenements.html', url:'/evenements.html', title:'Événements',     desc:'Agenda culturel · Rennes · OpenAgenda' },
    { href:'#',                pin:'https://w.teivano.fr', title:'Workout Tracker', desc:'Suivi d\'entraînement personnel' },
    { href:'#',                pin:'/prepa-gr20.html',  pinHash:'20ee235b5de5b36244da6f9aa1cbdd032a90867ba92276ccc8c38c0d0d57fcec', title:'Prépa GR20', desc:'Starter pack · matériel · itinéraire · météo' },
    { href:'#',                pin:'/koala.html',      url:'/koala.html', pinHash:'07aa2015d482734372d4a9a1c07c8290198526b9ce1fd2e2dcff4d05f6792a29', title:'', emoji:'🐨', desc:'Accès protégé · code à 4 chiffres' },
  ];

  /* ── Hamburger ── */
  var ham = document.createElement('button');
  ham.className   = 'ham';
  ham.id          = 'hamBtn';
  ham.setAttribute('aria-label', 'Menu');
  ham.setAttribute('aria-expanded', 'false');
  ham.innerHTML   = '<span class="ham-line"></span><span class="ham-line"></span><span class="ham-line"></span>';
  document.body.appendChild(ham);

  /* ── Overlay ── */
  var overlay = document.createElement('div');
  overlay.className = 'tlb-overlay';
  overlay.id        = 'tlbOverlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Navigation');

  var nav = document.createElement('nav');
  nav.className = 'tlb-nav';

  LINKS.forEach(function (link) {
    /* Ne pas afficher le lien de la page courante */
    var isCurrent = (link.url && (currentPath === link.url || currentPath + '.html' === link.url || currentPath === link.url.replace('.html','')));

    var a = document.createElement('a');
    a.className = 'tlb-nav-item' + (isCurrent ? ' current' : '');

    if (link.pin) {
      a.href = link.href;
      a.dataset.pin = link.pin;
      if (link.pinHash) a.dataset.pinHash = link.pinHash;
    } else {
      a.href = link.href;
    }

    var emojiHtml = link.emoji ? '<span class="tlb-nav-emoji" aria-hidden="true">' + link.emoji + '</span>' : '';
    a.innerHTML =
      '<span class="tlb-nav-title">' + emojiHtml + link.title + '</span>' +
      '<span class="tlb-nav-desc">'  + link.desc  + '</span>';

    nav.appendChild(a);
  });

  overlay.appendChild(nav);

  /* ── Indicateur de scroll (chevron + fade) ── */
  var scrollCue = document.createElement('div');
  scrollCue.className = 'tlb-scroll-cue';
  scrollCue.setAttribute('aria-hidden', 'true');
  overlay.appendChild(scrollCue);

  document.body.appendChild(overlay);

  function checkScroll() {
    var needs = overlay.scrollHeight > overlay.clientHeight + 6;
    overlay.classList.toggle('scrollable', needs);
    var atBottom = overlay.scrollTop + overlay.clientHeight >= overlay.scrollHeight - 6;
    overlay.classList.toggle('at-bottom', atBottom);
  }
  overlay.addEventListener('scroll', checkScroll, { passive: true });
  window.addEventListener('resize', checkScroll);

  /* ── Logique open / close ── */
  function openNav() {
    overlay.classList.add('open');
    ham.classList.add('open');
    ham.setAttribute('aria-expanded', 'true');
    overlay.scrollTop = 0;
    requestAnimationFrame(checkScroll);
  }
  function closeNav() {
    overlay.classList.remove('open');
    ham.classList.remove('open');
    ham.setAttribute('aria-expanded', 'false');
  }

  ham.addEventListener('click', function () {
    ham.classList.contains('open') ? closeNav() : openNav();
  });
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeNav();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  /* Ferme l'overlay au clic sur un lien non-protégé */
  nav.addEventListener('click', function (e) {
    var item = e.target.closest('.tlb-nav-item');
    if (item && !item.dataset.pin) closeNav();
  });

})();
