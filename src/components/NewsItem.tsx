'use client';

import type { NewsArticle } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { generateSummary } from '@/app/actions';

interface NewsItemProps {
  article: NewsArticle;
  isActive: boolean;
  shouldFetchSummary?: boolean;
  onArticleClick?: (article: NewsArticle) => void;
}

const PLACEHOLDER = 'https://placehold.co/1080x1920.png';

export default function NewsItem({ article, isActive, shouldFetchSummary, onArticleClick }: NewsItemProps) {
  const [aiText, setAiText] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const fetchedRef = useRef(false);

  // Reset when article changes
  useEffect(() => {
    setAiText(null);
    setLoadingAi(false);
    fetchedRef.current = false;
  }, [article.id]);

  // Se for o card divisor de transição
  if (article.isDivider) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#121212] via-[#161c28] to-[#121212] text-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mb-6 shadow-lg shadow-primary/10">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>

        <h2 className="font-headline text-2xl sm:text-3xl font-bold mb-3 text-white max-w-sm">
          {article.title}
        </h2>

        <p className="font-body text-sm sm:text-base text-white/70 max-w-xs mb-8 leading-relaxed">
          {article.description}
        </p>

        <div className="flex flex-col items-center gap-2 animate-bounce opacity-80">
          <span className="text-xs text-white/60 font-body">Deslize para continuar</span>
          <ChevronDown className="w-5 h-5 text-primary" />
        </div>
      </div>
    );
  }

  // Call Gemini only when description is absent and we have articleText
  useEffect(() => {
    if (fetchedRef.current) return;
    if (!isActive && !shouldFetchSummary) return;

    const hasText = article.description && article.description.length > 30;
    const hasCached = article.aiSummary;
    if (hasText || hasCached) return;

    if (!article.articleText || article.articleText.length < 50) return;

    fetchedRef.current = true;
    setLoadingAi(true);

    generateSummary(article.id, article.articleText)
      .then(({ summary, isAi }) => {
        if (summary) setAiText(summary);
        void isAi;
      })
      .catch(() => { /* silent fail */ })
      .finally(() => setLoadingAi(false));
  }, [isActive, shouldFetchSummary, article]);

  const displayText = aiText || article.aiSummary || article.description || '';
  const isAi = !!(aiText || (article.isAiSummary && article.aiSummary));

  const handleOpen = () => {
    if (article.originalUrl && article.originalUrl !== '#') {
      onArticleClick?.(article);
      window.open(article.originalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-background">
      <img
        src={article.imageUrl}
        alt={article.title}
        loading="eager"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ willChange: 'transform' }}
        data-ai-hint={article.imageAiHint || 'news background'}
        onError={(e) => {
          const t = e.target as HTMLImageElement;
          if (t.src !== PLACEHOLDER) {
            t.src = PLACEHOLDER;
            t.onerror = null;
          }
        }}
      />

      {/* Gradiente em duas camadas: escurece o fundo sem degradar a imagem */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10 pointer-events-none" />

      <div className="absolute bottom-0 left-0 right-0 pt-4 px-4 pb-20 sm:pt-6 sm:px-6 sm:pb-20 md:pt-8 md:px-8 md:pb-24 text-foreground">
        <h2
          className="font-headline text-2xl sm:text-3xl font-bold mb-2 sm:mb-3"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
        >
          {article.title}
        </h2>

        <div className="min-h-[5rem] mb-3 sm:mb-4">
          {loadingAi ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          ) : (
            <p className="font-body text-sm sm:text-base md:text-lg text-white/90 whitespace-pre-line leading-relaxed line-clamp-5"
               style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
              {displayText || 'Conteúdo não disponível.'}
            </p>
          )}
        </div>

        <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {article.sourceName && (
                <span
                  className="font-body text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm text-white shadow-sm"
                  style={{
                    backgroundColor: article.brandColor || article.source?.brandColor || '#29ABE2',
                  }}
                >
                  {article.sourceName}
                </span>
              )}

              {article.dayBucket && article.dayBucket !== 'today' && (
                <span className="font-body text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-white/20 text-white/90 backdrop-blur-sm">
                  {article.dayBucket === 'yesterday' ? 'Ontem' : 'Anterior'}
                </span>
              )}

              {article.relativeTime && (
                <span className="text-xs text-white/70 font-body">
                  • {article.relativeTime}
                </span>
              )}
            </div>

            {article.relatedSources && article.relatedSources.length > 0 && (
              <p className="text-[11px] text-white/60">
                Também coberto por: {article.relatedSources.map(s => s.name).join(', ')}
              </p>
            )}

            {isAi && !loadingAi && (
              <p className="text-xs text-muted-foreground italic mb-0.5">Resumido por IA</p>
            )}
          </div>

          <Button
            onClick={handleOpen}
            variant="outline"
            size="sm"
            className="font-body shrink-0 border-white/20 bg-black/40 hover:bg-black/60 text-white"
            disabled={!article.originalUrl || article.originalUrl === '#'}
          >
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Ler matéria
          </Button>
        </div>
      </div>
    </div>
  );
}
