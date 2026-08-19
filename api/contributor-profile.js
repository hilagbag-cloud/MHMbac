const SITE_URL = 'https://bacpilot.site';
const PROFILE_PATH = '/contributeurs-beta';
const EDGE_URL = 'https://uxdfrnogiuefoqjpobpf.supabase.co/functions/v1/public-beta-contributor-profile';
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character] || character));
}

function excerpt(value, length = 155) {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= length) return normalized;
  const boundary = normalized.lastIndexOf(' ', length - 1);
  return `${normalized.slice(0, boundary > 80 ? boundary : length).trim()}…`;
}

function htmlShell(title, content) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)} | BacPilot</title><meta name="robots" content="noindex,nofollow"><style>body{margin:0;background:#f8fafc;color:#0f172a;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.6}.shell{max-width:720px;margin:12vh auto;padding:24px}.box{background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:32px;box-shadow:0 16px 40px rgba(15,23,42,.08)}a{color:#e11d48;font-weight:800;text-decoration:none}</style></head><body><main class="shell">${content}</main></body></html>`;
}

function unavailablePage(title, message) {
  return htmlShell(title, `<section class="box"><p style="font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#e11d48;font-size:12px">Communauté BacPilot</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p><p><a href="${PROFILE_PATH}">Découvrir les contributeurs bêta BacPilot</a></p></section>`);
}

function profilePage(profile) {
  const canonical = `${SITE_URL}${PROFILE_PATH}/${encodeURIComponent(profile.public_slug)}`;
  const seoEligible = profile.seo_eligible === true;
  const title = `${profile.public_name} — contributeur bêta BacPilot`;
  const description = excerpt(`${profile.public_name}, ${profile.contribution_level || 'contributeur bêta'}. ${profile.public_bio || ''}`);
  const focusAreas = Array.isArray(profile.focus_areas) ? profile.focus_areas.map((area) => `<li>${escapeHtml(area)}</li>`).join('') : '';
  const sameAs = [profile.portfolio_url, profile.linkedin_url].filter(Boolean);
  const links = [
    profile.portfolio_url ? `<a href="${escapeHtml(profile.portfolio_url)}" rel="me noopener noreferrer" target="_blank">Voir son portfolio</a>` : '',
    profile.linkedin_url ? `<a href="${escapeHtml(profile.linkedin_url)}" rel="me noopener noreferrer" target="_blank">Profil LinkedIn</a>` : '',
  ].filter(Boolean).join('');
  const photoUrl = profile.photo_url || null;
  const portrait = photoUrl
    ? `<img class="portrait" src="${escapeHtml(photoUrl)}" alt="Photo de ${escapeHtml(profile.public_name)}" width="240" height="240">`
    : `<div class="portrait placeholder" aria-hidden="true">${escapeHtml(profile.public_name.slice(0, 1).toLocaleUpperCase())}</div>`;
  const schema = seoEligible ? JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage', '@id': `${canonical}#profile`, url: canonical, name: title,
        dateCreated: profile.published_at || undefined,
        dateModified: profile.public_updated_at || profile.published_at || undefined,
        mainEntity: {
          '@type': 'Person', '@id': `${canonical}#person`, name: profile.public_name,
          alternateName: profile.public_slug, identifier: `bacpilot:${profile.public_slug}`,
          description: profile.public_bio, url: canonical,
          worksFor: { '@type': 'Organization', name: 'MHM SOLUTIONS', url: SITE_URL },
          ...(photoUrl ? { image: photoUrl } : {}),
          ...(sameAs.length ? { sameAs } : {}),
        },
        isPartOf: { '@id': `${SITE_URL}/#organization` },
      },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Contributeurs bêta', item: `${SITE_URL}${PROFILE_PATH}` },
        { '@type': 'ListItem', position: 3, name: profile.public_name, item: canonical },
      ] },
    ],
  }).replace(/</g, '\\u003c') : '';
  const qualityNote = seoEligible
    ? ''
    : '<p class="pending">Cette fiche reste partageable. Son auteur peut enrichir sa présentation et ses domaines d’intérêt pour demander son ajout aux résultats de recherche.</p>';

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)} | BacPilot</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="${seoEligible ? 'index,follow,max-image-preview:large' : 'noindex,nofollow'}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="profile"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}">${photoUrl ? `<meta property="og:image" content="${escapeHtml(photoUrl)}">` : ''}${schema ? `<script type="application/ld+json">${schema}</script>` : ''}<style>:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f8fafc;color:#0f172a;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.6}.top{background:#0f172a;color:#fff}.nav{max-width:1120px;margin:0 auto;padding:18px 24px;display:flex;justify-content:space-between;gap:20px;align-items:center}.brand{color:#fff;text-decoration:none;font-weight:900;letter-spacing:-.03em;font-size:20px}.brand small{display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#fda4af}.back{color:#fecdd3;text-decoration:none;font-weight:800;font-size:14px}.wrap{max-width:960px;margin:0 auto;padding:56px 24px 80px}.crumb{color:#64748b;font-size:14px}.crumb a{color:#e11d48;text-decoration:none;font-weight:800}.card{margin-top:22px;border:1px solid #e2e8f0;background:#fff;border-radius:32px;padding:32px;box-shadow:0 18px 45px rgba(15,23,42,.08)}.hero{display:grid;grid-template-columns:168px minmax(0,1fr);gap:28px;align-items:center}.portrait{width:168px;height:168px;border-radius:28px;object-fit:cover;background:#0f172a}.placeholder{display:grid;place-items:center;color:#fff;font-size:64px;font-weight:900;background:linear-gradient(135deg,#fb7185,#c026d3)}.eyebrow{margin:0;color:#e11d48;text-transform:uppercase;font-size:12px;letter-spacing:.14em;font-weight:900}.level{display:inline-block;margin-top:10px;border-radius:999px;padding:5px 10px;background:#fff1f2;color:#be123c;font-size:13px;font-weight:800}h1{font-size:clamp(34px,6vw,58px);line-height:1.04;letter-spacing:-.05em;margin:8px 0 0}.intro{max-width:730px;margin:18px 0 0;font-size:18px;color:#334155}.section{margin-top:32px;padding-top:28px;border-top:1px solid #e2e8f0}.section h2{margin:0;font-size:20px;letter-spacing:-.02em}.section p{margin:10px 0 0;color:#475569}.chips{display:flex;flex-wrap:wrap;gap:9px;margin:14px 0 0;padding:0;list-style:none}.chips li{background:#f1f5f9;color:#334155;border-radius:999px;padding:6px 11px;font-size:13px;font-weight:700}.links{display:flex;flex-wrap:wrap;gap:12px;margin-top:14px}.links a{border-radius:12px;padding:10px 14px;background:#fff1f2;color:#be123c;text-decoration:none;font-weight:850;font-size:14px}.note{margin-top:32px;border-radius:18px;background:#f8fafc;padding:18px;color:#475569;font-size:14px}.pending{margin:22px 0 0;border-radius:16px;padding:13px 15px;background:#fff7ed;color:#9a3412;font-size:14px}.foot{margin-top:28px;color:#64748b;font-size:13px}.foot a{color:#e11d48;font-weight:800;text-decoration:none}@media (max-width:640px){.wrap{padding:38px 16px 56px}.nav{padding:16px}.card{padding:24px;border-radius:24px}.hero{grid-template-columns:1fr}.portrait{width:96px;height:96px;border-radius:20px}.placeholder{font-size:38px}h1{font-size:38px}}</style></head><body><header class="top"><nav class="nav"><a class="brand" href="${SITE_URL}">BacPilot<small>par MHM SOLUTIONS</small></a><a class="back" href="${SITE_URL}${PROFILE_PATH}">← Communauté bêta</a></nav></header><main class="wrap"><nav class="crumb" aria-label="Fil d’Ariane"><a href="${SITE_URL}">Accueil</a> / <a href="${SITE_URL}${PROFILE_PATH}">Contributeurs bêta</a> / ${escapeHtml(profile.public_name)}</nav><article class="card"><header class="hero">${portrait}<div><p class="eyebrow">Contributeur ou contributrice bêta BacPilot</p><h1>${escapeHtml(profile.public_name)}</h1><span class="level">${escapeHtml(profile.contribution_level || 'Contributeur bêta')}</span><p class="intro">${escapeHtml(profile.contribution_highlight || 'Participe volontairement aux tests et améliorations de BacPilot.')}</p></div></header><section class="section"><h2>Une contribution volontaire à BacPilot</h2><p>${escapeHtml(profile.public_bio)}</p></section>${focusAreas ? `<section class="section"><h2>Centres d’intérêt partagés</h2><ul class="chips">${focusAreas}</ul></section>` : ''}${links ? `<section class="section"><h2>Présences choisies</h2><div class="links">${links}</div></section>` : ''}${qualityNote}<aside class="note">Cette fiche est publiée à la demande de son auteur. Elle reconnaît une participation à l’amélioration de BacPilot ; elle ne constitue ni une note scolaire, ni une attestation académique, ni une garantie d’admission ou de bourse.</aside></article><footer class="foot">BacPilot est une initiative de <a href="${SITE_URL}/about">MHM SOLUTIONS</a> pour aider à comprendre les possibilités d’orientation après le bac au Bénin.</footer></main></body></html>`;
}

export default async function handler(req, res) {
  const rawSlug = Array.isArray(req.query?.slug) ? req.query.slug[0] : req.query?.slug;
  const slug = typeof rawSlug === 'string' ? rawSlug.trim().toLocaleLowerCase() : '';
  const noIndex = () => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  };
  const html = (indexable) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Robots-Tag', indexable ? 'index, follow, max-image-preview:large' : 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' https: data:; style-src 'unsafe-inline'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
  };

  if (!SLUG_PATTERN.test(slug)) {
    noIndex();
    res.status(404).send(unavailablePage('Profil introuvable', 'Cette fiche contributeur n’existe pas ou n’est pas disponible publiquement.'));
    return;
  }

  try {
    const upstream = await fetch(`${EDGE_URL}?slug=${encodeURIComponent(slug)}&format=json`, { headers: { Accept: 'application/json' } });
    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok || !payload?.profile) {
      const status = payload?.error?.status === 410 ? 410 : 404;
      noIndex();
      res.status(status).send(unavailablePage(status === 410 ? 'Profil retiré' : 'Profil introuvable', payload?.error?.message || 'Cette fiche contributeur n’est pas disponible publiquement.'));
      return;
    }
    html(payload.profile.seo_eligible === true);
    res.status(200).send(profilePage(payload.profile));
  } catch {
    noIndex();
    res.status(503).send(unavailablePage('Profil momentanément indisponible', 'Cette fiche ne peut pas être affichée pour le moment.'));
  }
}
