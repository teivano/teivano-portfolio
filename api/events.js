// api/events.js — Proxy STAR : evenements-rennes-en-temps-reel
var starFetch = require('./_starFetch');

module.exports = async function handler(req, res) {
  var base = 'https://data.explore.star.fr/api/explore/v2.1/catalog/datasets'
    + '/evenements-rennes-en-temps-reel/records';
  var qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';

  try {
    var response = await starFetch(base + qs);
    var data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.status(response.ok ? 200 : response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
