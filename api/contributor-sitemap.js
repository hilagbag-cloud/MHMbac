const EDGE_URL = 'https://uxdfrnogiuefoqjpobpf.supabase.co/functions/v1/public-beta-contributor-profile';

export default async function handler(_req, res) {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');

  try {
    const upstream = await fetch(`${EDGE_URL}?asset=sitemap`, {
      headers: { Accept: 'application/xml, text/xml;q=0.9, */*;q=0.1' },
    });
    const xml = await upstream.text();
    if (!upstream.ok || !xml.trim().startsWith('<?xml')) {
      res.status(503).send('<?xml version="1.0" encoding="UTF-8"?><error>Temporary sitemap service issue</error>');
      return;
    }
    res.status(200).send(xml);
  } catch {
    res.status(503).send('<?xml version="1.0" encoding="UTF-8"?><error>Temporary sitemap service issue</error>');
  }
}
