// api/trains.js — Proxy serverless SNCF (contourne la restriction CORS)
// Vercel l'expose automatiquement à /api/trains
// Nécessite la variable d'environnement SNCF_KEY dans Vercel

module.exports = async function handler(req, res) {
  var key = process.env.SNCF_KEY;

  if (!key) {
    return res.status(500).json({
      error: 'SNCF_KEY non configurée',
      hint: 'Vercel → Project Settings → Environment Variables → SNCF_KEY'
    });
  }

  try {
    var response = await fetch(
      'https://api.sncf.com/v1/coverage/sncf'
        + '/stop_areas/stop_area:SNCF:87471003'
        + '/departures?count=6&datetime_represents=departure',
      {
        headers: {
          Authorization: 'Basic ' + Buffer.from(key + ':').toString('base64')
        }
      }
    );

    var data = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=40');
    res.status(response.ok ? 200 : response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
