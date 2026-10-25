import { NextResponse } from 'next/server';
import { getFeedSWR } from '@/lib/news-engine/engine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = (searchParams.get('region') as 'br' | 'world') || undefined;
  const category = searchParams.get('category') || undefined;
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 15;

  const start = performance.now();
  const { articles, hasMore, total, source } = await getFeedSWR({ region, category, page, limit });
  const latencyMs = Math.round(performance.now() - start);

  return NextResponse.json(
    {
      articles,
      hasMore,
      meta: {
        page,
        limit,
        total,
        returned: articles.length,
        cacheStatus: source,
        latencyMs,
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=1200',
        'X-Flippy-Cache': source,
        'X-Response-Time': `${latencyMs}ms`,
      },
    }
  );
}
