import { SEED_SOURCES } from './sources';
import { fetchWithTimeout } from './http-client';
import { parseFeed } from './feed-parser';
import { applyQualityGates } from './quality-gate';
import type { CleanArticle, FeedSourceConfig } from './types';

interface CacheEntry {
  articles: CleanArticle[];
  timestamp: number;
  isRevalidating?: boolean;
}

const FRESH_TTL_MS = 4 * 60 * 1000;      // 4 minutos: responde na hora da RAM
const STALE_TTL_MS = 60 * 60 * 1000;     // 1 hora: responde stale e revalida em background
const DEFAULT_PAGE_SIZE = 15;

declare global {
  var __flippy_news_cache__: Map<string, CacheEntry> | undefined;
}

const cache = globalThis.__flippy_news_cache__ ?? new Map<string, CacheEntry>();
globalThis.__flippy_news_cache__ = cache;

export async function fetchFromSource(source: FeedSourceConfig): Promise<CleanArticle[]> {
  try {
    const xml = await fetchWithTimeout(source.url, 4000);
    if (!xml) return [];
    return await parseFeed(xml, source);
  } catch {
    return [];
  }
}

export async function aggregateFeeds(options?: {
  region?: 'br' | 'world';
  category?: string;
  customSources?: FeedSourceConfig[];
}): Promise<CleanArticle[]> {
  const sourcesToFetch = (options?.customSources || SEED_SOURCES).filter(s => {
    if (s.enabled === false) return false;
    if (options?.region && s.region !== options.region) return false;
    if (options?.category && options.category !== 'all' && s.category !== options.category) return false;
    return true;
  });

  const results = await Promise.allSettled(sourcesToFetch.map(s => fetchFromSource(s)));
  const allArticles: CleanArticle[] = [];

  for (const res of results) {
    if (res.status === 'fulfilled' && res.value.length > 0) {
      allArticles.push(...res.value);
    }
  }

  // Ordena preliminarmente por data decrescente
  allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Aplica Quality Gates: Frescor, Imagens válidas, Deduplicação e Segmentação por Janela Temporal
  return applyQualityGates(allArticles);
}

export async function getFeedSWR(options?: {
  region?: 'br' | 'world';
  category?: string;
  page?: number;
  limit?: number;
}): Promise<{
  articles: CleanArticle[];
  hasMore: boolean;
  total: number;
  source: 'FRESH' | 'STALE' | 'MISS';
}> {
  const key = `${options?.region || 'all'}:${options?.category || 'all'}`;
  const page = Math.max(1, options?.page || 1);
  const limit = Math.max(1, options?.limit || DEFAULT_PAGE_SIZE);

  let cached = cache.get(key);
  const now = Date.now();
  let cacheSource: 'FRESH' | 'STALE' | 'MISS' = 'MISS';

  // 1. FRESH HIT (< 4 minutos)
  if (cached && now - cached.timestamp < FRESH_TTL_MS) {
    cacheSource = 'FRESH';
  }
  // 2. STALE HIT (< 1 hora) -> Responde na hora e atualiza em background
  else if (cached && now - cached.timestamp < STALE_TTL_MS) {
    cacheSource = 'STALE';
    const entry = cached;
    if (!entry.isRevalidating) {
      entry.isRevalidating = true;
      aggregateFeeds(options)
        .then(freshArticles => {
          if (freshArticles.length > 0) {
            cache.set(key, { articles: freshArticles, timestamp: Date.now(), isRevalidating: false });
          } else {
            entry.isRevalidating = false;
          }
        })
        .catch(() => {
          entry.isRevalidating = false;
        });
    }
  }
  // 3. CACHE MISS -> Busca na hora
  else {
    cacheSource = 'MISS';
    const fresh = await aggregateFeeds(options);
    if (fresh.length > 0) {
      cache.set(key, { articles: fresh, timestamp: now, isRevalidating: false });
      cached = { articles: fresh, timestamp: now, isRevalidating: false };
    }
  }

  const all = cached?.articles || [];
  const start = (page - 1) * limit;
  const paginatedArticles = all.slice(start, start + limit);
  const hasMore = all.length > start + limit;

  return {
    articles: paginatedArticles,
    hasMore,
    total: all.length,
    source: cacheSource,
  };
}
