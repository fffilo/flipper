import { parseStringPromise } from 'xml2js';
import type { CleanArticle, FeedSourceConfig } from './types';
import { getArticleUniqueId } from './hash';

const IMAGE_EXT_RE = /\.(jpe?g|png|webp|avif)(\?.*)?$/i;

export function cleanHtmlText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/(leia mais|veja mais|saiba mais|confira a matéria|foto:|crédito:|reprodução|assista ao vídeo)[\s\S]*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateSmart(text: string, maxChars = 220): string {
  if (text.length <= maxChars) return text;
  const sub = text.slice(0, maxChars);
  // Tenta cortar no último ponto final
  const lastDot = Math.max(sub.lastIndexOf('.'), sub.lastIndexOf('!'), sub.lastIndexOf('?'));
  if (lastDot > 120) {
    return sub.slice(0, lastDot + 1);
  }
  // Corta no último espaço
  const lastSpace = sub.lastIndexOf(' ');
  if (lastSpace > 100) {
    return `${sub.slice(0, lastSpace)}…`;
  }
  return `${sub}…`;
}

function normalizeString(val: any): string {
  if (!val) return '';
  if (Array.isArray(val)) return normalizeString(val[0]);
  if (typeof val === 'object' && val._) return String(val._).trim();
  return String(val).trim();
}

function upgradeImageUrl(rawUrl: any): string {
  const url = normalizeString(rawUrl);
  if (!url || url.includes('placehold.co')) return url;
  try {
    const u = new URL(url);
    const host = u.hostname;

    // BBC: troca /240/ por /1024/ para imagem Full HD
    if (host.includes('bbci.co.uk')) {
      return url.replace(/\/standard\/\d+\//, '/standard/1024/').replace(/\/ws\/\d+\//, '/ws/1024/');
    }

    // Globo / G1 CDN (glbimg.com): transforma /NNNxMMM/ em /940x/
    if (host.includes('glbimg.com')) {
      return url.replace(/\/\d+x\d*\//, '/940x/');
    }

    // WordPress Jetpack CDN (i0.wp.com, i1.wp.com...)
    if (/^i\d\.wp\.com$/.test(host)) {
      ['w', 'h', 'fit', 'resize', 'quality', 'strip'].forEach(p => u.searchParams.delete(p));
      return u.toString();
    }

    // Redutores padrão de CMS (-800x450.jpg -> .jpg)
    return url.replace(/(-\d{2,4}x\d{2,4})(\.[a-zA-Z]{2,5})(\?.*)?$/, '$2$3');
  } catch {
    return url;
  }
}

function extractImageFromHtml(html: string): string | null {
  if (!html) return null;
  // data-src / data-original
  const dataSrc = html.match(/<img[^>]+\bdata-(?:src|original|full)=["']([^"']+)["']/i)?.[1];
  if (dataSrc && dataSrc.startsWith('http')) return dataSrc;

  // src convencional
  const src = html.match(/<img[^>]+\bsrc=["']([^"']+)["']/i)?.[1];
  if (src && src.startsWith('http') && !src.includes('1x1') && !src.includes('pixel') && !src.includes('spacer')) {
    return src;
  }
  return null;
}

function getXmlFieldText(field: any): string {
  if (field == null) return '';
  if (Array.isArray(field)) {
    if (field.length === 0) return '';
    const first = field[0];
    if (typeof first === 'string') return first.trim();
    if (typeof first === 'object' && typeof first._ === 'string') return first._.trim();
    return String(first).trim();
  }
  if (typeof field === 'object' && typeof field._ === 'string') return field._.trim();
  if (typeof field === 'string') return field.trim();
  return String(field).trim();
}

export async function parseFeed(xml: string, source: FeedSourceConfig): Promise<CleanArticle[]> {
  const parsed = await parseStringPromise(xml, { explicitArray: true, mergeAttrs: true });

  let rawItems: any[] = [];

  // RSS 2.0
  if (parsed.rss?.channel?.[0]?.item) {
    rawItems = parsed.rss.channel[0].item;
  }
  // Atom 1.0
  else if (parsed.feed?.entry) {
    rawItems = parsed.feed.entry;
  }
  // RDF / RSS 1.0
  else if (parsed['rdf:RDF']?.item) {
    rawItems = parsed['rdf:RDF'].item;
  }

  const articles: CleanArticle[] = [];

  for (let idx = 0; idx < rawItems.length; idx++) {
    const item = rawItems[idx];
    const title = cleanHtmlText(getXmlFieldText(item.title) || getXmlFieldText(item['dc:title']));
    if (!title || title.length < 10) continue;

    // Link original
    let originalUrl = '';
    if (item.link) {
      if (typeof item.link === 'string') originalUrl = item.link.trim();
      else if (Array.isArray(item.link)) {
        const first = item.link[0];
        if (typeof first === 'string') originalUrl = first.trim();
        else if (first?.href) originalUrl = first.href.trim();
      } else if (item.link?.href) {
        originalUrl = item.link.href.trim();
      }
    }
    if (!originalUrl && item.guid) {
      const g = getXmlFieldText(item.guid);
      if (g.startsWith('http')) originalUrl = g;
    }
    if (!originalUrl || !originalUrl.startsWith('http')) continue;

    // Descrição e Resumo
    const rawDesc = getXmlFieldText(item.description) || getXmlFieldText(item.summary) || '';
    const rawContent = getXmlFieldText(item['content:encoded']) || getXmlFieldText(item.content) || '';
    const subtitle = getXmlFieldText(item['atom:subtitle']);

    const fullCleanText = cleanHtmlText(subtitle || rawDesc || rawContent);
    const summary = truncateSmart(fullCleanText || title, 220);

    // Cascata de Imagens
    let imageUrl = '';

    // 1. <media:content>
    const mediaContent = item['media:content'] || item['media:group']?.[0]?.['media:content'];
    if (mediaContent) {
      const list = Array.isArray(mediaContent) ? mediaContent : [mediaContent];
      const match = list.find((m: any) => m?.url && (!m.type || m.type.startsWith('image') || m.medium === 'image'));
      if (match?.url) imageUrl = match.url;
    }

    // 2. <media:thumbnail>
    if (!imageUrl) {
      const mediaThumb = item['media:thumbnail'] || item['media:group']?.[0]?.['media:thumbnail'];
      if (mediaThumb) {
        const list = Array.isArray(mediaThumb) ? mediaThumb : [mediaThumb];
        if (list[0]?.url) imageUrl = list[0].url;
      }
    }

    // 3. <imagem-destaque> (Agência Brasil / EBC)
    if (!imageUrl && item['imagem-destaque']) {
      const img = getXmlFieldText(item['imagem-destaque']);
      if (img.startsWith('http')) imageUrl = img;
    }

    // 4. <enclosure>
    if (!imageUrl && item.enclosure) {
      const list = Array.isArray(item.enclosure) ? item.enclosure : [item.enclosure];
      const match = list.find((e: any) => e?.url && (e.type?.startsWith('image') || IMAGE_EXT_RE.test(e.url)));
      if (match?.url) imageUrl = match.url;
    }

    // 5. HTML embutido em content ou description
    if (!imageUrl) {
      imageUrl = extractImageFromHtml(rawContent) || extractImageFromHtml(rawDesc) || '';
    }

    // Se achou imagem, dá upgrade de resolução
    const finalImageUrl = normalizeString(imageUrl ? upgradeImageUrl(imageUrl) : '');

    // Data de publicação
    let publishedAt = new Date().toISOString();
    const rawDate = getXmlFieldText(item.pubDate) || getXmlFieldText(item.published) || getXmlFieldText(item['dc:date']);
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        publishedAt = d.toISOString();
      }
    }

    const articleId = getArticleUniqueId(originalUrl, title);

    articles.push({
      id: articleId,
      title,
      summary,
      description: summary,
      imageUrl: finalImageUrl,
      originalUrl,
      sourceName: source.name,
      brandColor: source.brandColor,
      source: {
        id: source.id,
        name: source.name,
        slug: source.id,
        brandColor: source.brandColor,
      },
      publishedAt,
      category: source.category,
      region: source.region,
    });
  }

  return articles;
}
