import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SITE_URL = 'https://bacpilot.site';
const PROFILE_PATH = '/contributeurs-beta';
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type PublicProfile = {
  public_slug: string;
  public_name: string;
  public_bio: string;
  focus_areas: string[];
  photo_path: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  contribution_level: string;
  published_at: string | null;
  public_updated_at: string | null;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[character] || character));
}

function escapeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function htmlHeaders(noindex = false) {
  return {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': noindex ? 'public, max-age=300, s-maxage=300' : 'public, max-age=300, s-maxage=600',
    'X-Robots-Tag': noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' https: data:; style-src 'unsafe-inline'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  };
}

function unavailablePage(status: 404 | 410, title: string, message: string) {
  return new Response(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(title)} | BacPilot</title><style>body{margin:0;background:#f8fafc;color:#0f172a;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{max-width:720px;margin:12vh auto;padding:24px}.box{background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:32px;box-shadow:0 16px 40px rgba(15,23,42,.08)}a{color:#e11d48;font-weight:800;text-decoration:none}</style></head><body><main class="shell"><section class="box"><p style="font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#e11d48;font-size:12px">Communauté BacPilot</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p><p><a href="${PROFILE_PATH}">Découvrir les contributeurs bêta BacPilot</a></p></section></main></body></html>`, { status, headers: htmlHeaders(true) });
}

function jsonResult(status: number, body: unknown, noindex = false) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': noindex ? 'noindex, nofollow' : 'noindex, nofollow',
    },
  });
}

function levelDescription(level: string) {
  if (level === 'Pionnier bêta') return 'Une contribution durable aux améliorations de BacPilot.';
  if (level === 'Contributeur actif') return 'Une participation régulière aux tests et retours de la communauté.';
  if (level === 'Explorateur engagé') return 'Des retours utiles pour rendre BacPilot plus clair et plus fiable.';
  return 'Une participation volontaire aux premiers tests de la communauté BacPilot.';
}

function xmlEscape(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&apos;',
    '"': '&quot;',
  }[character] || character));
}

function contributorSitemap(rows: Array<{ public_slug: string; public_updated_at: string | null }>, method: string) {
  const urls = rows.map((row) => {
    const loc = `${SITE_URL}${PROFILE_PATH}/${encodeURIComponent(row.public_slug)}`;
    const lastmod = row.public_updated_at ? `<lastmod>${new Date(row.public_updated_at).toISOString().slice(0, 10)}</lastmod>` : '';
    return `<url><loc>${xmlEscape(loc)}</loc>${lastmod}</url>`;
  }).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  return new Response(method === 'HEAD' ? null : xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=600',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'index, follow',
    },
  });
}

function profilePage(profile: PublicProfile) {
  const canonical = `${SITE_URL}${PROFILE_PATH}/${encodeURIComponent(profile.public_slug)}`;
  const title = `${profile.public_name} — contributeur bêta BacPilot`;
  const description = `${profile.public_name} contribue volontairement aux tests et retours d’amélioration de BacPilot, initiative d’orientation post-bac au Bénin.`;
  const photoUrl = profile.photo_path ? `${canonical}/photo` : null;
  const sameAs = [profile.portfolio_url, profile.linkedin_url].filter((url): url is string => Boolean(url));
  const person: Record<string, unknown> = {
    '@type': 'Person',
    '@id': `${canonical}#person`,
    name: profile.public_name,
    description: profile.public_bio,
    url: canonical,
    worksFor: { '@type': 'Organization', name: 'MHM SOLUTIONS', url: SITE_URL },
  };
  if (photoUrl) person.image = photoUrl;
  if (sameAs.length) person.sameAs = sameAs;

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${canonical}#profile`,
        url: canonical,
        name: title,
        dateCreated: profile.published_at || undefined,
        dateModified: profile.public_updated_at || profile.published_at || undefined,
        mainEntity: person,
        isPartOf: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Contributeurs bêta', item: `${SITE_URL}${PROFILE_PATH}` },
          { '@type': 'ListItem', position: 3, name: profile.public_name, item: canonical },
        ],
      },
    ],
  };

  const focusAreas = profile.focus_areas
    .map((area) => `<li>${escapeHtml(area)}</li>`)
    .join('');
  const externalLinks = [
    profile.portfolio_url ? `<a href="${escapeHtml(profile.portfolio_url)}" rel="me noopener noreferrer" target="_blank">Voir son portfolio</a>` : '',
    profile.linkedin_url ? `<a href="${escapeHtml(profile.linkedin_url)}" rel="me noopener noreferrer" target="_blank">Profil LinkedIn</a>` : '',
  ].filter(Boolean).join('');
  const portrait = photoUrl
    ? `<img class="portrait" src="${escapeHtml(photoUrl)}" alt="Photo de ${escapeHtml(profile.public_name)}" width="240" height="240">`
    : `<div class="portrait placeholder" aria-hidden="true">${escapeHtml(profile.public_name.slice(0, 1).toLocaleUpperCase())}</div>`;

  return new Response(`<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} | BacPilot</title>
<meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="profile"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}">
${photoUrl ? `<meta property="og:image" content="${escapeHtml(photoUrl)}">` : ''}
<script type="application/ld+json">${escapeJsonLd(schema)}</script>
<style>
:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f8fafc;color:#0f172a;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.6}.top{background:#0f172a;color:#fff}.nav{max-width:1120px;margin:0 auto;padding:18px 24px;display:flex;justify-content:space-between;gap:20px;align-items:center}.brand{color:#fff;text-decoration:none;font-weight:900;letter-spacing:-.03em;font-size:20px}.brand small{display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#fda4af}.back{color:#fecdd3;text-decoration:none;font-weight:800;font-size:14px}.wrap{max-width:960px;margin:0 auto;padding:56px 24px 80px}.crumb{color:#64748b;font-size:14px}.crumb a{color:#e11d48;text-decoration:none;font-weight:800}.card{margin-top:22px;border:1px solid #e2e8f0;background:#fff;border-radius:32px;padding:32px;box-shadow:0 18px 45px rgba(15,23,42,.08)}.hero{display:grid;grid-template-columns:168px minmax(0,1fr);gap:28px;align-items:center}.portrait{width:168px;height:168px;border-radius:28px;object-fit:cover;background:#0f172a}.placeholder{display:grid;place-items:center;color:#fff;font-size:64px;font-weight:900;background:linear-gradient(135deg,#fb7185,#c026d3)}.eyebrow{margin:0;color:#e11d48;text-transform:uppercase;font-size:12px;letter-spacing:.14em;font-weight:900}.level{display:inline-block;margin-top:10px;border-radius:999px;padding:5px 10px;background:#fff1f2;color:#be123c;font-size:13px;font-weight:800}h1{font-size:clamp(34px,6vw,58px);line-height:1.04;letter-spacing:-.05em;margin:8px 0 0}.intro{max-width:730px;margin:34px 0 0;font-size:18px;color:#334155}.section{margin-top:32px;padding-top:28px;border-top:1px solid #e2e8f0}.section h2{margin:0;font-size:20px;letter-spacing:-.02em}.section p{margin:10px 0 0;color:#475569}.chips{display:flex;flex-wrap:wrap;gap:9px;margin:14px 0 0;padding:0;list-style:none}.chips li{background:#f1f5f9;color:#334155;border-radius:999px;padding:6px 11px;font-size:13px;font-weight:700}.links{display:flex;flex-wrap:wrap;gap:12px;margin-top:14px}.links a{border-radius:12px;padding:10px 14px;background:#fff1f2;color:#be123c;text-decoration:none;font-weight:850;font-size:14px}.note{margin-top:32px;border-radius:18px;background:#f8fafc;padding:18px;color:#475569;font-size:14px}.foot{margin-top:28px;color:#64748b;font-size:13px}.foot a{color:#e11d48;font-weight:800;text-decoration:none}@media (max-width:640px){.wrap{padding:38px 16px 56px}.nav{padding:16px}.card{padding:24px;border-radius:24px}.hero{grid-template-columns:1fr}.portrait{width:96px;height:96px;border-radius:20px}.placeholder{font-size:38px}h1{font-size:38px}}
</style></head>
<body><header class="top"><nav class="nav"><a class="brand" href="${SITE_URL}">BacPilot<small>par MHM SOLUTIONS</small></a><a class="back" href="${SITE_URL}${PROFILE_PATH}">← Communauté bêta</a></nav></header>
<main class="wrap"><nav class="crumb" aria-label="Fil d’Ariane"><a href="${SITE_URL}">Accueil</a> / <a href="${SITE_URL}${PROFILE_PATH}">Contributeurs bêta</a> / ${escapeHtml(profile.public_name)}</nav>
<article class="card"><header class="hero">${portrait}<div><p class="eyebrow">Contributeur ou contributrice bêta BacPilot</p><h1>${escapeHtml(profile.public_name)}</h1><span class="level">${escapeHtml(profile.contribution_level)}</span><p class="intro">${escapeHtml(levelDescription(profile.contribution_level))}</p></div></header>
<section class="section"><h2>Une contribution volontaire à BacPilot</h2><p>${escapeHtml(profile.public_bio)}</p></section>
${focusAreas ? `<section class="section"><h2>Centres d’intérêt partagés</h2><ul class="chips">${focusAreas}</ul></section>` : ''}
${externalLinks ? `<section class="section"><h2>Présences choisies</h2><div class="links">${externalLinks}</div></section>` : ''}
<aside class="note">Cette fiche est publiée à la demande de son auteur. Elle reconnaît une participation à l’amélioration de BacPilot ; elle ne constitue ni une note scolaire, ni une attestation académique, ni une garantie d’admission ou de bourse.</aside>
</article><footer class="foot">BacPilot est une initiative de <a href="${SITE_URL}/about">MHM SOLUTIONS</a> pour aider à comprendre les possibilités d’orientation après le bac au Bénin.</footer></main></body></html>`, { headers: htmlHeaders() });
}

Deno.serve(async (request) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Méthode non autorisée.', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }

  const url = new URL(request.url);
  const asset = url.searchParams.get('asset');
  const requestedFormat = url.searchParams.get('format');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return new Response('Configuration serveur indisponible.', { status: 500, headers: { 'Cache-Control': 'no-store' } });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  if (asset === 'sitemap') {
    const sitemapRows = await admin.rpc('list_public_beta_contributor_sitemap', { p_limit: 250 });
    if (sitemapRows.error) return new Response('Sitemap indisponible.', { status: 500, headers: { 'Cache-Control': 'no-store' } });
    const safeRows = (Array.isArray(sitemapRows.data) ? sitemapRows.data : []).flatMap((row) => {
      if (typeof row.public_slug !== 'string' || !SLUG_PATTERN.test(row.public_slug)) return [];
      return [{ public_slug: row.public_slug, public_updated_at: typeof row.public_updated_at === 'string' ? row.public_updated_at : null }];
    });
    return contributorSitemap(safeRows, request.method);
  }

  const slug = (url.searchParams.get('slug') || '').trim().toLocaleLowerCase();
  if (!SLUG_PATTERN.test(slug)) {
    return requestedFormat === 'json'
      ? jsonResult(404, { error: { status: 404, message: 'Profil introuvable.' } }, true)
      : unavailablePage(404, 'Profil introuvable', 'Cette fiche contributeur n’existe pas ou n’est pas disponible publiquement.');
  }

  const { data, error } = await admin.rpc('get_public_beta_contributor_by_slug', { p_slug: slug });
  if (error) {
    return requestedFormat === 'json'
      ? jsonResult(404, { error: { status: 404, message: 'Profil indisponible.' } }, true)
      : unavailablePage(404, 'Profil indisponible', 'Cette fiche ne peut pas être affichée pour le moment.');
  }
  const profile = Array.isArray(data) ? data[0] as PublicProfile | undefined : undefined;

  if (!profile) {
    const withdrawn = await admin.rpc('get_withdrawn_beta_contributor_slug', { p_slug: slug });
    if (withdrawn.data === true) {
      return requestedFormat === 'json'
        ? jsonResult(410, { error: { status: 410, message: 'Cette personne a retiré volontairement sa fiche publique.' } }, true)
        : unavailablePage(410, 'Profil retiré', 'Cette personne a retiré volontairement sa fiche publique.');
    }
    return requestedFormat === 'json'
      ? jsonResult(404, { error: { status: 404, message: 'Profil introuvable.' } }, true)
      : unavailablePage(404, 'Profil introuvable', 'Cette fiche contributeur n’existe pas ou n’est pas disponible publiquement.');
  }

  if (requestedFormat === 'json') {
    const { photo_path: _privatePhotoPath, ...safeProfile } = profile;
    return jsonResult(200, {
      profile: {
        ...safeProfile,
        photo_url: profile.photo_path ? `${SITE_URL}${PROFILE_PATH}/${encodeURIComponent(profile.public_slug)}/photo` : null,
      },
    });
  }

  if (asset === 'photo') {
    if (!profile.photo_path) return unavailablePage(404, 'Photo indisponible', 'Aucune photo publique n’est disponible pour cette fiche.');
    const file = await admin.storage.from('beta-contributor-photos').download(profile.photo_path);
    if (file.error || !file.data) return unavailablePage(404, 'Photo indisponible', 'Aucune photo publique n’est disponible pour cette fiche.');
    return new Response(request.method === 'HEAD' ? null : file.data, {
      headers: {
        'Content-Type': file.data.type || 'application/octet-stream',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'index, follow',
      },
    });
  }

  if (request.method === 'HEAD') return new Response(null, { headers: htmlHeaders() });
  return profilePage(profile);
});
