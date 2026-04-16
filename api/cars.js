// api/cars.js — Proxy API-Ninjas Cars (masque la clé X-Api-Key)
module.exports = async function handler(req, res) {
  var key = process.env.NINJA_KEY;
  if (!key) return res.status(500).json({ error: 'NINJA_KEY non configurée' });

  var qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';

  try {
    var response = await fetch('https://api.api-ninjas.com/v1/cars' + qs, {
      headers: { 'X-Api-Key': key }
    });
    var data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(response.ok ? 200 : response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
