// Shared helper : fetch STAR API with one automatic retry on 429
async function starFetch(url) {
  var res = await fetch(url);
  if (res.status === 429) {
    await new Promise(function(r) { setTimeout(r, 1200); });
    res = await fetch(url);
  }
  return res;
}

module.exports = starFetch;
