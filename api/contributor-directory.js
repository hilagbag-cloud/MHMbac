const SITE_URL = 'https://bacpilot.site';
const PROFILE_PATH = '/contributeurs-beta';
const EDGE_URL = 'https://uxdfrnogiuefoqjpobpf.supabase.co/functions/v1/public-beta-contributor-profile';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character] || character));
}

function excerpt(value, length = 170) {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= length) return normalized;
  const cut = normalized.lastIndexOf(' ', length - 1);
  return `${normalized.slice(0, cut > 80 ? cut : length).trim()}…`;
}

function page(contributors) {
  const itemList = contributors.map((contributor, index) => ({
    '@type': 'ListItem', position: index + 1,
    url: `${SITE_URL}${PROFILE_PATH}/${encodeURIComponent(contributor.public_slug)}`,
    name: contributor.public_name,
  }));
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': `${SITE_URL}${PROFILE_PATH}#collection`, url: `${SITE_URL}${PROFILE_PATH}`, name: 'Contributeurs bêta BacPilot', description: 'Des volontaires qui testent BacPilot et contribuent à son amélioration.', mainEntity: { '@type': 'ItemList', itemListElement: itemList }, isPartOf: { '@id': `${SITE_URL}/#website` } },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL }, { '@type': 'ListItem', position: 2, name: 'Contributeurs bêta', item: `${SITE_URL}${PROFILE_PATH}` }] },
    ],
  }).replace(/</g, '\\u003c');
  const cards = contributors.length ? contributors.map((contributor) => {
    const href = `${PROFILE_PATH}/${encodeURIComponent(contributor.public_slug)}`;
    const focus = Array.isArray(contributor.focus_areas) ? contributor.focus_areas.map((area) => `<li>${escapeHtml(area)}</li>`).join('') : '';
    return `<article class="card"><p class="eyebrow">${escapeHtml(contributor.contribution_level || 'Contributeur bêta')}</p><h2><a href="${href}">${escapeHtml(contributor.public_name)}</a></h2><p>${escapeHtml(excerpt(contributor.public_bio))}</p>${focus ? `<ul class="chips">${focus}</ul>` : ''}<a class="profile" href="${href}">Découvrir la fiche de ${escapeHtml(contributor.public_name)}</a></article>`;
  }).join('') : `<section class="empty"><h2>La reconnaissance commence avec les premiers volontaires.</h2><p>Les fiches individuelles seront proposées ici dès que leurs auteurs auront choisi de les publier et de les rendre visibles dans les moteurs de recherche.</p></section>`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Contributeurs bêta BacPilot — communauté et reconnaissance</title><meta name="description" content="Découvrez les contributeurs volontaires qui testent BacPilot et participent à l’amélioration de l’orientation post-bac au Bénin."><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${SITE_URL}${PROFILE_PATH}"><meta property="og:type" content="website"><meta property="og:title" content="Contributeurs bêta BacPilot"><meta property="og:description" content="Une communauté volontaire qui contribue à améliorer BacPilot."><meta property="og:url" content="${SITE_URL}${PROFILE_PATH}"><script type="application/ld+json">${schema}</script><style>:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f8fafc;color:#0f172a;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.6}.top{background:#0f172a;color:#fff}.nav{max-width:1120px;margin:0 auto;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px}.brand{color:#fff;text-decoration:none;font-weight:900;letter-spacing:-.03em;font-size:20px}.brand small{display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#fda4af}.beta{color:#fecdd3;text-decoration:none;font-weight:800;font-size:14px}.wrap{max-width:1120px;margin:0 auto;padding:56px 24px 80px}.eyebrow{margin:0;color:#e11d48;font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.hero{max-width:760px}.hero h1{margin:8px 0 0;font-size:clamp(38px,6vw,64px);line-height:1.03;letter-spacing:-.055em}.hero p{margin:18px 0 0;color:#475569;font-size:18px}.grid{display:grid;gap:18px;grid-template-columns:repeat(3,minmax(0,1fr));margin-top:42px}.card,.empty{background:#fff;border:1px solid #e2e8f0;border-radius:26px;padding:25px;box-shadow:0 12px 30px rgba(15,23,42,.06)}.card h2{margin:8px 0;font-size:25px;line-height:1.12;letter-spacing:-.03em}.card h2 a{color:#0f172a;text-decoration:none}.card p{margin:0;color:#475569}.chips{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0;padding:0;list-style:none}.chips li{padding:5px 10px;border-radius:999px;background:#f1f5f9;font-size:12px;font-weight:750;color:#334155}.profile{display:inline-block;margin-top:6px;color:#e11d48;text-decoration:none;font-size:14px;font-weight:900}.empty{max-width:700px;margin-top:42px}.foot{margin-top:46px;color:#64748b;font-size:13px}.foot a{color:#e11d48;text-decoration:none;font-weight:800}@media(max-width:850px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.nav,.wrap{padding-left:16px;padding-right:16px}.grid{grid-template-columns:1fr}.hero h1{font-size:42px}}</style></head><body><header class="top"><nav class="nav"><a class="brand" href="${SITE_URL}">BacPilot<small>par MHM SOLUTIONS</small></a><a class="beta" href="${SITE_URL}/beta">Espace bêta</a></nav></header><main class="wrap"><section class="hero"><p class="eyebrow">Communauté BacPilot</p><h1>Les contributeurs bêta qui font avancer BacPilot.</h1><p>Des volontaires qui testent les parcours, partagent des retours utiles et participent à rendre l’orientation post-bac plus claire. Chaque fiche est publiée selon le choix de son auteur.</p></section><section class="grid" aria-label="Fiches de contributeurs bêta">${cards}</section><footer class="foot">BacPilot est une initiative de <a href="${SITE_URL}/about">MHM SOLUTIONS</a> pour mieux comprendre les possibilités d’orientation après le bac au Bénin.</footer></main></body></html>`;
}

export default async function handler(_req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'index, follow, max-image-preview:large');
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'unsafe-inline'; base-uri 'self'; frame-ancestors 'none'");
  try {
    const upstream = await fetch(`${EDGE_URL}?asset=directory`, { headers: { Accept: 'application/json' } });
    const payload = await upstream.json().catch(() => null);
    const contributors = upstream.ok && Array.isArray(payload?.contributors) ? payload.contributors : [];
    res.status(200).send(page(contributors));
  } catch {
    res.status(503).send(page([]));
  }
}
