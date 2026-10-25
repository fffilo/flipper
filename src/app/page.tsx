'use client';

import { useState, useEffect, useCallback } from 'react';
import NewsSwiper from '@/components/NewsSwiper';
import FeedManager, { type FeedFilter } from '@/components/FeedManager';
import FlippyLogo from '@/components/FlippyLogo';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings } from 'lucide-react';
import type { NewsArticle, FeedSource } from '@/types';
import { DEFAULT_FEEDS } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';

export default function Home() {
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [isFeedManagerOpen, setIsFeedManagerOpen] = useState(false);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [feedSources, setFeedSources] = useLocalStorage<FeedSource[]>('flippy-feedSources', DEFAULT_FEEDS);
  const [seenArticleIds, setSeenArticleIds] = useLocalStorage<string[]>('flippy-seenArticleIds', []);

  const loadFeed = useCallback(async (currentFilter: FeedFilter, isPullRefresh = false) => {
    if (isPullRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (currentFilter === 'br') params.set('region', 'br');
      if (currentFilter === 'world') params.set('region', 'world');
      if (currentFilter === 'tech') params.set('category', 'tech');

      const res = await fetch(`/api/feed?${params.toString()}`);
      if (!res.ok) throw new Error(`Falha ao carregar notícias (${res.status})`);

      const data = await res.json();
      if (data.articles && data.articles.length > 0) {
        setArticles(data.articles);
      } else {
        setError('Nenhuma notícia recente encontrada no momento.');
      }
    } catch (e: any) {
      console.error('[loadFeed] erro:', e);
      setError('Não foi possível conectar às fontes de notícias. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed(filter);
  }, [filter, loadFeed]);

  const handleSeenArticleIds = useCallback(
    (ids: string[] | ((prev: string[]) => string[])) => {
      setSeenArticleIds(prev => {
        const next = typeof ids === 'function' ? ids(prev) : ids;
        return next.length > 500 ? next.slice(-500) : next;
      });
    },
    [setSeenArticleIds]
  );

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Top Header Limpo: Apenas Logo e Engrenagem */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto">
          <FlippyLogo />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsFeedManagerOpen(true)}
          className="text-white hover:bg-white/10 rounded-full h-10 w-10 backdrop-blur-md bg-black/30 border border-white/10 pointer-events-auto transition-transform active:scale-95 shadow-md"
        >
          <Settings className="h-5 w-5" />
          <span className="sr-only">Configurações e Feeds</span>
        </Button>
      </header>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="h-screen w-screen flex flex-col items-center justify-center p-4 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
            <Skeleton className="h-6 w-1/4 rounded-full bg-white/20" />
            <Skeleton className="h-8 w-5/6 rounded-md bg-white/20" />
            <Skeleton className="h-4 w-full rounded-md bg-white/10" />
            <Skeleton className="h-4 w-4/5 rounded-md bg-white/10" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-4 w-28 rounded-md bg-white/10" />
              <Skeleton className="h-9 w-32 rounded-md bg-white/20" />
            </div>
          </div>
        </div>
      )}

      {/* Tela de Erro */}
      {!isLoading && error && (
        <div className="flex items-center justify-center h-screen w-screen bg-background text-foreground p-4 text-center">
          <div className="bg-card/90 backdrop-blur-md p-6 rounded-2xl border border-border max-w-sm shadow-xl">
            <p className="font-headline text-lg font-bold text-destructive mb-2">Erro ao carregar notícias</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => loadFeed(filter)} className="w-full">
              Tentar Novamente
            </Button>
          </div>
        </div>
      )}

      {/* Feed Principal com NewsSwiper */}
      {!isLoading && !error && articles.length > 0 && (
        <NewsSwiper
          articles={articles}
          seenArticleIds={seenArticleIds}
          setSeenArticleIds={handleSeenArticleIds}
          onOpenFeedManager={() => setIsFeedManagerOpen(true)}
          onLoadMore={() => {}}
          hasMore={false}
          isLoadingMore={false}
        />
      )}

      {/* Menu Lateral de Configurações e Gerenciador de Feeds */}
      <FeedManager
        isOpen={isFeedManagerOpen}
        onOpenChange={setIsFeedManagerOpen}
        feedSources={feedSources}
        onFeedSourcesChange={setFeedSources}
        currentFilter={filter}
        onFilterChange={setFilter}
        onRefresh={() => loadFeed(filter, true)}
        isRefreshing={isRefreshing}
      />
    </main>
  );
}
