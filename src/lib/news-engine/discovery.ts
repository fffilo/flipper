import { fetchWithTimeout } from './http-client';
import type { FeedSourceConfig } from './types';

export async function discoverFeedFromUrl(url: string): Promise<FeedSourceConfig | null> {
  let target = url.trim();
  if (!target.startsWith('http')) {
    target = `https://${target}`;
  }

  try {
    const html = await fetchWithTimeout(target, 4000);
    if (!html) return null;

    // Busca <link rel="alternate" type="application/rss+xml" href="...">
    const match =
      html.match(/<link[^>]+type=["']application\/(rss\+xml|atom\+xml)["'][^>]+href=["']([^"']+)["']/i) ||
      html.match(/<link[^>]+href=["']([^"']+)["'][^>]+type=["']application\/(rss\+xml|atom\+xml)["']/i);

    let feedUrl = match ? (match[2] || match[1]) : null;

    // Se não encontrou no <link>, tenta caminhos padrão
    if (!feedUrl) {
      const parsedUrl = new URL(target);
      const testPaths = ['/feed', '/rss', '/feed.xml', '/rss.xml'];
      for (const p of testPaths) {
        const testUrl = `${parsedUrl.origin}${p}`;
        const testXml = await fetchWithTimeout(testUrl, 2500);
        if (testXml && (testXml.includes('<rss') || testXml.includes('<feed'))) {
          feedUrl = testUrl;
          break;
        }
      }
    }

    if (!feedUrl) return null;

    // Resolve URL relativa
    if (!feedUrl.startsWith('http')) {
      const baseUrl = new URL(target);
      feedUrl = new URL(feedUrl, baseUrl.origin).toString();
    }

    const domain = new URL(target).hostname.replace(/^www\./, '');
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const siteName = titleMatch ? titleMatch[1].split(/[-–|]/)[0].trim() : domain;

    return {
      id: domain.replace(/[^a-z0-9]/gi, '-').toLowerCase(),
      name: siteName,
      url: feedUrl,
      category: 'general',
      region: domain.endsWith('.br') ? 'br' : 'world',
      brandColor: '#29ABE2',
      enabled: true,
    };
  } catch {
    return null;
  }
}

export function getTopicSearchFeedUrl(topic: string, lang = 'pt-BR', gl = 'BR'): string {
  const query = encodeURIComponent(topic);
  return `https://news.google.com/rss/search?q=${query}&hl=${lang}&gl=${gl}&ceid=${gl}:${lang}`;
}
