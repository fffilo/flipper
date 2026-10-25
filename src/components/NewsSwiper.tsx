'use client';

import type { NewsArticle } from '@/types';
import NewsItem from './NewsItem';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';

const SWIPE_THRESHOLD = 0.22;    // 22% da altura da tela para confirmar slide
const VELOCITY_THRESHOLD = 0.35; // px/ms — flick rápido também confirma
const RUBBER_FACTOR = 0.12;      // resistência nas bordas (efeito elástico)
const SNAP_EASING = 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
const LOAD_MORE_THRESHOLD = 5;

interface NewsSwiperProps {
  articles: NewsArticle[];
  seenArticleIds: string[];
  setSeenArticleIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  onOpenFeedManager: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

export default function NewsSwiper({
  articles,
  seenArticleIds,
  setSeenArticleIds,
  onOpenFeedManager,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: NewsSwiperProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isTransitioning = useRef(false);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const touchStartTime = useRef(0);
  const loadMoreTriggered = useRef(false);
  const activatedAt = useRef(Date.now());
  const prevIndexRef = useRef(0);
  const { trackDwell, trackClick } = usePreferences();

  // Pre-fetch inteligente das próximas imagens (UX fluida estilo Stories/TikTok)
  useEffect(() => {
    const nextArticles = [
      articles[activeIndex + 1],
      articles[activeIndex + 2],
    ].filter(Boolean);

    nextArticles.forEach(item => {
      if (item?.imageUrl && !item.imageUrl.includes('placehold.co')) {
        const img = new Image();
        img.src = item.imageUrl;
      }
    });
  }, [activeIndex, articles]);

  const showLoader = isLoadingMore || hasMore;
  const totalSlidesRef = useRef(0);
  totalSlidesRef.current = articles.length + (showLoader ? 1 : 0);

  const getVH = () => viewportRef.current?.clientHeight ?? window.innerHeight;

  const applyTransform = useCallback((extraOffset = 0, animated = false) => {
    if (!wrapperRef.current) return;
    const y = -activeIndexRef.current * getVH() + extraOffset;
    wrapperRef.current.style.transition = animated ? SNAP_EASING : 'none';
    wrapperRef.current.style.transform = `translateY(${y}px)`;
  }, []);

  const goToIndex = useCallback((newIndex: number) => {
    const clamped = Math.max(0, Math.min(newIndex, totalSlidesRef.current - 1));
    isTransitioning.current = true;
    activeIndexRef.current = clamped;
    setActiveIndex(clamped);
    applyTransform(0, true);
    setTimeout(() => { isTransitioning.current = false; }, 420);
  }, [applyTransform]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isTransitioning.current) return;
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    if (wrapperRef.current) wrapperRef.current.style.transition = 'none';
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isTransitioning.current) return;
    touchCurrentY.current = e.touches[0].clientY;
    let delta = touchCurrentY.current - touchStartY.current;

    // Resistência nas bordas: primeiro e último slide têm efeito elástico
    const atTop = activeIndexRef.current === 0;
    const atBottom = activeIndexRef.current >= totalSlidesRef.current - 1;
    if ((atTop && delta > 0) || (atBottom && delta < 0)) {
      delta *= RUBBER_FACTOR;
    }

    applyTransform(delta, false);
  }, [applyTransform]);

  const handleTouchEnd = useCallback(() => {
    if (isTransitioning.current) return;
    const delta = touchCurrentY.current - touchStartY.current;
    const elapsed = Math.max(Date.now() - touchStartTime.current, 1);
    const velocity = Math.abs(delta) / elapsed;
    const vh = getVH();
    const swipedEnough = Math.abs(delta) > vh * SWIPE_THRESHOLD;
    const fastEnough = velocity > VELOCITY_THRESHOLD;

    // Sempre avança apenas 1 slide por gesto, independente da velocidade
    if (delta < 0 && (swipedEnough || fastEnough)) {
      goToIndex(activeIndexRef.current + 1);
    } else if (delta > 0 && (swipedEnough || fastEnough)) {
      goToIndex(activeIndexRef.current - 1);
    } else {
      applyTransform(0, true); // snap de volta com animação elástica
    }
  }, [applyTransform, goToIndex]);

  // Resync transform quando artigos mudam (ex: novos artigos carregados)
  useEffect(() => {
    applyTransform(0, false);
  }, [articles, applyTransform]);

  // Load more
  useEffect(() => {
    const dist = articles.length - 1 - activeIndex;
    if (dist <= LOAD_MORE_THRESHOLD && hasMore && !isLoadingMore && !loadMoreTriggered.current) {
      loadMoreTriggered.current = true;
      onLoadMore();
    }
    if (dist > LOAD_MORE_THRESHOLD) loadMoreTriggered.current = false;
  }, [activeIndex, articles.length, hasMore, isLoadingMore, onLoadMore]);

  // Dwell time
  useEffect(() => {
    const now = Date.now();
    const dwell = now - activatedAt.current;
    if (prevIndexRef.current !== activeIndex && articles[prevIndexRef.current]) {
      trackDwell(articles[prevIndexRef.current], dwell);
    }
    prevIndexRef.current = activeIndex;
    activatedAt.current = now;
  }, [activeIndex]);

  // Marcar como visto (com debounce de 1.5s de permanência na notícia)
  useEffect(() => {
    const article = articles[activeIndex];
    if (!article || article.isDivider) return;

    const timer = setTimeout(() => {
      setSeenArticleIds(prev => {
        if (prev.includes(article.id)) return prev;
        return [...prev, article.id];
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [activeIndex, articles, setSeenArticleIds]);

  // Navegação por roda do mouse no desktop / notebook
  useEffect(() => {
    let lastWheelTime = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 30) return;
      const now = Date.now();
      if (now - lastWheelTime < 480) return; // Debounce de transição
      lastWheelTime = now;

      if (e.deltaY > 0) {
        goToIndex(activeIndexRef.current + 1);
      } else {
        goToIndex(activeIndexRef.current - 1);
      }
    };

    const vp = viewportRef.current;
    if (vp) {
      vp.addEventListener('wheel', onWheel, { passive: true });
    }
    return () => {
      if (vp) vp.removeEventListener('wheel', onWheel);
    };
  }, [goToIndex]);

  // Navegação por teclado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') goToIndex(activeIndexRef.current + 1);
      if (e.key === 'ArrowUp' || e.key === 'PageUp') goToIndex(activeIndexRef.current - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goToIndex]);

  if (articles.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background text-foreground p-4 text-center">
        <div className="bg-card p-6 rounded-lg shadow-xl">
          <p className="font-headline text-xl mb-2">Nenhuma Notícia no Feed</p>
          <p className="text-muted-foreground">O feed selecionado está vazio ou não retornou notícias.</p>
          <Button onClick={onOpenFeedManager} className="mt-4">Gerenciar Feeds</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      className="h-screen w-screen overflow-hidden touch-none select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        ref={wrapperRef}
        className="flex flex-col w-full"
        style={{ willChange: 'transform' }}
      >
        {articles.map((article, index) => (
          <div key={article.id} className="h-screen w-screen flex-shrink-0">
            <NewsItem
              article={article}
              isActive={index === activeIndex}
              shouldFetchSummary={index === activeIndex + 1}
              onArticleClick={trackClick}
            />
          </div>
        ))}

        {showLoader && (
          <div className="h-screen w-screen flex-shrink-0 flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Carregando mais notícias...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
