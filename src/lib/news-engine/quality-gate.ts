import type { CleanArticle } from './types';

const MAX_AGE_HOURS = 72; // Notícias com mais de 72h (3 dias) são descartadas
const BAD_IMAGE_PATTERNS = /(favicon|tracking|pixel|1x1|16x16|32x32|spacer\.gif|blank\.gif)/i;

const STOPWORDS = new Set([
  'de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'com', 'nao', 'uma',
  'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao',
  'ele', 'das', 'tem', 'a', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'ha',
  'nos', 'ja', 'esta', 'eu', 'tambem', 'so', 'pelo', 'pela', 'ate', 'isso', 'ela',
  'entre', 'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'quem', 'nas',
  'me', 'esse', 'eles', 'estao', 'voce', 'tinha', 'foram', 'essa', 'num', 'nem',
  'the', 'and', 'to', 'of', 'in', 'is', 'for', 'on', 'with', 'at', 'by', 'from'
]);

function getBigrams(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));

  const bigrams = new Set<string>();
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.add(`${words[i]}_${words[i + 1]}`);
  }
  return bigrams;
}

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function formatRelativeTime(dateString: string): string {
  try {
    const then = new Date(dateString).getTime();
    const now = Date.now();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'agora mesmo';
    if (diffMin < 60) return `há ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `há ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'ontem';
    return `há ${diffDays} d`;
  } catch {
    return '';
  }
}

export function getDayBucket(dateString: string): 'today' | 'yesterday' | 'older' {
  try {
    const then = new Date(dateString).getTime();
    const now = Date.now();
    const diffMs = now - then;
    const oneDay = 24 * 60 * 60 * 1000;

    if (diffMs <= oneDay) return 'today';
    if (diffMs <= 2 * oneDay) return 'yesterday';
    return 'older';
  } catch {
    return 'older';
  }
}

export function applyQualityGates(articles: CleanArticle[]): CleanArticle[] {
  const now = Date.now();
  const maxAgeMs = MAX_AGE_HOURS * 60 * 60 * 1000;

  // 1. Quality Gate: Frescor e Imagem Válida
  const valid = articles.filter(a => {
    // Rejeita notícias sem imagem válida
    if (!a.imageUrl || BAD_IMAGE_PATTERNS.test(a.imageUrl)) return false;

    // Rejeita notícias com mais de 72h
    const pubTime = new Date(a.publishedAt).getTime();
    if (isNaN(pubTime) || now - pubTime > maxAgeMs) return false;

    // Rejeita títulos muito curtos
    if (!a.title || a.title.length < 15) return false;

    return true;
  });

  // 2. Deduplicação Fuzzy (Jaccard Bigrams > 0.38)
  const deduped: CleanArticle[] = [];

  for (const current of valid) {
    const currentBigrams = getBigrams(current.title);
    let isDuplicate = false;

    for (const existing of deduped) {
      const existingBigrams = getBigrams(existing.title);
      const similarity = jaccardSimilarity(currentBigrams, existingBigrams);

      if (similarity > 0.38) {
        // Artigos cobrindo o mesmo fato! Anexa a fonte relacionada
        isDuplicate = true;
        if (!existing.relatedSources) existing.relatedSources = [];
        if (!existing.relatedSources.some(s => s.name === current.source.name)) {
          existing.relatedSources.push({
            name: current.source.name,
            url: current.originalUrl,
          });
        }
        break;
      }
    }

    if (!isDuplicate) {
      current.relativeTime = formatRelativeTime(current.publishedAt);
      current.dayBucket = getDayBucket(current.publishedAt);
      deduped.push(current);
    }
  }

  // 3. Segmenta por Janela Temporal (Hoje -> Ontem -> Anteriores)
  const todayList = deduped.filter(a => a.dayBucket === 'today');
  const yesterdayList = deduped.filter(a => a.dayBucket === 'yesterday');
  const olderList = deduped.filter(a => a.dayBucket === 'older');

  // Intercala cada bucket para balancear fontes
  return [
    ...balanceSources(todayList),
    ...balanceSources(yesterdayList),
    ...balanceSources(olderList),
  ];
}

function balanceSources(articles: CleanArticle[]): CleanArticle[] {
  if (articles.length <= 2) return articles;

  const pools = new Map<string, CleanArticle[]>();
  for (const a of articles) {
    const list = pools.get(a.source.id) || [];
    list.push(a);
    pools.set(a.source.id, list);
  }

  const result: CleanArticle[] = [];
  let remaining = true;

  while (remaining) {
    remaining = false;
    for (const [_, list] of pools.entries()) {
      if (list.length > 0) {
        const item = list.shift()!;
        result.push(item);
        remaining = true;
      }
    }
  }

  return result;
}
