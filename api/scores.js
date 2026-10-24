// Classement en ligne d'Opération Rempart (rempart.html).
// GET  /api/scores : tous les classements { boards: { 'col:veteran': [...], 'col:veteran:survie': [...] } }
// POST /api/scores : { id, name, key, s, st, w } inscrit un score ; { id, name, rename: true } renomme le joueur
//
// Stockage : un seul fichier JSON dans l'espace Blob privé « rempart-scores », branché sur le projet avec le
// préfixe REMPART. On n'utilise jamais BLOB_READ_WRITE_TOKEN, qui est la clé du budget.
// Les quotas Blob gratuits (2 000 écritures et 10 000 lectures par mois) sont communs à tout le site, budget
// compris : on écrit seulement si le classement change, au plus WRITES_PER_DAY fois par jour, et les lectures
// sont gardées en mémoire et en cache.
var crypto = require('crypto');
var blob = require('@vercel/blob');

var PATH = 'scores.json';
var KEY_RE = /^(col|pont|tenaille|delta|oasis|plage):(recrue|veteran|elite)(:survie)?$/;
var KEEP = 20;                 // lignes gardées par classement
var WRITES_PER_DAY = 30;       // pour tout le site, compté dans le fichier
var READS_PER_DAY = 150;       // par instance de la fonction
var MEMORY_MS = 60 * 1000;     // durée pendant laquelle une lecture reste valable en mémoire

var mem = null;                // { data, etag, at }
var reads = { day: '', n: 0 };

function credentials() {
  // La clé de l'espace rempart-scores, quel que soit le nom exact donné par Vercel au préfixe REMPART
  var names = Object.keys(process.env);
  for (var i = 0; i < names.length; i++) {
    var v = process.env[names[i]];
    if (names[i].indexOf('REMPART') === 0 && /READ_WRITE_TOKEN$/.test(names[i]) && v) {
      var storeId = v.split('_')[3];   // vercel_blob_rw_<storeId>_<secret>
      if (storeId) return { token: v, storeId: storeId };
    }
  }
  return null;
}

var today = function () { return new Date().toISOString().slice(0, 10); };
var empty = function () { return { v: 1, day: today(), writes: 0, boards: {} }; };
var playerKey = function (id) { return crypto.createHash('sha256').update('rempart:' + id).digest('hex').slice(0, 12); };

async function load(c) {
  if (reads.day !== today()) reads = { day: today(), n: 0 };
  if (reads.n >= READS_PER_DAY) { var e = new Error('quota'); e.code = 'quota'; throw e; }
  reads.n++;
  var r = await blob.get(PATH, { access: 'private', token: c.token, storeId: c.storeId, useCache: false });
  if (!r || r.statusCode !== 200) return { data: empty(), etag: null };
  var data = JSON.parse(await new Response(r.stream).text());
  if (!data || typeof data.boards !== 'object') data = empty();
  return { data: data, etag: r.blob.etag };
}

async function fresh(c, force) {
  if (!force && mem && Date.now() - mem.at < MEMORY_MS) return mem;
  var got = await load(c);
  mem = { data: got.data, etag: got.etag, at: Date.now() };
  return mem;
}

// Campagne : le score ; survie : la vague atteinte, puis le score
function better(a, b, survival) {
  return survival ? (a.w || 0) - (b.w || 0) || a.s - b.s : a.s - b.s;
}

function cleanName(name) {
  if (typeof name !== 'string') return '';
  return name.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
}

function validScore(b) {
  if (!KEY_RE.test(b.key || '')) return 'classement inconnu';
  var survival = /:survie$/.test(b.key);
  if (!Number.isInteger(b.s) || b.s < 0 || b.s > (survival ? 5000000 : 200000)) return 'score impossible';
  if (survival) { if (!Number.isInteger(b.w) || b.w < 11 || b.w > 2000) return 'vague impossible'; }
  else if (!Number.isInteger(b.st) || b.st < 0 || b.st > 3) return 'étoiles impossibles';
  return '';
}

// Applique la demande au fichier ; renvoie vrai s'il a changé
function apply(data, b, k, name) {
  var changed = false;
  // Le pseudo suit le joueur sur tous ses classements
  Object.keys(data.boards).forEach(function (key) {
    data.boards[key].forEach(function (e) { if (e.k === k && e.n !== name) { e.n = name; changed = true; } });
  });
  if (b.rename) return changed;
  var survival = /:survie$/.test(b.key);
  var entry = { k: k, n: name, s: b.s, at: Date.now() };
  if (survival) entry.w = b.w; else entry.st = b.st;
  var list = data.boards[b.key] || [];
  var mine = list.find(function (e) { return e.k === k; });
  if (mine && better(entry, mine, survival) <= 0) return changed;
  var next = list.filter(function (e) { return e.k !== k; }).concat(entry)
    .sort(function (x, y) { return better(y, x, survival); }).slice(0, KEEP);
  if (next.indexOf(entry) < 0) return changed;
  data.boards[b.key] = next;
  return true;
}

async function save(c, state) {
  var opts = { access: 'private', token: c.token, storeId: c.storeId, contentType: 'application/json',
    addRandomSuffix: false, cacheControlMaxAge: 60 };
  if (state.etag) { opts.allowOverwrite = true; opts.ifMatch = state.etag; }
  var r = await blob.put(PATH, JSON.stringify(state.data), opts);
  mem = { data: state.data, etag: r.etag, at: Date.now() };
}

module.exports = async function handler(req, res) {
  res.setHeader('X-Robots-Tag', 'noindex');
  var c = credentials();
  if (!c) return res.status(503).json({ error: 'classement non configuré' });

  try {
    if (req.method === 'GET') {
      var m = await fresh(c, false);
      res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
      return res.status(200).json({ boards: m.data.boards });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'méthode non permise' });

    var b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
    if (!b || typeof b !== 'object') return res.status(400).json({ error: 'requête illisible' });
    if (typeof b.id !== 'string' || !/^[A-Za-z0-9-]{16,64}$/.test(b.id)) return res.status(400).json({ error: 'joueur inconnu' });
    var name = cleanName(b.name);
    if (!name) return res.status(400).json({ error: 'pseudo manquant' });
    if (!b.rename) { var bad = validScore(b); if (bad) return res.status(400).json({ error: bad }); }
    var k = playerKey(b.id);
    res.setHeader('Cache-Control', 'no-store');

    // Rien à écrire d'après la dernière lecture : on répond sans toucher au stockage
    if (mem && Date.now() - mem.at < MEMORY_MS && !apply(JSON.parse(JSON.stringify(mem.data)), b, k, name)) {
      return res.status(200).json({ ok: true, saved: false, k: k, board: b.rename ? null : mem.data.boards[b.key] || [] });
    }

    // Écriture conditionnelle : si un autre joueur a écrit entre-temps, on relit et on recommence
    for (var attempt = 0; attempt < 3; attempt++) {
      var st = await fresh(c, true);
      var data = JSON.parse(JSON.stringify(st.data));
      if (!apply(data, b, k, name)) {
        return res.status(200).json({ ok: true, saved: false, k: k, board: b.rename ? null : data.boards[b.key] || [] });
      }
      if (data.day !== today()) { data.day = today(); data.writes = 0; }
      if (data.writes >= WRITES_PER_DAY) return res.status(429).json({ error: 'plafond du jour atteint', k: k });
      data.writes++;
      try {
        await save(c, { data: data, etag: st.etag });
        return res.status(200).json({ ok: true, saved: true, k: k, board: b.rename ? null : data.boards[b.key] });
      } catch (e) {
        // Fichier modifié entre-temps, ou créé au même instant par un autre joueur au tout premier score
        if (!(e instanceof blob.BlobPreconditionFailedError) && st.etag) throw e;
      }
    }
    return res.status(409).json({ error: 'trop de scores en même temps, réessayez' });
  } catch (e) {
    if (e && e.code === 'quota') return res.status(503).json({ error: 'classement en pause pour aujourd\'hui' });
    console.error('scores', e && e.message);
    return res.status(500).json({ error: 'erreur du classement' });
  }
};
