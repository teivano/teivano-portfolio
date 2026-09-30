// api/budget.js — Données privées de la page Budget
// Stockage : Vercel Blob en accès privé (BLOB_READ_WRITE_TOKEN injecté quand le store est lié au projet)
// Accès : code PIN (variable d'environnement BUDGET_PIN) → cookie de session signé, 30 jours
// Anti force brute : blocage 15 min après 5 échecs, 24 h à partir de 10 échecs

var crypto = require('crypto');
var blob = require('@vercel/blob');

var DATA_PATH = 'budget/state.json';
var LOCK_PATH = 'budget/lock.json';
var COOKIE = 'bd_s';
var SESSION_S = 30 * 24 * 3600;
var MAX_BYTES = 256 * 1024;

function sessionKey() {
  return crypto.createHash('sha256').update('budget-session:' + process.env.BLOB_READ_WRITE_TOKEN).digest();
}
function sign(payload) {
  return crypto.createHmac('sha256', sessionKey()).update(payload).digest('base64url');
}
function safeEqual(a, b) {
  var x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function newToken() {
  var p = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_S * 1000 })).toString('base64url');
  return p + '.' + sign(p);
}
function checkToken(token) {
  var parts = String(token || '').split('.');
  if (parts.length !== 2 || !safeEqual(parts[1], sign(parts[0]))) return false;
  try { return JSON.parse(Buffer.from(parts[0], 'base64url').toString()).exp > Date.now(); }
  catch (e) { return false; }
}
function getCookie(req) {
  var m = (req.headers.cookie || '').match(/(?:^|;\s*)bd_s=([^;]+)/);
  return m ? m[1] : '';
}
function setCookie(res, value, maxAge) {
  res.setHeader('Set-Cookie', COOKIE + '=' + value + '; Path=/api/budget; HttpOnly; Secure; SameSite=Strict; Max-Age=' + maxAge);
}
function parseBody(req) {
  var b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  return b && typeof b === 'object' ? b : null;
}

async function readJson(path) {
  var r = await blob.get(path, { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200) return null;
  return JSON.parse(await new Response(r.stream).text());
}
function writeJson(path, obj) {
  return blob.put(path, JSON.stringify(obj), {
    access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json'
  });
}

async function login(res, pin) {
  var now = Date.now();
  var lock = (await readJson(LOCK_PATH)) || { fails: 0, until: 0 };
  if (lock.until > now) return res.status(429).json({ error: 'locked', retryAfter: Math.ceil((lock.until - now) / 1000) });

  if (!safeEqual(pin, process.env.BUDGET_PIN)) {
    lock.fails += 1;
    var mins = lock.fails >= 10 ? 1440 : lock.fails >= 5 ? 15 : 0;
    lock.until = mins ? now + mins * 60000 : 0;
    await writeJson(LOCK_PATH, lock);
    return res.status(401).json({ error: 'pin', retryAfter: mins * 60 });
  }

  if (lock.fails) await writeJson(LOCK_PATH, { fails: 0, until: 0 });
  setCookie(res, newToken(), SESSION_S);
  return res.status(204).end();
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');

  if (!process.env.BLOB_READ_WRITE_TOKEN || !process.env.BUDGET_PIN) {
    return res.status(503).json({ error: 'config', hint: 'Lier un Blob store privé au projet et définir BUDGET_PIN' });
  }

  try {
    if (req.method === 'POST') {
      var body = parseBody(req) || {};
      if (body.action === 'login') return await login(res, String(body.pin || ''));
      if (body.action === 'logout') { setCookie(res, '', 0); return res.status(204).end(); }
      return res.status(400).json({ error: 'action' });
    }

    if (!checkToken(getCookie(req))) return res.status(401).json({ error: 'auth' });

    if (req.method === 'GET') {
      var data = await readJson(DATA_PATH);
      return data ? res.status(200).json(data) : res.status(404).json({ error: 'empty' });
    }

    if (req.method === 'PUT') {
      if (!/^application\/json/i.test(req.headers['content-type'] || '')) return res.status(415).json({ error: 'type' });
      var state = parseBody(req);
      if (!state || !Array.isArray(state.items)) return res.status(400).json({ error: 'format' });
      if (Buffer.byteLength(JSON.stringify(state)) > MAX_BYTES) return res.status(413).json({ error: 'size' });
      await writeJson(DATA_PATH, state);
      return res.status(204).end();
    }

    res.setHeader('Allow', 'GET, PUT, POST');
    return res.status(405).json({ error: 'method' });
  } catch (err) {
    console.error('budget api:', err && err.message);
    return res.status(500).json({ error: 'server' });
  }
};
