/* pin-guard.js — Protection PIN numérique
 * SHA-256 côté client · pad numérique injecté · aucun clavier natif
 * Idempotent : si déjà chargé (overlay présent), ne fait rien.
 */
(function () {
  if (document.getElementById('pg-overlay')) return;

  /* ── Hash SHA-256 du PIN "0000" (fallback global) ── */
  var PIN_HASH = '9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0';

  var entered      = '';
  var targetUrl    = '';
  var activePinHash = PIN_HASH; /* hash actif pour la session courante */

  /* ── Utilitaire SHA-256 via Web Crypto API ── */
  function sha256(str) {
    var enc  = new TextEncoder();
    return crypto.subtle.digest('SHA-256', enc.encode(str)).then(function (buf) {
      return Array.from(new Uint8Array(buf))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
    });
  }

  /* ── Injection HTML ── */
  var style = document.createElement('style');
  style.textContent = [
    '#pg-overlay{',
      'position:fixed;inset:0;',
      'background:rgba(0,0,0,.7);',
      'z-index:9000;',
      'display:flex;align-items:center;justify-content:center;',
      'opacity:0;pointer-events:none;',
      'transition:opacity .22s ease;',
    '}',
    '#pg-overlay.open{opacity:1;pointer-events:all;}',
    '@keyframes pgShake{',
      '0%,100%{transform:translateX(0)}',
      '15%{transform:translateX(-9px)}',
      '30%{transform:translateX(9px)}',
      '45%{transform:translateX(-6px)}',
      '60%{transform:translateX(6px)}',
      '75%{transform:translateX(-3px)}',
      '90%{transform:translateX(3px)}',
    '}',
    '#pg-box{',
      'background:var(--bg,#F5F0E8);',
      'border:2px solid var(--ink,#6B1A1A);',
      'box-shadow:6px 6px 0 var(--ink,#6B1A1A);',
      'width:min(320px,90vw);',
      'padding:2rem 1.8rem 2.2rem;',
      'position:relative;',
      'font-family:"Space Grotesk",system-ui,sans-serif;',
    '}',
    '#pg-box.shake{animation:pgShake .42s cubic-bezier(.36,.07,.19,.97) both;}',
    '#pg-close{',
      'position:absolute;top:.9rem;right:1rem;',
      'background:none;border:none;cursor:pointer;',
      'font-size:1rem;line-height:1;',
      'color:var(--ink,#6B1A1A);',
      'transition:opacity .15s;',
    '}',
    '#pg-close:hover{opacity:.5;}',
    '#pg-label{',
      'font-size:.6rem;letter-spacing:.22em;text-transform:uppercase;',
      'color:var(--ink2,rgba(107,26,26,.45));',
      'margin-bottom:1.6rem;',
    '}',
    '#pg-dots{',
      'display:flex;justify-content:center;gap:.85rem;',
      'margin-bottom:1.8rem;',
    '}',
    '.pg-dot{',
      'width:14px;height:14px;border-radius:50%;',
      'border:2px solid var(--ink,#6B1A1A);',
      'transition:background .12s;',
    '}',
    '.pg-dot.filled{background:var(--ink,#6B1A1A);}',
    '#pg-pad{',
      'display:grid;grid-template-columns:repeat(3,1fr);gap:.45rem;',
    '}',
    '.pg-key{',
      'background:var(--bg,#F5F0E8);',
      'border:1.5px solid var(--ink,#6B1A1A);',
      'color:var(--ink,#6B1A1A);',
      'font-family:"Space Grotesk",system-ui,sans-serif;',
      'font-size:1.15rem;font-weight:500;',
      'padding:.75rem .5rem;',
      'cursor:pointer;',
      'transition:background .1s,color .1s;',
      'user-select:none;-webkit-user-select:none;',
    '}',
    '.pg-key:hover{background:var(--ink,#6B1A1A);color:var(--bg,#F5F0E8);}',
    '.pg-key:active{opacity:.7;}',
    '.pg-key.wide{grid-column:span 2;}',
    '#pg-error{',
      'text-align:center;margin-top:1.1rem;',
      'font-size:.62rem;letter-spacing:.15em;text-transform:uppercase;',
      'color:#c0392b;height:1em;',
      'transition:opacity .2s;',
    '}',
  ].join('');
  document.head.appendChild(style);

  var overlay = document.createElement('div');
  overlay.id  = 'pg-overlay';
  overlay.innerHTML = [
    '<div id="pg-box">',
      '<button id="pg-close" aria-label="Annuler">✕</button>',
      '<div id="pg-label">Accès protégé</div>',
      '<div id="pg-dots">',
        '<div class="pg-dot" id="pg-d0"></div>',
        '<div class="pg-dot" id="pg-d1"></div>',
        '<div class="pg-dot" id="pg-d2"></div>',
        '<div class="pg-dot" id="pg-d3"></div>',
      '</div>',
      '<div id="pg-pad">',
        '<button class="pg-key" data-digit="1">1</button>',
        '<button class="pg-key" data-digit="2">2</button>',
        '<button class="pg-key" data-digit="3">3</button>',
        '<button class="pg-key" data-digit="4">4</button>',
        '<button class="pg-key" data-digit="5">5</button>',
        '<button class="pg-key" data-digit="6">6</button>',
        '<button class="pg-key" data-digit="7">7</button>',
        '<button class="pg-key" data-digit="8">8</button>',
        '<button class="pg-key" data-digit="9">9</button>',
        '<button class="pg-key" id="pg-del">⌫</button>',
        '<button class="pg-key" data-digit="0">0</button>',
        '<div></div>',
      '</div>',
      '<div id="pg-error"></div>',
    '</div>',
  ].join('');
  document.body.appendChild(overlay);

  /* ── DOM refs ── */
  var dots  = [0,1,2,3].map(function(i){ return document.getElementById('pg-d'+i); });
  var errEl = document.getElementById('pg-error');

  /* ── Fonctions ── */
  function openPin(url, pinHash) {
    targetUrl    = url;
    activePinHash = pinHash || PIN_HASH;
    entered      = '';
    refresh();
    overlay.classList.add('open');
  }

  function closePin() {
    overlay.classList.remove('open');
    entered   = '';
    errEl.textContent = '';
    refresh();
  }

  function refresh() {
    dots.forEach(function(d, i){
      d.classList.toggle('filled', i < entered.length);
    });
  }

  function addDigit(d) {
    if (entered.length >= 4) return;
    entered += d;
    refresh();
    errEl.textContent = '';
    if (entered.length === 4) validate();
  }

  function delDigit() {
    entered = entered.slice(0, -1);
    refresh();
    errEl.textContent = '';
  }

  function validate() {
    sha256(entered).then(function(h) {
      if (h === activePinHash) {
        closePin();
        window.location.href = targetUrl;
      } else {
        errEl.textContent = 'Code incorrect';
        entered = '';
        refresh();
        var box = document.getElementById('pg-box');
        box.classList.remove('shake');
        void box.offsetWidth; /* reflow pour relancer l'animation */
        box.classList.add('shake');
      }
    });
  }

  /* ── Événements ── */
  document.getElementById('pg-close').addEventListener('click', closePin);
  overlay.addEventListener('click', function(e){ if(e.target === overlay) closePin(); });

  document.getElementById('pg-pad').addEventListener('click', function(e){
    var key = e.target.closest('.pg-key');
    if (!key) return;
    if (key.id === 'pg-del') { delDigit(); return; }
    var d = key.dataset.digit;
    if (d !== undefined) addDigit(d);
  });

  document.addEventListener('keydown', function(e){
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') { closePin(); return; }
    if (e.key === 'Backspace') { delDigit(); return; }
    if (/^[0-9]$/.test(e.key)) addDigit(e.key);
  });

  /* ── Interception des liens protégés ── */
  document.addEventListener('click', function(e){
    var link = e.target.closest('[data-pin]');
    if (!link) return;
    e.preventDefault();
    openPin(link.dataset.pin, link.dataset.pinHash || null);
  });
})();
