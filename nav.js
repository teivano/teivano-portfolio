/* nav.js — Menu overlay commun à toutes les pages
 * S'injecte automatiquement : hamburger + overlay + styles de secours
 */
(function () {

  /* ── CSS de secours pour les pages sans style.css ── */
  var css = [
    '.ham{position:fixed;top:1.5rem;right:1.8rem;z-index:1001;width:26px;height:17px;cursor:pointer;border:none;background:none;padding:0;display:flex;flex-direction:column;justify-content:space-between;}',
    '.ham-line{display:block;width:100%;height:1.5px;background:var(--ink,#6B1A1A);transform-origin:center;transition:background .3s ease,transform .3s cubic-bezier(.16,1,.3,1),opacity .25s ease;}',
    '.ham.open .ham-line{background:var(--bg,#F5F0E8);}',
    '.ham.open .ham-line:nth-child(1){transform:translateY(7.25px) rotate(45deg);}',
    '.ham.open .ham-line:nth-child(2){opacity:0;transform:scaleX(0);}',
    '.ham.open .ham-line:nth-child(3){transform:translateY(-8.25px) rotate(-45deg);}',
    '.tlb-overlay{position:fixed;inset:0;background:var(--ink,#6B1A1A);z-index:1000;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .35s ease;}',
    '.tlb-overlay.open{opacity:1;pointer-events:all;}',
    '.tlb-nav{width:100%;max-width:680px;padding:0 2rem;}',
    '.tlb-nav-item{display:flex;flex-direction:column;gap:.45rem;padding:1.8rem 0;border-top:1px solid rgba(255,255,255,.12);text-decoration:none;transition:opacity .2s;}',
    '.tlb-nav-item:last-child{border-bottom:1px solid rgba(255,255,255,.12);}',
    '.tlb-nav-item:hover{opacity:.65;}',
    '.tlb-nav-item.current{opacity:.35;pointer-events:none;}',
    '.tlb-nav-title{font-family:"Cormorant Garamond",Georgia,serif;font-size:clamp(2rem,5.5vw,3.8rem);font-weight:300;color:var(--bg,#F5F0E8);letter-spacing:-.02em;line-height:1;}',
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

    a.innerHTML =
      '<span class="tlb-nav-title">' + link.title + '</span>' +
      '<span class="tlb-nav-desc">'  + link.desc  + '</span>';

    nav.appendChild(a);
  });

  overlay.appendChild(nav);
  document.body.appendChild(overlay);

  /* ── Logique open / close ── */
  function openNav() {
    overlay.classList.add('open');
    ham.classList.add('open');
    ham.setAttribute('aria-expanded', 'true');
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
